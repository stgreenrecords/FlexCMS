package com.flexcms.replication;

import com.flexcms.core.event.AssetDeletedEvent;
import com.flexcms.core.event.ContentStatusChangedEvent;
import com.flexcms.core.model.Asset;
import com.flexcms.core.model.AssetRendition;
import com.flexcms.core.model.AssetStatus;
import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.core.model.ReplicationLogEntry;
import com.flexcms.core.repository.AssetRenditionRepository;
import com.flexcms.core.repository.AssetRepository;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.core.repository.ReplicationLogRepository;
import com.flexcms.replication.config.ReplicationQueueConfig;
import com.flexcms.replication.model.ReplicationEvent;
import com.flexcms.replication.service.ReplicationAgent;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.rabbitmq.RabbitMQContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Integration tests for {@link ReplicationAgent}: verifies that the author-side service
 * actually publishes {@link ReplicationEvent} messages to a real RabbitMQ broker and
 * updates the PostgreSQL database state correctly.
 */
@SpringBootTest
@Testcontainers
@ActiveProfiles("replication-it")
@TestPropertySource(properties = "flexcms.runmode=author")
class ReplicationAgentIT {

    // ── Containers ─────────────────────────────────────────────────────────────

    @Container
    static final RabbitMQContainer rabbitmq =
            new RabbitMQContainer("rabbitmq:3.13-management-alpine");

    @Container
    static final PostgreSQLContainer postgres =
            new PostgreSQLContainer("postgres:16-alpine")
                    .withDatabaseName("flexcms_test")
                    .withUsername("flexcms")
                    .withPassword("flexcms");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.rabbitmq.host", rabbitmq::getHost);
        registry.add("spring.rabbitmq.port", rabbitmq::getAmqpPort);
        registry.add("spring.rabbitmq.username", rabbitmq::getAdminUsername);
        registry.add("spring.rabbitmq.password", rabbitmq::getAdminPassword);
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    // ── Injected beans ─────────────────────────────────────────────────────────

    @Autowired ReplicationAgent replicationAgent;
    @Autowired ContentNodeRepository nodeRepository;
    @Autowired ReplicationLogRepository replicationLogRepository;
    @Autowired AssetRepository assetRepository;
    @Autowired AssetRenditionRepository renditionRepository;
    @Autowired AmqpAdmin amqpAdmin;
    @Autowired RabbitTemplate amqpTemplate;
    @Autowired TopicExchange replicationExchange;
    @Autowired ApplicationEventPublisher eventPublisher;
    @Autowired TransactionTemplate transactionTemplate;

    /** Temporary queue created per-test to capture messages sent by the agent. */
    private String captureQueueName;

    // ── Lifecycle ──────────────────────────────────────────────────────────────

    @BeforeEach
    void setUp() {
        // Create a transient, auto-delete queue and bind it to the exchange
        // so we can assert that messages actually arrive at the broker.
        captureQueueName = "test.capture." + UUID.randomUUID();
        // Not auto-delete: a timed receiveAndConvert attaches a temporary consumer, and
        // cancelling it deletes an auto-delete queue — a test reading two messages then
        // finds the queue gone (404 NOT_FOUND). tearDown() deletes it explicitly.
        amqpAdmin.declareQueue(new Queue(captureQueueName, false, false, false));
        amqpAdmin.declareBinding(new Binding(captureQueueName, Binding.DestinationType.QUEUE,
                ReplicationQueueConfig.EXCHANGE_NAME, "content.replicate.#", null));
        amqpAdmin.declareBinding(new Binding(captureQueueName, Binding.DestinationType.QUEUE,
                ReplicationQueueConfig.EXCHANGE_NAME, "asset.replicate.#", null));
    }

    @AfterEach
    void tearDown() {
        amqpAdmin.deleteQueue(captureQueueName);
        nodeRepository.deleteAll();
        replicationLogRepository.deleteAll();
        renditionRepository.deleteAll();
        assetRepository.deleteAll();
    }

    // ── Helper ─────────────────────────────────────────────────────────────────

    private ContentNode savedNode(String path) {
        ContentNode n = new ContentNode(path, path.substring(path.lastIndexOf('.') + 1), "flexcms/page");
        n.setSiteId("corporate");
        n.setLocale("en");
        n.setParentPath("content.corporate.en");
        n.setOrderIndex(0);
        n.setStatus(NodeStatus.DRAFT);
        return nodeRepository.save(n);
    }


    /**
     * Reads one {@link ReplicationEvent} off the capture queue.
     *
     * <p>The type is stated explicitly rather than cast from
     * {@code receiveAndConvert(queue, timeout)}. Without a target type the converter
     * resolves the payload from the {@code __TypeId__} header, which
     * {@code DefaultJackson2JavaTypeMapper} then refuses because its trusted packages
     * are only {@code java.util} and {@code java.lang}. Production never hits that
     * path: {@code ReplicationReceiver} consumes via {@code @RabbitListener}, where
     * Spring AMQP infers the payload type from the handler signature. This overload
     * gives the test the same type information through the same converter.
     */
    private ReplicationEvent receiveEvent() {
        return amqpTemplate.receiveAndConvert(
                captureQueueName, 5_000, new ParameterizedTypeReference<ReplicationEvent>() { });
    }

