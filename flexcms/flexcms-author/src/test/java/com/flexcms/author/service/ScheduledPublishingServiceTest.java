package com.flexcms.author.service;

import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.replication.model.ReplicationEvent.ReplicationAction;
import com.flexcms.replication.service.ReplicationAgent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScheduledPublishingServiceTest {

    @Mock private ContentNodeRepository nodeRepository;
    @Mock private ReplicationAgent replicationAgent;

    @InjectMocks
    private ScheduledPublishingService service;

    // ── Fixtures ───────────────────────────────────────────────────────────────

    private ContentNode draftNode(String path) {
        ContentNode n = new ContentNode(path, "home", "flexcms/page");
        n.setId(UUID.randomUUID());
        n.setSiteId("corporate");
        n.setLocale("en");
        n.setStatus(NodeStatus.DRAFT);
        return n;
    }

    private ContentNode publishedNode(String path) {
        ContentNode n = draftNode(path);
        n.setStatus(NodeStatus.PUBLISHED);
        return n;
    }

    // ── schedulePublish ────────────────────────────────────────────────────────

    @Test
    void schedulePublish_setsScheduledPublishAt() {
        ContentNode node = draftNode("content.home");
        when(nodeRepository.findByPath("content.home")).thenReturn(Optional.of(node));

        Instant future = Instant.now().plusSeconds(3600);
        service.schedulePublish("content.home", future);

        assertThat(node.getScheduledPublishAt()).isEqualTo(future);
        verify(nodeRepository).save(node);
    }

    @Test
    void schedulePublish_nullClearsSchedule() {
        ContentNode node = draftNode("content.home");
        node.setScheduledPublishAt(Instant.now().plusSeconds(3600));
        when(nodeRepository.findByPath("content.home")).thenReturn(Optional.of(node));

        service.schedulePublish("content.home", null);

        assertThat(node.getScheduledPublishAt()).isNull();
        verify(nodeRepository).save(node);
    }

    @Test
    void schedulePublish_nodeNotFound_throwsNotFoundException() {
        when(nodeRepository.findByPath("content.missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.schedulePublish("content.missing", Instant.now()))
                .isInstanceOf(NotFoundException.class);
        verify(nodeRepository, never()).save(any());
    }

    // ── scheduleDeactivate ─────────────────────────────────────────────────────

    @Test
    void scheduleDeactivate_setsScheduledDeactivateAt() {
        ContentNode node = publishedNode("content.home");
        when(nodeRepository.findByPath("content.home")).thenReturn(Optional.of(node));

        Instant future = Instant.now().plusSeconds(7200);
        service.scheduleDeactivate("content.home", future);

        assertThat(node.getScheduledDeactivateAt()).isEqualTo(future);
        verify(nodeRepository).save(node);
    }

    @Test
    void scheduleDeactivate_nodeNotFound_throwsNotFoundException() {
        when(nodeRepository.findByPath("content.missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.scheduleDeactivate("content.missing", Instant.now()))
                .isInstanceOf(NotFoundException.class);
        verify(nodeRepository, never()).save(any());
    }

    // ── processScheduledPublishes ──────────────────────────────────────────────

    @Test
    void processScheduledPublishes_replicatesEachDueNode() {
        ContentNode n1 = draftNode("content.page1");
        ContentNode n2 = draftNode("content.page2");
        when(nodeRepository.findDueForPublish(any())).thenReturn(List.of(n1, n2));

        service.processScheduledPublishes();

        verify(replicationAgent).replicate("content.page1", ReplicationAction.ACTIVATE, "system:scheduler");
        verify(replicationAgent).replicate("content.page2", ReplicationAction.ACTIVATE, "system:scheduler");
        verify(nodeRepository, times(2)).save(any(ContentNode.class));
    }

    @Test
    void processScheduledPublishes_noDueNodes_doesNothing() {
        when(nodeRepository.findDueForPublish(any())).thenReturn(List.of());

        service.processScheduledPublishes();

        verifyNoInteractions(replicationAgent);
        verify(nodeRepository, never()).save(any());
    }

    @Test
    void processScheduledPublishes_replicationFailure_continuesOtherNodes() {
        ContentNode n1 = draftNode("content.page1");
        ContentNode n2 = draftNode("content.page2");
        when(nodeRepository.findDueForPublish(any())).thenReturn(List.of(n1, n2));
        doThrow(new RuntimeException("RabbitMQ down"))
                .when(replicationAgent).replicate(eq("content.page1"), any(), any());

        service.processScheduledPublishes();

        verify(replicationAgent).replicate("content.page1", ReplicationAction.ACTIVATE, "system:scheduler");
        verify(replicationAgent).replicate("content.page2", ReplicationAction.ACTIVATE, "system:scheduler");
        // n2 was replicated successfully, so its scheduledPublishAt should be cleared
        assertThat(n2.getScheduledPublishAt()).isNull();
    }

    @Test
    void processScheduledPublishes_clearScheduleAfterSuccess() {
        ContentNode node = draftNode("content.home");
        node.setScheduledPublishAt(Instant.now().minusSeconds(10));
        when(nodeRepository.findDueForPublish(any())).thenReturn(List.of(node));

        service.processScheduledPublishes();

        ArgumentCaptor<ContentNode> captor = ArgumentCaptor.forClass(ContentNode.class);
        verify(nodeRepository).save(captor.capture());
        assertThat(captor.getValue().getScheduledPublishAt()).isNull();
    }

    // ── processScheduledDeactivations ─────────────────────────────────────────

    @Test
    void processScheduledDeactivations_replicatesEachDueNode() {
        ContentNode n1 = publishedNode("content.page1");
        ContentNode n2 = publishedNode("content.page2");
        when(nodeRepository.findDueForDeactivation(any())).thenReturn(List.of(n1, n2));

        service.processScheduledDeactivations();

        verify(replicationAgent).replicate("content.page1", ReplicationAction.DEACTIVATE, "system:scheduler");
        verify(replicationAgent).replicate("content.page2", ReplicationAction.DEACTIVATE, "system:scheduler");
        verify(nodeRepository, times(2)).save(any(ContentNode.class));
    }

    @Test
    void processScheduledDeactivations_noDueNodes_doesNothing() {
        when(nodeRepository.findDueForDeactivation(any())).thenReturn(List.of());

        service.processScheduledDeactivations();

        verifyNoInteractions(replicationAgent);
        verify(nodeRepository, never()).save(any());
    }

    @Test
    void processScheduledDeactivations_clearScheduleAfterSuccess() {
        ContentNode node = publishedNode("content.home");
        node.setScheduledDeactivateAt(Instant.now().minusSeconds(10));
        when(nodeRepository.findDueForDeactivation(any())).thenReturn(List.of(node));

        service.processScheduledDeactivations();

        ArgumentCaptor<ContentNode> captor = ArgumentCaptor.forClass(ContentNode.class);
        verify(nodeRepository).save(captor.capture());
        assertThat(captor.getValue().getScheduledDeactivateAt()).isNull();
    }
}
