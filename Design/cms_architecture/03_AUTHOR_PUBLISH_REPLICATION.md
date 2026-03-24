# Author/Publish Environment & Content Replication

## 1. Dual Environment Architecture

FlexCMS separates concerns into two distinct runtime environments that share the same codebase but run in different modes.

### 1.1 Author Environment

```
Purpose: Content creation, editing, previewing, and workflow management
Mode:    READ-WRITE
Scale:   2-3 nodes (HA, not massive scale)
Access:  Authenticated users only (RBAC)

Capabilities:
  - Full CRUD on content tree
  - Visual page editor (WYSIWYG)
  - Component drag-and-drop
  - Dialog-based editing
  - Preview rendering
  - Workflow management (submit, approve, reject)
  - Version management (create, compare, restore)
  - Content publish/unpublish triggers
  - DAM asset upload and management
  - Multi-site and multi-language management
  - User and permission management
```

### 1.2 Publish Environment

```
Purpose: Content delivery to end users
Mode:    READ-ONLY
Scale:   N nodes (auto-scale based on traffic)
Access:  Public (or gated with lightweight auth for intranets)

Capabilities:
  - JSON API delivery (REST + GraphQL) — consumed by frontend SSR frameworks (Next.js, Nuxt, etc.)
  - Headless API (REST + GraphQL)
  - Content search (Elasticsearch)
  - URL resolution and redirects
  - CDN integration
  - Cache management
  - Asset delivery via CDN

NOT Available on Publish:
  - No content editing APIs
  - No workflow management
  - No DAM uploads
  - No authoring UI
```

### 1.3 Environment Configuration

```yaml
# application-author.yml
flexcms:
  runmode: author
  features:
    authoring-ui: true
    workflows: true
    preview: true
    replication-agent: true    # Sends content to publish
    dam-upload: true
    version-management: true
  database:
    mode: read-write
    url: jdbc:postgresql://author-db:5432/flexcms

# application-publish.yml
flexcms:
  runmode: publish
  features:
    authoring-ui: false
    workflows: false
    preview: false
    replication-receiver: true  # Receives content from author
    dam-upload: false
    version-management: false
  database:
    mode: read-only
    url: jdbc:postgresql://publish-db:5432/flexcms
  cache:
    enabled: true
    default-ttl: 3600
```

---

## 2. Content Replication System

### 2.1 Replication Architecture

```
  Author Instance                          Publish Instance(s)
  +-----------------+                      +------------------+
  | Content Edit    |                      | Replication      |
  |     |           |                      | Receiver         |
  |     v           |                      |    |             |
  | Replication     |    RabbitMQ          |    v             |
  | Agent     ------+---> [topic:          |  Content Store   |
  |                 |      content.         |  (update node)   |
  |                 |      replicate]  --->-+    |             |
  |                 |                      |    v             |
  |                 |    RabbitMQ          |  Cache Invalidate|
  |                 +---> [topic:          |    |             |
  |                 |      asset.    ---->-+  Asset Store     |
  |                 |      replicate]      |  (sync from S3)  |
  |                 |                      |    |             |
  |                 |    RabbitMQ          |    v             |
  |                 +---> [topic:          |  Search Index    |
  |                 |      cache.    ---->-+  (re-index)      |
  |                 |      invalidate]     |    |             |
  |                 |                      |    v             |
  |                 |                      |  CDN Purge       |
  +-----------------+                      +------------------+
```

### 2.2 Replication Event Model

```java
public class ReplicationEvent {
    private UUID eventId;
    private ReplicationAction action;  // ACTIVATE, DEACTIVATE, DELETE
    private String path;               // Content node path
    private UUID nodeId;               // Content node ID
    private Long version;              // Version being replicated
    private String siteId;
    private String locale;
    private Instant timestamp;
    private String initiatedBy;        // User who triggered
    private ReplicationType type;      // CONTENT, ASSET, TREE

    // For TREE replication (page + all children)
    private List<String> affectedPaths;

    // For ASSET replication
    private String assetPath;
    private List<String> renditionKeys;
}

public enum ReplicationAction {
    ACTIVATE,    // Publish content (make live)
    DEACTIVATE,  // Unpublish content (remove from live)
    DELETE        // Permanently remove from publish
}
```