    // ── Tests: replicate (single node) ────────────────────────────────────────

    @Test
    void replicate_activate_messageArrivesInQueue() {
        savedNode("content.corporate.en.home");

        UUID eventId = replicationAgent.replicate(
                "content.corporate.en.home", ReplicationEvent.ReplicationAction.ACTIVATE, "alice");

        ReplicationEvent received = receiveEvent();

        assertThat(received).isNotNull();
        assertThat(received.getEventId()).isEqualTo(eventId);
        assertThat(received.getPath()).isEqualTo("content.corporate.en.home");
        assertThat(received.getAction()).isEqualTo(ReplicationEvent.ReplicationAction.ACTIVATE);
        assertThat(received.getSiteId()).isEqualTo("corporate");
        assertThat(received.getLocale()).isEqualTo("en");
        assertThat(received.getInitiatedBy()).isEqualTo("alice");
        assertThat(received.getType()).isEqualTo(ReplicationEvent.ReplicationType.CONTENT);
    }

    @Test
    void replicate_activate_setsNodeStatusPublishedInDB() {
        ContentNode n = savedNode("content.corporate.en.home");

        replicationAgent.replicate(
                "content.corporate.en.home", ReplicationEvent.ReplicationAction.ACTIVATE, "alice");

        ContentNode updated = nodeRepository.findByPath("content.corporate.en.home").orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(NodeStatus.PUBLISHED);
    }

    @Test
    void replicate_activate_createsReplicationLogEntry() {
        savedNode("content.corporate.en.home");

        replicationAgent.replicate(
                "content.corporate.en.home", ReplicationEvent.ReplicationAction.ACTIVATE, "alice");

        List<ReplicationLogEntry> logs = replicationLogRepository.findAll();
        assertThat(logs).hasSize(1);
        assertThat(logs.get(0).getContentPath()).isEqualTo("content.corporate.en.home");
        assertThat(logs.get(0).getStatus()).isEqualTo(ReplicationLogEntry.ReplicationStatus.PENDING);
        assertThat(logs.get(0).getInitiatedBy()).isEqualTo("alice");
    }

    @Test
    void replicate_deactivate_doesNotChangeNodeStatusInDB() {
        ContentNode n = savedNode("content.corporate.en.home");
        n.setStatus(NodeStatus.PUBLISHED);
        nodeRepository.save(n);

        replicationAgent.replicate(
                "content.corporate.en.home", ReplicationEvent.ReplicationAction.DEACTIVATE, "alice");

        ContentNode updated = nodeRepository.findByPath("content.corporate.en.home").orElseThrow();
        // Agent's replicate() only sets PUBLISHED for ACTIVATE; DEACTIVATE leaves status unchanged
        assertThat(updated.getStatus()).isEqualTo(NodeStatus.PUBLISHED);
    }

