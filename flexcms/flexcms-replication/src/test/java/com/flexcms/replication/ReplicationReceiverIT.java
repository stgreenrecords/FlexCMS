package com.flexcms.replication;

import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.replication.config.ReplicationQueueConfig;
import com.flexcms.replication.model.ReplicationEvent;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.AmqpTemplate;
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

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

/**
 * Integration tests for {@link com.flexcms.replication.service.ReplicationReceiver}:
 * verifies that the publish-side listener processes {@link ReplicationEvent} messages
 * from a real RabbitMQ broker and writes the correct state to PostgreSQL.
 *
 * <p>Run mode is {@code publish} so that {@link ReplicationQueueConfig} declares the
 * publish queue ({@code flexcms.publish.test}) and binds it to the exchange, and the
 * {@code @RabbitListener} on {@code ReplicationReceiver} starts consuming.
 */
@SpringBootTest
@Testcontainers
@ActiveProfiles("replication-it")
@TestPropertySource(properties = "flexcms.runmode=publish")
class ReplicationReceiverIT {

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

    @Autowired ContentNodeRepository nodeRepository;
    @Autowired AmqpTemplate amqpTemplate;

    // ── Lifecycle ──────────────────────────────────────────────────────────────

    @AfterEach
    void tearDown() {
        nodeRepository.deleteAll();
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private void send(ReplicationEvent event) {
        String routingKey = switch (event.getType()) {
            case TREE   -> ReplicationQueueConfig.TREE_ROUTING_KEY;
            case ASSET  -> ReplicationQueueConfig.ASSET_ROUTING_KEY;
            default     -> ReplicationQueueConfig.CONTENT_ROUTING_KEY;
        };
        amqpTemplate.convertAndSend(ReplicationQueueConfig.EXCHANGE_NAME, routingKey, event);
    }

    private ReplicationEvent activateEvent(String path) {
        ReplicationEvent e = ReplicationEvent.contentActivate(
                path, UUID.randomUUID(), 1L, "corporate", "en", "alice");
        e.setNodeProperties(Map.of("title", "Home"));
        e.setResourceType("flexcms/page");
        e.setParentPath("content.corporate.en");
        e.setOrderIndex(0);
        return e;
    }

    // ── Tests: ACTIVATE ────────────────────────────────────────────────────────

    @Test
    void activate_newNode_createsInDB() {
        send(activateEvent("content.corporate.en.home"));

        await().atMost(5, TimeUnit.SECONDS).untilAsserted(() -> {
            var node = nodeRepository.findByPath("content.corporate.en.home");
            assertThat(node).isPresent();
            assertThat(node.get().getStatus()).isEqualTo(NodeStatus.PUBLISHED);
            assertThat(node.get().getProperties()).containsEntry("title", "Home");
            assertThat(node.get().getResourceType()).isEqualTo("flexcms/page");
            assertThat(node.get().getParentPath()).isEqualTo("content.corporate.en");
        });
    }

    @Test
    void activate_existingNode_updatesProperties() {
        ContentNode existing = new ContentNode(
                "content.corporate.en.home", "home", "flexcms/page");
        existing.setSiteId("corporate");
        existing.setLocale("en");
        existing.setStatus(NodeStatus.DRAFT);
        nodeRepository.save(existing);

        ReplicationEvent e = ReplicationEvent.contentActivate(
                "content.corporate.en.home", existing.getId(), 2L, "corporate", "en", "alice");
        e.setNodeProperties(Map.of("title", "Updated Home"));
        e.setResourceType("flexcms/page");
        send(e);

        await().atMost(5, TimeUnit.SECONDS).untilAsserted(() -> {
            var node = nodeRepository.findByPath("content.corporate.en.home");
            assertThat(node).isPresent();
            assertThat(node.get().getStatus()).isEqualTo(NodeStatus.PUBLISHED);
            assertThat(node.get().getProperties()).containsEntry("title", "Updated Home");
        });
    }

    @Test
    void activate_nullResourceType_defaultsToFlexcmsPage() {
        ReplicationEvent e = ReplicationEvent.contentActivate(
                "content.corporate.en.about", UUID.randomUUID(), 1L, "corporate", "en", "alice");
        e.setResourceType(null);
        send(e);

        await().atMost(5, TimeUnit.SECONDS).untilAsserted(() -> {
            var node = nodeRepository.findByPath("content.corporate.en.about");
            assertThat(node).isPresent();
            assertThat(node.get().getResourceType()).isEqualTo("flexcms/page");
        });
    }

    @Test
    void activate_treeEvent_doesNotUpsertNodes() {
        // TREE events are handled by listing affected paths only — no individual upsert
        ReplicationEvent e = ReplicationEvent.treeActivate(
                "content.corporate.en", java.util.List.of("content.corporate.en", "content.corporate.en.home"),
                "corporate", "alice");
        send(e);

        // Give receiver time to consume (it should log but NOT upsert)
        await().during(1, TimeUnit.SECONDS).atMost(3, TimeUnit.SECONDS).untilAsserted(() ->
                assertThat(nodeRepository.count()).isZero());
    }

    // ── Tests: DEACTIVATE ──────────────────────────────────────────────────────

    @Test
    void deactivate_existingNode_setsStatusDraft() {
        ContentNode n = new ContentNode("content.corporate.en.home", "home", "flexcms/page");
        n.setSiteId("corporate");
        n.setStatus(NodeStatus.PUBLISHED);
        nodeRepository.save(n);

        ReplicationEvent e = ReplicationEvent.contentDeactivate(
                "content.corporate.en.home", "corporate", "alice");
        send(e);

        await().atMost(5, TimeUnit.SECONDS).untilAsserted(() -> {
            var node = nodeRepository.findByPath("content.corporate.en.home");
            assertThat(node).isPresent();
            assertThat(node.get().getStatus()).isEqualTo(NodeStatus.DRAFT);
        });
    }

    @Test
    void deactivate_missingNode_isNoOp() {
        ReplicationEvent e = ReplicationEvent.contentDeactivate(
                "content.does.not.exist", "corporate", "alice");
        send(e);

        // Should complete without error; DB stays empty
        await().during(1, TimeUnit.SECONDS).atMost(3, TimeUnit.SECONDS).untilAsserted(() ->
                assertThat(nodeRepository.count()).isZero());
    }

    // ── Tests: DELETE ──────────────────────────────────────────────────────────

    @Test
    void delete_deletesSubtreeFromDB() {
        ContentNode root = new ContentNode("content.corporate.en.home", "home", "flexcms/page");
        root.setSiteId("corporate");
        nodeRepository.save(root);
        ContentNode child = new ContentNode("content.corporate.en.home.hero", "hero", "flexcms/component");
        child.setSiteId("corporate");
        nodeRepository.save(child);

        ReplicationEvent e = new ReplicationEvent();
        e.setEventId(UUID.randomUUID());
        e.setAction(ReplicationEvent.ReplicationAction.DELETE);
        e.setType(ReplicationEvent.ReplicationType.CONTENT);
        e.setPath("content.corporate.en.home");
        e.setSiteId("corporate");
        send(e);

        await().atMost(5, TimeUnit.SECONDS).untilAsserted(() ->
                assertThat(nodeRepository.existsByPath("content.corporate.en.home")).isFalse());
    }
}