### 2.3 Replication Agent (Author Side)

```java
@Service
@ConditionalOnProperty(name = "flexcms.runmode", havingValue = "author")
public class ReplicationAgent {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Autowired
    private ContentNodeRepository nodeRepository;

    @Autowired
    private ReplicationLogRepository replicationLog;

    /**
     * Replicate a single content node to all publish instances.
     */
    @Transactional
    public ReplicationResult replicate(String path, ReplicationAction action, String userId) {
        ContentNode node = nodeRepository.findByPath(path)
            .orElseThrow(() -> new NodeNotFoundException(path));

        // Validate node is in correct workflow state
        if (action == ReplicationAction.ACTIVATE) {
            validateApprovedForPublish(node);
            node.setStatus(NodeStatus.PUBLISHED);
            nodeRepository.save(node);
        }

        // Build event
        ReplicationEvent event = ReplicationEvent.builder()
            .eventId(UUID.randomUUID())
            .action(action)
            .path(path)
            .nodeId(node.getId())
            .version(node.getVersion())
            .siteId(node.getSiteId())
            .locale(node.getLocale())
            .timestamp(Instant.now())
            .initiatedBy(userId)
            .type(ReplicationType.CONTENT)
            .build();

        // Publish to message queue
        rabbitTemplate.convertAndSend(
            "flexcms.replication",
            "content.replicate",
            event
        );

        // Log replication
        replicationLog.save(new ReplicationLogEntry(event));

        return ReplicationResult.success(event.getEventId());
    }

    /**
     * Tree activation: replicate a page and all its descendants.
     */
    @Transactional
    public ReplicationResult replicateTree(String rootPath, String userId) {
        List<ContentNode> nodes = nodeRepository.findByPathDescendants(rootPath);
        List<String> affectedPaths = nodes.stream()
            .map(ContentNode::getPath)
            .collect(Collectors.toList());

        ReplicationEvent event = ReplicationEvent.builder()
            .action(ReplicationAction.ACTIVATE)
            .path(rootPath)
            .type(ReplicationType.TREE)
            .affectedPaths(affectedPaths)
            .initiatedBy(userId)
            .build();

        rabbitTemplate.convertAndSend("flexcms.replication", "content.replicate.tree", event);

        return ReplicationResult.success(event.getEventId());
    }
}
```

### 2.4 Replication Receiver (Publish Side)

```java
@Service
@ConditionalOnProperty(name = "flexcms.runmode", havingValue = "publish")
public class ReplicationReceiver {

    @Autowired
    private PublishContentStore publishStore;

    @Autowired
    private CacheInvalidationService cacheService;

    @Autowired
    private SearchIndexService searchService;

    @Autowired
    private CdnPurgeService cdnService;

    @RabbitListener(queues = "#{publishQueueName}")
    @Transactional
    public void handleReplication(ReplicationEvent event) {
        switch (event.getAction()) {
            case ACTIVATE -> activateContent(event);
            case DEACTIVATE -> deactivateContent(event);
            case DELETE -> deleteContent(event);
        }
    }

    private void activateContent(ReplicationEvent event) {
        // 1. Fetch full node data from Author API (or embedded in event)
        ContentNode node = fetchNodeFromAuthor(event.getNodeId(), event.getVersion());

        // 2. Upsert into publish content store
        publishStore.upsert(node);

        // 3. Invalidate caches for affected paths
        cacheService.invalidate(event.getPath());
        cacheService.invalidatePatterns(
            event.getSiteId(),
            event.getPath()
        );

        // 4. Re-index in search
        searchService.index(node);

        // 5. Purge CDN for affected URLs
        List<String> urls = resolvePublicUrls(event);
        cdnService.purge(urls);
    }
}
```

### 2.5 Asset Replication