    @Test
    void replicate_nodeNotFound_throws() {
        assertThatThrownBy(() -> replicationAgent.replicate(
                "content.does.not.exist", ReplicationEvent.ReplicationAction.ACTIVATE, "alice"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Node not found");
    }

    // ── Tests: replicateTree ──────────────────────────────────────────────────

    @Test
    void replicateTree_messageArrivesOnTreeRoutingKey() {
        // Bind the capture queue to the tree routing key too
        amqpAdmin.declareBinding(new Binding(captureQueueName, Binding.DestinationType.QUEUE,
                ReplicationQueueConfig.EXCHANGE_NAME, "content.replicate.tree", null));

        ContentNode root = savedNode("content.corporate.en.home");
        ContentNode child = savedNode("content.corporate.en.home.hero");

        UUID eventId = replicationAgent.replicateTree("content.corporate.en.home", "alice");

        ReplicationEvent received = receiveEvent();

        assertThat(received).isNotNull();
        assertThat(received.getEventId()).isEqualTo(eventId);
        assertThat(received.getType()).isEqualTo(ReplicationEvent.ReplicationType.TREE);
        assertThat(received.getAffectedPaths())
                .containsExactlyInAnyOrder("content.corporate.en.home", "content.corporate.en.home.hero");
    }

    @Test
    void replicateTree_marksAllNodesPublishedInDB() {
        savedNode("content.corporate.en.home");
        savedNode("content.corporate.en.home.hero");

        replicationAgent.replicateTree("content.corporate.en.home", "alice");

        assertThat(nodeRepository.findByPath("content.corporate.en.home")
                .orElseThrow().getStatus()).isEqualTo(NodeStatus.PUBLISHED);
        assertThat(nodeRepository.findByPath("content.corporate.en.home.hero")
                .orElseThrow().getStatus()).isEqualTo(NodeStatus.PUBLISHED);
    }

    // ── Tests: replicateAsset ─────────────────────────────────────────────────

    private Asset savedAsset(String path) {
        Asset a = new Asset();
        a.setPath(path);
        a.setName("logo.png");
        a.setMimeType("image/png");
        a.setFileSize(1234L);
        a.setStorageKey("originals/" + UUID.randomUUID() + "/logo.png");
        a.setStorageBucket("flexcms-assets");
        a.setSiteId("corporate");
        a.setFolderPath("/content/dam/corporate");
        a.setWidth(640);
        a.setHeight(480);
        a.setMetadata(new java.util.HashMap<>(java.util.Map.of("alt", "Logo")));
        a.setStatus(AssetStatus.ACTIVE);
        Asset saved = assetRepository.save(a);

        AssetRendition r = new AssetRendition();
        r.setAsset(saved);
        r.setRenditionKey("thumbnail");
        r.setStorageKey("renditions/" + saved.getId() + "/thumbnail.webp");
        r.setMimeType("image/webp");
        r.setGeneratedAt(java.time.Instant.parse("2026-09-01T00:00:00Z"));
        renditionRepository.save(r);
        return saved;
    }

    @Test
    void replicateAsset_payloadSurvivesTheBrokerRoundTrip() {
        // The publish tier writes the row from this payload alone, so every field it
        // needs must deserialize — records, Instants and the metadata map included.
        Asset a = savedAsset("/content/dam/corporate/logo.png");

        UUID eventId = replicationAgent.replicateAsset(a.getId(), ReplicationEvent.ReplicationAction.ACTIVATE, "alice");

        ReplicationEvent received = receiveEvent();
        assertThat(received).isNotNull();
        assertThat(received.getEventId()).isEqualTo(eventId);
        assertThat(received.getType()).isEqualTo(ReplicationEvent.ReplicationType.ASSET);
        assertThat(received.getAssetId()).isEqualTo(a.getId());
        assertThat(received.getAsset().storageKey()).isEqualTo(a.getStorageKey());
        assertThat(received.getAsset().metadata()).containsEntry("alt", "Logo");
        assertThat(received.getAsset().renditions()).singleElement()
                .satisfies(r -> {
                    assertThat(r.renditionKey()).isEqualTo("thumbnail");
                    assertThat(r.generatedAt()).isEqualTo(java.time.Instant.parse("2026-09-01T00:00:00Z"));
                });
        assertThat(received.getRenditionKeys()).containsExactly("thumbnail");
        assertThat(received.getInitiatedBy()).isEqualTo("alice");
    }

    @Test
    void replicateTree_pageReferencingAnAsset_sendsTheAssetThenTheTree() {
        Asset a = savedAsset("/content/dam/corporate/hero.png");
        savedNode("content.corporate.en.home");
        ContentNode hero = savedNode("content.corporate.en.home.hero");
        hero.setProperties(new java.util.HashMap<>(java.util.Map.of(
                "image", "/api/author/assets/" + a.getId() + "/content")));
        nodeRepository.save(hero);

        replicationAgent.replicateTree("content.corporate.en.home", "alice");

        ReplicationEvent first = receiveEvent();
        ReplicationEvent second = receiveEvent();
        assertThat(first.getType()).isEqualTo(ReplicationEvent.ReplicationType.ASSET);
        assertThat(first.getAssetId()).isEqualTo(a.getId());
        assertThat(second.getType()).isEqualTo(ReplicationEvent.ReplicationType.TREE);
    }

    // ── Tests: listener path (AFTER_COMMIT) ───────────────────────────────────

    @Test
    void publishViaStatusEvent_afterCommit_persistsReplicationLog() {
        // Regression: the AFTER_COMMIT listener used to join the already-committed
        // transaction, so the message was sent but the log row was discarded.
        ContentNode page = savedNode("content.corporate.en.home");

        transactionTemplate.executeWithoutResult(status -> eventPublisher.publishEvent(
                new ContentStatusChangedEvent(this, page, NodeStatus.DRAFT, NodeStatus.PUBLISHED, "alice")));

        assertThat(receiveEvent().getType()).isEqualTo(ReplicationEvent.ReplicationType.TREE);
        assertThat(replicationLogRepository.findAll())
                .anySatisfy(entry -> {
                    assertThat(entry.getReplicationType()).isEqualTo(ReplicationLogEntry.ReplicationType.TREE);
                    assertThat(entry.getContentPath()).isEqualTo("content.corporate.en.home");
                });
    }

    @Test
    void assetDeletedEvent_afterCommit_sendsDeleteAndPersistsLog() {
        UUID id = UUID.randomUUID();

        transactionTemplate.executeWithoutResult(status -> eventPublisher.publishEvent(
                new AssetDeletedEvent(this, id, "/content/dam/corporate/gone.png", "corporate", "alice")));

        ReplicationEvent received = receiveEvent();
        assertThat(received.getAction()).isEqualTo(ReplicationEvent.ReplicationAction.DELETE);
        assertThat(received.getAssetId()).isEqualTo(id);
        assertThat(replicationLogRepository.findAll())
                .anySatisfy(entry -> assertThat(entry.getNodeId()).isEqualTo(id));
    }
}
