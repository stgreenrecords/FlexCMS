package com.flexcms.replication.service;

import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.replication.model.ReplicationEvent;
import com.flexcms.replication.model.ReplicationEvent.ReplicationAction;
import com.flexcms.replication.model.ReplicationEvent.ReplicationType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReplicationReceiverTest {

    @Mock private ContentNodeRepository nodeRepository;

    @InjectMocks
    private ReplicationReceiver replicationReceiver;

    // ── Fixture ────────────────────────────────────────────────────────────────

    private ReplicationEvent activateEvent(String path) {
        ReplicationEvent e = new ReplicationEvent();
        e.setAction(ReplicationAction.ACTIVATE);
        e.setType(ReplicationType.CONTENT);
        e.setPath(path);
        e.setSiteId("corporate");
        e.setLocale("en");
        e.setResourceType("flexcms/page");
        e.setParentPath("content.corporate.en");
        e.setOrderIndex(0);
        e.setVersion(2L);
        e.setNodeProperties(new HashMap<>(Map.of("title", "Home")));
        return e;
    }

    private ContentNode existingNode(String path) {
        ContentNode n = new ContentNode(path, "home", "flexcms/page");
        n.setId(UUID.randomUUID());
        n.setSiteId("corporate");
        n.setLocale("en");
        n.setStatus(NodeStatus.DRAFT);
        return n;
    }

    // ── ACTIVATE — existing node ───────────────────────────────────────────────

    @Test
    void activate_existingNode_updatesPropertiesAndStatus() {
        ContentNode existing = existingNode("content.corporate.en.home");
        when(nodeRepository.findByPath("content.corporate.en.home"))
                .thenReturn(Optional.of(existing));

        replicationReceiver.handleReplication(activateEvent("content.corporate.en.home"));

        assertThat(existing.getStatus()).isEqualTo(NodeStatus.PUBLISHED);
        assertThat(existing.getProperties()).containsEntry("title", "Home");
        assertThat(existing.getVersion()).isEqualTo(2L);
        verify(nodeRepository).save(existing);
    }

    @Test
    void activate_existingNode_updatesResourceTypeAndOrderIndex() {
        ContentNode existing = existingNode("content.corporate.en.home");
        existing.setResourceType("flexcms/old-type");
        when(nodeRepository.findByPath("content.corporate.en.home"))
                .thenReturn(Optional.of(existing));

        ReplicationEvent event = activateEvent("content.corporate.en.home");
        event.setResourceType("flexcms/new-type");
        event.setOrderIndex(3);

        replicationReceiver.handleReplication(event);

        assertThat(existing.getResourceType()).isEqualTo("flexcms/new-type");
        assertThat(existing.getOrderIndex()).isEqualTo(3);
    }

    // ── ACTIVATE — new node (upsert) ──────────────────────────────────────────

    @Test
    void activate_newNode_createsAndSaves() {
        when(nodeRepository.findByPath("content.corporate.en.newpage"))
                .thenReturn(Optional.empty());

        replicationReceiver.handleReplication(activateEvent("content.corporate.en.newpage"));

        ArgumentCaptor<ContentNode> captor = ArgumentCaptor.forClass(ContentNode.class);
        verify(nodeRepository).save(captor.capture());
        ContentNode saved = captor.getValue();
        assertThat(saved.getPath()).isEqualTo("content.corporate.en.newpage");
        assertThat(saved.getName()).isEqualTo("newpage");
        assertThat(saved.getSiteId()).isEqualTo("corporate");
        assertThat(saved.getLocale()).isEqualTo("en");
        assertThat(saved.getStatus()).isEqualTo(NodeStatus.PUBLISHED);
        assertThat(saved.getProperties()).containsEntry("title", "Home");
    }

    @Test
    void activate_newNode_resourceTypeDefaultsToPage() {
        when(nodeRepository.findByPath("content.home")).thenReturn(Optional.empty());

        ReplicationEvent event = activateEvent("content.home");
        event.setResourceType(null);

        replicationReceiver.handleReplication(event);

        ArgumentCaptor<ContentNode> captor = ArgumentCaptor.forClass(ContentNode.class);
        verify(nodeRepository).save(captor.capture());
        assertThat(captor.getValue().getResourceType()).isEqualTo("flexcms/page");
    }

    // ── ACTIVATE — tree event (no upsert, just logs) ──────────────────────────

    @Test
    void activate_treeType_doesNotUpsertNodes() {
        ReplicationEvent event = new ReplicationEvent();
        event.setAction(ReplicationAction.ACTIVATE);
        event.setType(ReplicationType.TREE);
        event.setPath("content.home");
        event.setAffectedPaths(List.of("content.home", "content.home.hero"));

        replicationReceiver.handleReplication(event);

        verify(nodeRepository, never()).findByPath(any());
        verify(nodeRepository, never()).save(any());
    }

    // ── DEACTIVATE ─────────────────────────────────────────────────────────────

    @Test
    void deactivate_existingNode_setsToDraft() {
        ContentNode existing = existingNode("content.corporate.en.home");
        existing.setStatus(NodeStatus.PUBLISHED);
        when(nodeRepository.findByPath("content.corporate.en.home"))
                .thenReturn(Optional.of(existing));

        ReplicationEvent event = new ReplicationEvent();
        event.setAction(ReplicationAction.DEACTIVATE);
        event.setPath("content.corporate.en.home");

        replicationReceiver.handleReplication(event);

        assertThat(existing.getStatus()).isEqualTo(NodeStatus.DRAFT);
        verify(nodeRepository).save(existing);
    }

    @Test
    void deactivate_nodeNotFound_doesNothing() {
        when(nodeRepository.findByPath("content.missing")).thenReturn(Optional.empty());

        ReplicationEvent event = new ReplicationEvent();
        event.setAction(ReplicationAction.DEACTIVATE);
        event.setPath("content.missing");

        replicationReceiver.handleReplication(event);

        verify(nodeRepository, never()).save(any());
    }

    // ── DELETE ─────────────────────────────────────────────────────────────────

    @Test
    void delete_callsDeleteSubtree() {
        ReplicationEvent event = new ReplicationEvent();
        event.setAction(ReplicationAction.DELETE);
        event.setPath("content.corporate.en.old");

        replicationReceiver.handleReplication(event);

        verify(nodeRepository).deleteSubtree("content.corporate.en.old");
    }
}