```java
@Service
@ConditionalOnProperty(name = "flexcms.runmode", havingValue = "author")
public class AssetReplicationAgent {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Autowired
    private S3Client s3Client;

    /**
     * When an asset is published, trigger S3 cross-region replication
     * and notify publish instances to update their metadata cache.
     */
    public void replicateAsset(String assetPath, List<String> renditionKeys) {
        // S3 cross-region replication handles the binary data
        // We just need to sync the metadata

        ReplicationEvent event = ReplicationEvent.builder()
            .action(ReplicationAction.ACTIVATE)
            .type(ReplicationType.ASSET)
            .assetPath(assetPath)
            .renditionKeys(renditionKeys)
            .build();

        rabbitTemplate.convertAndSend("flexcms.replication", "asset.replicate", event);
    }
}
```

---

## 3. Replication Queue Configuration

### 3.1 RabbitMQ Topology

```java
@Configuration
public class ReplicationQueueConfig {

    // Exchange for all replication events
    @Bean
    public TopicExchange replicationExchange() {
        return new TopicExchange("flexcms.replication", true, false);
    }

    // Each publish instance gets its own queue
    // (ensures all instances receive every event)
    @Bean
    @ConditionalOnProperty(name = "flexcms.runmode", havingValue = "publish")
    public Queue publishQueue(@Value("${flexcms.instance.id}") String instanceId) {
        return new Queue("flexcms.publish." + instanceId, true);
    }

    @Bean
    @ConditionalOnProperty(name = "flexcms.runmode", havingValue = "publish")
    public Binding contentBinding(Queue publishQueue, TopicExchange exchange) {
        return BindingBuilder.bind(publishQueue).to(exchange).with("content.replicate.#");
    }

    @Bean
    @ConditionalOnProperty(name = "flexcms.runmode", havingValue = "publish")
    public Binding assetBinding(Queue publishQueue, TopicExchange exchange) {
        return BindingBuilder.bind(publishQueue).to(exchange).with("asset.replicate.#");
    }

    // Dead letter queue for failed replications
    @Bean
    public Queue deadLetterQueue() {
        return new Queue("flexcms.replication.dlq", true);
    }
}
```

### 3.2 Replication Monitoring

```java
@RestController
@RequestMapping("/api/admin/replication")
@PreAuthorize("hasRole('ADMIN')")
public class ReplicationMonitorController {

    @Autowired
    private ReplicationLogRepository replicationLog;

    @GetMapping("/status")
    public ReplicationStatus getStatus() {
        return ReplicationStatus.builder()
            .pendingEvents(replicationLog.countPending())
            .failedEvents(replicationLog.countFailed())
            .lastSuccessful(replicationLog.findLastSuccessful())
            .queueDepth(getQueueDepth())
            .build();
    }

    @GetMapping("/log")
    public Page<ReplicationLogEntry> getLog(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "50") int size
    ) {
        return replicationLog.findAll(PageRequest.of(page, size, Sort.by("timestamp").descending()));
    }

    @PostMapping("/retry/{eventId}")
    public ReplicationResult retry(@PathVariable UUID eventId) {
        return replicationService.retry(eventId);
    }
}
```

---

## 4. Workflow Engine

### 4.1 Workflow Definition

```json
{
  "name": "standard-publish",
  "title": "Standard Publish Workflow",
  "description": "Author -> Review -> Approve -> Publish",
  "steps": [
    {
      "id": "draft",
      "type": "start",
      "title": "Draft",
      "transitions": [
        {"target": "review", "action": "submit", "label": "Submit for Review"}
      ]
    },
    {
      "id": "review",
      "type": "participant",
      "title": "In Review",
      "assignee": "role:content-reviewer",
      "notifications": ["email", "in-app"],
      "transitions": [
        {"target": "approved", "action": "approve", "label": "Approve"},
        {"target": "draft", "action": "reject", "label": "Reject", "requireComment": true}
      ]
    },
    {
      "id": "approved",
      "type": "participant",
      "title": "Approved",
      "assignee": "role:content-publisher",
      "autoAdvance": {
        "enabled": true,
        "delay": "0",
        "condition": "node.site.autoPublish == true"
      },
      "transitions": [
        {"target": "published", "action": "publish", "label": "Publish Now"},
        {"target": "scheduled", "action": "schedule", "label": "Schedule Publish"},
        {"target": "draft", "action": "reject", "label": "Send Back"}
      ]
    },
    {
      "id": "scheduled",
      "type": "timer",
      "title": "Scheduled",
      "timerField": "scheduledPublishDate",
      "transitions": [
        {"target": "published", "action": "timer-fire", "label": "Auto Publish"},
        {"target": "approved", "action": "cancel", "label": "Cancel Schedule"}
      ]
    },
    {
      "id": "published",
      "type": "process",
      "title": "Published",
      "actions": ["replicate-activate"],
      "transitions": [
        {"target": "draft", "action": "unpublish", "label": "Unpublish"}
      ]
    }
  ]
}
```

