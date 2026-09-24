package com.flexcms.replication.service;

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
import com.flexcms.replication.model.ReplicationEvent.ReplicationAction;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.AmqpException;
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
    @Mock private AssetRepository assetRepository;
    @Mock private AssetRenditionRepository renditionRepository;

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

    private Asset asset(AssetStatus status) {
        Asset a = new Asset();
        a.setId(UUID.randomUUID());
        a.setPath("/content/dam/corporate/logo.png");
        a.setName("logo.png");
        a.setMimeType("image/png");
        a.setStorageKey("originals/x/logo.png");
        a.setSiteId("corporate");
        a.setStatus(status);
        return a;
    }

    private AssetRendition rendition(String key) {
        AssetRendition r = new AssetRendition();
        r.setId(UUID.randomUUID());
        r.setRenditionKey(key);
        r.setStorageKey("renditions/x/" + key + ".webp");
        return r;
    }

    private ReplicationEvent captureAssetEvent() {
        ArgumentCaptor<ReplicationEvent> captor = ArgumentCaptor.forClass(ReplicationEvent.class);
        verify(rabbitTemplate).convertAndSend(
                eq(ReplicationQueueConfig.EXCHANGE_NAME),
                eq(ReplicationQueueConfig.ASSET_ROUTING_KEY),
                captor.capture());
        return captor.getValue();
    }

    @Test
    void replicateAsset_activate_sendsFullPayloadToAssetQueue() {
        Asset a = asset(AssetStatus.ACTIVE);
        when(assetRepository.findById(a.getId())).thenReturn(Optional.of(a));
        when(renditionRepository.findByAssetId(a.getId()))
                .thenReturn(List.of(rendition("thumbnail"), rendition("web-small")));

        replicationAgent.replicateAsset(a.getId(), ReplicationAction.ACTIVATE, "alice");

        ReplicationEvent event = captureAssetEvent();
        assertThat(event.getType()).isEqualTo(ReplicationEvent.ReplicationType.ASSET);
        assertThat(event.getAction()).isEqualTo(ReplicationAction.ACTIVATE);
        assertThat(event.getAssetId()).isEqualTo(a.getId());
        assertThat(event.getPath()).isEqualTo("/content/dam/corporate/logo.png");
        assertThat(event.getAsset().storageKey()).isEqualTo("originals/x/logo.png");
        assertThat(event.getAsset().renditions()).hasSize(2);
        assertThat(event.getRenditionKeys()).containsExactly("thumbnail", "web-small");
        assertThat(event.getInitiatedBy()).isEqualTo("alice");
    }

    @Test
    void replicateAsset_activate_logsAssetIdForTraceability() {
        Asset a = asset(AssetStatus.ACTIVE);
        when(assetRepository.findById(a.getId())).thenReturn(Optional.of(a));

        replicationAgent.replicateAsset(a.getId(), ReplicationAction.ACTIVATE, "alice");

        ArgumentCaptor<ReplicationLogEntry> log = ArgumentCaptor.forClass(ReplicationLogEntry.class);
        verify(replicationLog).save(log.capture());
        assertThat(log.getValue().getNodeId()).isEqualTo(a.getId());
        assertThat(log.getValue().getReplicationType()).isEqualTo(ReplicationLogEntry.ReplicationType.ASSET);
    }

    @Test
    void replicateAsset_deactivate_sendsRemovalWithoutPayload() {
        Asset a = asset(AssetStatus.ACTIVE);
        when(assetRepository.findById(a.getId())).thenReturn(Optional.of(a));

        replicationAgent.replicateAsset(a.getId(), ReplicationAction.DEACTIVATE, "alice");

        ReplicationEvent event = captureAssetEvent();
        assertThat(event.getAction()).isEqualTo(ReplicationAction.DEACTIVATE);
        assertThat(event.getAssetId()).isEqualTo(a.getId());
        assertThat(event.getAsset()).isNull();
        verify(renditionRepository, never()).findByAssetId(any());
    }

    @Test
    void replicateAsset_activateInactiveAsset_throwsAndSendsNothing() {
        Asset a = asset(AssetStatus.PROCESSING);
        when(assetRepository.findById(a.getId())).thenReturn(Optional.of(a));

        assertThatThrownBy(() -> replicationAgent.replicateAsset(a.getId(), ReplicationAction.ACTIVATE, "alice"))
                .isInstanceOf(IllegalStateException.class);
        verifyNoInteractions(rabbitTemplate);
    }

    @Test
    void replicateAsset_unknownAsset_throws() {
        UUID id = UUID.randomUUID();
        when(assetRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> replicationAgent.replicateAsset(id, ReplicationAction.ACTIVATE, "alice"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(id.toString());
    }

    @Test
    void replicateAssetDelete_sendsDeleteWithoutLoadingTheAsset() {
        UUID id = UUID.randomUUID();

        replicationAgent.replicateAssetDelete(id, "/content/dam/corporate/old.png", "corporate", "alice");

        ReplicationEvent event = captureAssetEvent();
        assertThat(event.getAction()).isEqualTo(ReplicationAction.DELETE);
        assertThat(event.getAssetId()).isEqualTo(id);
        assertThat(event.getPath()).isEqualTo("/content/dam/corporate/old.png");
        verifyNoInteractions(assetRepository);
    }

    // ── referenced assets travel with content ──────────────────────────────────

    @Test
    void replicateReferencedAssets_sendsEachActiveReferencedAsset_skipsInactive() {
        Asset active = asset(AssetStatus.ACTIVE);
        Asset archived = asset(AssetStatus.ARCHIVED);
        ContentNode hero = node("content.corporate.en.home.hero");
        hero.setProperties(new HashMap<>(Map.of(
                "image", "/api/author/assets/" + active.getId() + "/content",
                "bg", "/dam/renditions/" + archived.getId())));
        when(assetRepository.findAllById(any())).thenReturn(List.of(active, archived));

        int sent = replicationAgent.replicateReferencedAssets(List.of(hero), "alice");

        assertThat(sent).isEqualTo(1);
        ReplicationEvent event = captureAssetEvent();
        assertThat(event.getAssetId()).isEqualTo(active.getId());
    }

    @Test
    void replicateReferencedAssets_noReferences_touchesNothing() {
        int sent = replicationAgent.replicateReferencedAssets(List.of(node("content.corporate.en.home")), "alice");

        assertThat(sent).isZero();
        verifyNoInteractions(assetRepository, rabbitTemplate);
    }

    @Test
    void replicateReferencedAssets_sendFailure_isSwallowedPerAsset() {
        Asset first = asset(AssetStatus.ACTIVE);
        Asset second = asset(AssetStatus.ACTIVE);
        ContentNode hero = node("content.corporate.en.home.hero");
        hero.setProperties(new HashMap<>(Map.of(
                "a", "/dam/renditions/" + first.getId(),
                "b", "/dam/renditions/" + second.getId())));
        when(assetRepository.findAllById(any())).thenReturn(List.of(first, second));
        doThrow(new AmqpException("broker down")).doNothing().when(rabbitTemplate)
                .convertAndSend(eq(ReplicationQueueConfig.EXCHANGE_NAME),
                        eq(ReplicationQueueConfig.ASSET_ROUTING_KEY), any(ReplicationEvent.class));

        assertThat(replicationAgent.replicateReferencedAssets(List.of(hero), "alice")).isEqualTo(1);
    }

    @Test
    void replicateTree_sendsReferencedAssetsBeforeTheTree() {
        // ECMS-03-TC02: publishing a page publishes the assets it references.
        Asset img = asset(AssetStatus.ACTIVE);
        ContentNode root = node("content.home");
        ContentNode hero = node("content.home.hero");
        hero.setProperties(new HashMap<>(Map.of("image", "/api/author/assets/" + img.getId() + "/content")));
        when(nodeRepository.findDescendants("content.home")).thenReturn(new ArrayList<>(List.of(hero)));
        when(nodeRepository.findByPath("content.home")).thenReturn(Optional.of(root));
        when(assetRepository.findAllById(any())).thenReturn(List.of(img));

        replicationAgent.replicateTree("content.home", "alice");

        var order = inOrder(rabbitTemplate);
        order.verify(rabbitTemplate).convertAndSend(eq(ReplicationQueueConfig.EXCHANGE_NAME),
                eq(ReplicationQueueConfig.ASSET_ROUTING_KEY), any(ReplicationEvent.class));
        order.verify(rabbitTemplate).convertAndSend(eq(ReplicationQueueConfig.EXCHANGE_NAME),
                eq(ReplicationQueueConfig.TREE_ROUTING_KEY), any(ReplicationEvent.class));
    }

    @Test
    void replicate_activate_sendsReferencedAssets_deactivateDoesNot() {
        Asset img = asset(AssetStatus.ACTIVE);
        ContentNode n = node("content.corporate.en.home.image");
        n.setProperties(new HashMap<>(Map.of("src", "/dam/renditions/" + img.getId())));
        when(nodeRepository.findByPath(n.getPath())).thenReturn(Optional.of(n));
        when(assetRepository.findAllById(any())).thenReturn(List.of(img));

        replicationAgent.replicate(n.getPath(), ReplicationAction.ACTIVATE, "alice");
        replicationAgent.replicate(n.getPath(), ReplicationAction.DEACTIVATE, "alice");

        verify(rabbitTemplate, times(1)).convertAndSend(eq(ReplicationQueueConfig.EXCHANGE_NAME),
                eq(ReplicationQueueConfig.ASSET_ROUTING_KEY), any(ReplicationEvent.class));
    }
}
