package com.flexcms.replication.service;

import com.flexcms.core.event.ContentIndexEvent;
import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.replication.model.ReplicationEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Publish-side replication receiver: consumes events and updates the local content store.
 */
@Service
@ConditionalOnProperty(name = "flexcms.runmode", havingValue = "publish")
public class ReplicationReceiver {

    private static final Logger log = LoggerFactory.getLogger(ReplicationReceiver.class);

    @Autowired
    private ContentNodeRepository nodeRepository;

    @Autowired
    private AuthorNodeClient authorNodeClient;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @RabbitListener(queues = "#{publishQueue.name}")
    @Transactional
    public void handleReplication(ReplicationEvent event) {
        log.info("Received replication event: {} {} {}", event.getAction(), event.getType(), event.getPath());

        switch (event.getAction()) {
            case ACTIVATE -> activateContent(event);
            case DEACTIVATE -> deactivateContent(event);
            case DELETE -> deleteContent(event);
        }
    }

    private void activateContent(ReplicationEvent event) {
        if (event.getType() == ReplicationEvent.ReplicationType.TREE) {
            activateTree(event);
            return;
        }
        ContentNode saved = activateSingleNode(event.getPath(), event.getResourceType(), event.getParentPath(),
                event.getSiteId(), event.getLocale(), event.getNodeProperties(),
                event.getOrderIndex(), event.getVersion());
        eventPublisher.publishEvent(ContentIndexEvent.index(this, saved));
    }

    /**
     * Tree activation: fetch each affected node from the author and upsert it.
     *
     * <p>Tree events carry only path lists — not node payloads — so each node
     * must be fetched individually via {@link AuthorNodeClient}. Nodes that
     * cannot be fetched (e.g. author temporarily unreachable) are skipped
     * and logged as warnings.</p>
     */
    private void activateTree(ReplicationEvent event) {
        List<String> paths = event.getAffectedPaths();
        if (paths == null || paths.isEmpty()) {
            log.warn("Tree activation event for '{}' has no affected paths — skipping", event.getPath());
            return;
        }

        log.info("Tree activation: fetching {} nodes from author, root={}", paths.size(), event.getPath());
        int succeeded = 0;
        int failed = 0;

        for (String path : paths) {
            try {
                Map<String, Object> nodeData = authorNodeClient.fetchNode(path)
                        .orElse(null);

                if (nodeData == null) {
                    log.warn("Could not fetch node '{}' from author — skipping", path);
                    failed++;
                    continue;
                }

                ContentNode saved = activateSingleNode(
                        path,
                        (String) nodeData.get("resourceType"),
                        (String) nodeData.get("parentPath"),
                        (String) nodeData.getOrDefault("siteId", event.getSiteId()),
                        (String) nodeData.getOrDefault("locale", event.getLocale()),
                        castProperties(nodeData.get("properties")),
                        nodeData.get("orderIndex") instanceof Number n ? n.intValue() : null,
                        nodeData.get("version") instanceof Number n ? n.longValue() : null
                );
                eventPublisher.publishEvent(ContentIndexEvent.index(this, saved));
                succeeded++;
            } catch (Exception e) {
                log.error("Error activating node '{}' during tree replication: {}", path, e.getMessage());
                failed++;
            }
        }

        log.info("Tree activation complete: {}/{} nodes activated (root={})", succeeded, paths.size(), event.getPath());
        if (failed > 0) {
            log.warn("Tree activation: {} nodes failed — partial tree on publish tier", failed);
        }
    }

    /**
     * Upsert a single content node into the publish store.
     *
     * @return the saved {@link ContentNode} (used by the caller to fire a search index event)
     */
    private ContentNode activateSingleNode(String path, String resourceType, String parentPath,
                                            String siteId, String locale,
                                            Map<String, Object> properties, Integer orderIndex, Long version) {
        var existing = nodeRepository.findByPath(path);
        ContentNode node;

        if (existing.isPresent()) {
            node = existing.get();
        } else {
            node = new ContentNode(path,
                    extractName(path),
                    resourceType != null ? resourceType : "flexcms/page");
            node.setParentPath(parentPath);
            node.setSiteId(siteId);
            node.setLocale(locale);
        }

        if (properties != null) {
            node.setProperties(new HashMap<>(properties));
        }
        if (resourceType != null) {
            node.setResourceType(resourceType);
        }
        if (orderIndex != null) {
            node.setOrderIndex(orderIndex);
        }
        node.setVersion(version != null ? version : node.getVersion());
        node.setStatus(NodeStatus.PUBLISHED);

        node = nodeRepository.save(node);
        log.debug("Activated content on publish: {}", path);
        return node;
    }

    private void deactivateContent(ReplicationEvent event) {
        nodeRepository.findByPath(event.getPath()).ifPresent(node -> {
            node.setStatus(NodeStatus.DRAFT);
            nodeRepository.save(node);
            log.info("Deactivated content on publish: {}", event.getPath());
        });
        eventPublisher.publishEvent(ContentIndexEvent.remove(this, event.getPath()));
    }

    private void deleteContent(ReplicationEvent event) {
        nodeRepository.deleteSubtree(event.getPath());
        log.info("Deleted content from publish: {}", event.getPath());
        eventPublisher.publishEvent(ContentIndexEvent.remove(this, event.getPath()));
    }

    private String extractName(String path) {
        if (path == null) return "unknown";
        String[] parts = path.split("\\.");
        return parts[parts.length - 1];
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> castProperties(Object value) {
        if (value instanceof Map<?, ?> m) {
            return (Map<String, Object>) m;
        }
        return null;
    }
}
