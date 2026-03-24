package com.flexcms.replication.service;

import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.core.model.ReplicationLogEntry;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.core.repository.ReplicationLogRepository;
import com.flexcms.replication.config.ReplicationQueueConfig;
import com.flexcms.replication.model.ReplicationEvent;
import com.flexcms.replication.model.ReplicationEvent.ReplicationAction;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReplicationAgentTest {

    @Mock private RabbitTemplate rabbitTemplate;
    @Mock private ContentNodeRepository nodeRepository;
    @Mock private ReplicationLogRepository replicationLog;

    @InjectMocks
    private ReplicationAgent replicationAgent;

    // ── Fixture ────────────────────────────────────────────────────────────────

    private ContentNode node(String path) {
        ContentNode n = new ContentNode(path, "homepage", "flexcms/page");
        n.setId(UUID.randomUUID());
        n.setVersion(3L);
        n.setSiteId("corporate");
        n.setLocale("en");
        n.setParentPath("content.corporate.en");
        n.setOrderIndex(0);
        n.setProperties(new HashMap<>(Map.of("title", "Home")));
        return n;
    }

    // ── replicate — ACTIVATE ───────────────────────────────────────────────────

    @Test
    void replicate_nodeNotFound_throws() {
        when(nodeRepository.findByPath("content.missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> replicationAgent.replicate(
                "content.missing", ReplicationAction.ACTIVATE, "alice"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Node not found: content.missing");
    }

    @Test
    void replicate_activate_setsNodeStatusPublished() {
        ContentNode n = node("content.corporate.en.home");
        when(nodeRepository.findByPath("content.corporate.en.home")).thenReturn(Optional.of(n));
        when(replicationLog.save(any())).thenAnswer(inv -> inv.getArgument(0));

        replicationAgent.replicate("content.corporate.en.home", ReplicationAction.ACTIVATE, "alice");

        assertThat(n.getStatus()).isEqualTo(NodeStatus.PUBLISHED);
        verify(nodeRepository).save(n);
    }

    @Test
    void replicate_activate_sendsEventToContentQueue() {
        ContentNode n = node("content.corporate.en.home");
        when(nodeRepository.findByPath("content.corporate.en.home")).thenReturn(Optional.of(n));
        when(replicationLog.save(any())).thenAnswer(inv -> inv.getArgument(0));

        replicationAgent.replicate("content.corporate.en.home", ReplicationAction.ACTIVATE, "alice");

        ArgumentCaptor<ReplicationEvent> captor = ArgumentCaptor.forClass(ReplicationEvent.class);
        verify(rabbitTemplate).convertAndSend(
                eq(ReplicationQueueConfig.EXCHANGE_NAME),
                eq(ReplicationQueueConfig.CONTENT_ROUTING_KEY),
                captor.capture());

        ReplicationEvent event = captor.getValue();
        assertThat(event.getAction()).isEqualTo(ReplicationAction.ACTIVATE);
        assertThat(event.getPath()).isEqualTo("content.corporate.en.home");
        assertThat(event.getSiteId()).isEqualTo("corporate");
        assertThat(event.getLocale()).isEqualTo("en");
        assertThat(event.getInitiatedBy()).isEqualTo("alice");
        assertThat(event.getNodeProperties()).containsEntry("title", "Home");
        assertThat(event.getResourceType()).isEqualTo("flexcms/page");
    }

    @Test
    void replicate_activate_logsReplicationEntry() {
        ContentNode n = node("content.corporate.en.home");
        when(nodeRepository.findByPath("content.corporate.en.home")).thenReturn(Optional.of(n));
        when(replicationLog.save(any())).thenAnswer(inv -> inv.getArgument(0));

        replicationAgent.replicate("content.corporate.en.home", ReplicationAction.ACTIVATE, "alice");

        ArgumentCaptor<ReplicationLogEntry> logCaptor = ArgumentCaptor.forClass(ReplicationLogEntry.class);
        verify(replicationLog).save(logCaptor.capture());
        ReplicationLogEntry entry = logCaptor.getValue();
        assertThat(entry.getContentPath()).isEqualTo("content.corporate.en.home");
        assertThat(entry.getStatus()).isEqualTo(ReplicationLogEntry.ReplicationStatus.PENDING);
        assertThat(entry.getInitiatedBy()).isEqualTo("alice");
    }

    @Test
    void replicate_deactivate_doesNotSetNodePublished() {
        ContentNode n = node("content.corporate.en.home");
        n.setStatus(NodeStatus.PUBLISHED);
        when(nodeRepository.findByPath("content.corporate.en.home")).thenReturn(Optional.of(n));
        when(replicationLog.save(any())).thenAnswer(inv -> inv.getArgument(0));

        replicationAgent.replicate("content.corporate.en.home", ReplicationAction.DEACTIVATE, "alice");

        // Status should NOT be changed to PUBLISHED by deactivate
        assertThat(n.getStatus()).isEqualTo(NodeStatus.PUBLISHED);
        verify(nodeRepository, never()).save(any());
    }

    @Test
    void replicate_returnsEventId() {
        ContentNode n = node("content.corporate.en.home");
        when(nodeRepository.findByPath("content.corporate.en.home")).thenReturn(Optional.of(n));
        when(replicationLog.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UUID eventId = replicationAgent.replicate(
                "content.corporate.en.home", ReplicationAction.ACTIVATE, "alice");

        assertThat(eventId).isNotNull();
    }

    // ── replicateTree ──────────────────────────────────────────────────────────

    @Test
    void replicateTree_rootNotFound_throws() {
        when(nodeRepository.findDescendants("content.home")).thenReturn(new ArrayList<>());
        when(nodeRepository.findByPath("content.home")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> replicationAgent.replicateTree("content.home", "alice"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Root not found: content.home");
    }

    @Test
    void replicateTree_marksAllNodesPublished() {
        ContentNode root = node("content.home");
        ContentNode child = node("content.home.hero");
        when(nodeRepository.findDescendants("content.home")).thenReturn(new ArrayList<>(List.of(child)));
        when(nodeRepository.findByPath("content.home")).thenReturn(Optional.of(root));
        when(replicationLog.save(any())).thenAnswer(inv -> inv.getArgument(0));

        replicationAgent.replicateTree("content.home", "alice");

        assertThat(root.getStatus()).isEqualTo(NodeStatus.PUBLISHED);
        assertThat(child.getStatus()).isEqualTo(NodeStatus.PUBLISHED);
        verify(nodeRepository).saveAll(argThat(nodes ->
                ((List<?>) nodes).size() == 2));
    }

    @Test
    void replicateTree_sendsTreeEventToTreeQueue() {
        ContentNode root = node("content.home");
        ContentNode child = node("content.home.hero");
        when(nodeRepository.findDescendants("content.home")).thenReturn(new ArrayList<>(List.of(child)));
        when(nodeRepository.findByPath("content.home")).thenReturn(Optional.of(root));
        when(replicationLog.save(any())).thenAnswer(inv -> inv.getArgument(0));

        replicationAgent.replicateTree("content.home", "alice");

        ArgumentCaptor<ReplicationEvent> captor = ArgumentCaptor.forClass(ReplicationEvent.class);
        verify(rabbitTemplate).convertAndSend(
                eq(ReplicationQueueConfig.EXCHANGE_NAME),
                eq(ReplicationQueueConfig.TREE_ROUTING_KEY),
                captor.capture());

        ReplicationEvent event = captor.getValue();
        assertThat(event.getType()).isEqualTo(ReplicationEvent.ReplicationType.TREE);
        assertThat(event.getAffectedPaths()).containsExactlyInAnyOrder(
                "content.home", "content.home.hero");
    }

    // ── replicateAsset ─────────────────────────────────────────────────────────

    @Test
    void replicateAsset_sendsEventToAssetQueue() {
        when(replicationLog.save(any())).thenAnswer(inv -> inv.getArgument(0));

        List<String> renditions = List.of("renditions/logo-800.webp", "renditions/logo-400.webp");
        replicationAgent.replicateAsset("/content/dam/logo.png", renditions, "alice");

        ArgumentCaptor<ReplicationEvent> captor = ArgumentCaptor.forClass(ReplicationEvent.class);
        verify(rabbitTemplate).convertAndSend(
                eq(ReplicationQueueConfig.EXCHANGE_NAME),
                eq(ReplicationQueueConfig.ASSET_ROUTING_KEY),
                captor.capture());

        ReplicationEvent event = captor.getValue();
        assertThat(event.getType()).isEqualTo(ReplicationEvent.ReplicationType.ASSET);
        assertThat(event.getPath()).isEqualTo("/content/dam/logo.png");
        assertThat(event.getRenditionKeys()).containsAll(renditions);
        assertThat(event.getInitiatedBy()).isEqualTo("alice");
    }
}