### 4.2 Workflow Engine Service

```java
@Service
public class WorkflowEngine {

    @Autowired
    private WorkflowDefinitionRepository workflowRepo;

    @Autowired
    private WorkflowInstanceRepository instanceRepo;

    @Autowired
    private ReplicationAgent replicationAgent;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public WorkflowInstance advance(UUID instanceId, String action, String userId, String comment) {
        WorkflowInstance instance = instanceRepo.findById(instanceId)
            .orElseThrow();

        WorkflowDefinition definition = workflowRepo.findByName(instance.getWorkflowName());
        WorkflowStep currentStep = definition.getStep(instance.getCurrentStepId());

        // Find matching transition
        WorkflowTransition transition = currentStep.getTransitions().stream()
            .filter(t -> t.getAction().equals(action))
            .findFirst()
            .orElseThrow(() -> new InvalidTransitionException(action, currentStep.getId()));

        // Execute transition
        instance.setCurrentStepId(transition.getTarget());
        instance.setPreviousStepId(currentStep.getId());
        instance.setLastAction(action);
        instance.setLastActionBy(userId);
        instance.setLastComment(comment);

        // Execute step actions (e.g., replicate on publish)
        WorkflowStep nextStep = definition.getStep(transition.getTarget());
        executeStepActions(nextStep, instance);

        // Send notifications
        sendStepNotifications(nextStep, instance);

        instanceRepo.save(instance);
        return instance;
    }

    private void executeStepActions(WorkflowStep step, WorkflowInstance instance) {
        if (step.getActions() != null) {
            for (String actionName : step.getActions()) {
                switch (actionName) {
                    case "replicate-activate" ->
                        replicationAgent.replicate(
                            instance.getContentPath(),
                            ReplicationAction.ACTIVATE,
                            instance.getLastActionBy()
                        );
                    case "replicate-deactivate" ->
                        replicationAgent.replicate(
                            instance.getContentPath(),
                            ReplicationAction.DEACTIVATE,
                            instance.getLastActionBy()
                        );
                }
            }
        }
    }
}
```

---

## 5. Scaling Strategy

### 5.1 Author Environment Scaling

```
Load Balancer (sticky sessions for authoring UI)
       |
  +----+----+
  |         |
Author-1  Author-2   (Active-Active, 2-3 instances)
  |         |
  +----+----+
       |
  PostgreSQL Primary (+ standby for HA)
       |
  Redis Cluster (sessions + L2 cache)
       |
  S3 Bucket (DAM assets)
```

### 5.2 Publish Environment Scaling

```
CDN (CloudFront/Cloudflare)
       |
Load Balancer (round-robin, health checks)
       |
  +----+----+----+----+
  |    |    |    |    |
Pub-1 Pub-2 Pub-3 Pub-4 ... Pub-N  (Auto-scale group)
  |    |    |    |    |
  +----+----+----+----+
       |
  PostgreSQL Read Replicas (per region)
       |
  Redis Cluster (shared L2 cache)
       |
  Elasticsearch Cluster (search)
       |
  S3 Bucket (replicated assets)
```

### 5.3 Auto-Scaling Rules

```yaml
# Kubernetes HPA for publish instances
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: flexcms-publish
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: flexcms-publish
  minReplicas: 3
  maxReplicas: 50
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "1000"
```
