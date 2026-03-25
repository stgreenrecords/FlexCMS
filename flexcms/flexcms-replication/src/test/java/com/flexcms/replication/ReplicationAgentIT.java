package com.flexcms.replication;

import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.core.model.ReplicationLogEntry;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.core.repository.ReplicationLogRepository;
import com.flexcms.replication.config.ReplicationQueueConfig;
import com.flexcms.replication.model.ReplicationEvent;
import com.flexcms.replication.service.ReplicationAgent;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.RabbitMQContainer;
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
    static final PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:16-alpine")
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
    @Autowired AmqpAdmin amqpAdmin;
    @Autowired AmqpTemplate amqpTemplate;
    @Autowired TopicExchange replicationExchange;

    /** Temporary queue created per-test to capture messages sent by the agent. */
    private String captureQueueName;

    // ── Lifecycle ──────────────────────────────────────────────────────────────

    @BeforeEach
    void setUp() {
        // Create a transient, auto-delete queue and bind it to the exchange
        // so we can assert that messages actually arrive at the broker.
        captureQueueName = "test.capture." + UUID.randomUUID();
        amqpAdmin.declareQueue(new Queue(captureQueueName, false, false, true));
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

    // ── Tests: replicate (single node) ────────────────────────────────────────

    @Test
    void replicate_activate_messageArrivesInQueue() {
        savedNode("content.corporate.en.home");

        UUID eventId = replicationAgent.replicate(
                "content.corporate.en.home", ReplicationEvent.ReplicationAction.ACTIVATE, "alice");

        ReplicationEvent received = (ReplicationEvent)
                amqpTemplate.receiveAndConvert(captureQueueName, 5_000);

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

        ReplicationEvent received = (ReplicationEvent)
                amqpTemplate.receiveAndConvert(captureQueueName, 5_000);

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

    @Test
    void replicateAsset_messageArrivesWithRenditionKeys() {
        List<String> renditions = List.of("renditions/logo-800.webp", "renditions/logo-400.webp");

        UUID eventId = replicationAgent.replicateAsset("/content/dam/logo.png", renditions, "alice");

        ReplicationEvent received = (ReplicationEvent)
                amqpTemplate.receiveAndConvert(captureQueueName, 5_000);

        assertThat(received).isNotNull();
        assertThat(received.getEventId()).isEqualTo(eventId);
        assertThat(received.getType()).isEqualTo(ReplicationEvent.ReplicationType.ASSET);
        assertThat(received.getPath()).isEqualTo("/content/dam/logo.png");
        assertThat(received.getRenditionKeys()).containsAll(renditions);
        assertThat(received.getInitiatedBy()).isEqualTo("alice");
    }
}
