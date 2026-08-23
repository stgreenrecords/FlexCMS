package com.flexcms.author.service;

import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.core.service.ContentNodeService;
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
    @Mock private ContentNodeService nodeService;

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

        // The scheduler transitions the node; ContentPublishReplicationListener is
        // what turns that into replication. Asserting the transition here is what
        // catches the original defect, where the page went live on publish while the
        // author still read DRAFT.
        verify(nodeService).updateStatus("content.page1", NodeStatus.PUBLISHED, "system:scheduler");
        verify(nodeService).updateStatus("content.page2", NodeStatus.PUBLISHED, "system:scheduler");
        verify(nodeRepository, times(2)).save(any(ContentNode.class));
    }

    @Test
    void processScheduledPublishes_transitionsStatusSoAuthorAndPublishAgree() {
        ContentNode node = draftNode("content.page1");
        when(nodeRepository.findDueForPublish(any(Instant.class))).thenReturn(List.of(node));

        service.processScheduledPublishes();

        // The regression this pins: the scheduler used to call the replication agent
        // directly and never transition the node, so the page was live on :8081 while
        // the author still showed DRAFT — and findDueForPublish (status <> PUBLISHED)
        // would have re-selected it on a later schedule.
        verify(nodeService).updateStatus("content.page1", NodeStatus.PUBLISHED, "system:scheduler");
    }

    @Test
    void processScheduledPublishes_noDueNodes_doesNothing() {
        when(nodeRepository.findDueForPublish(any())).thenReturn(List.of());

        service.processScheduledPublishes();

        verifyNoInteractions(nodeService);
        verify(nodeRepository, never()).save(any());
    }

    @Test
    void processScheduledPublishes_replicationFailure_continuesOtherNodes() {
        ContentNode n1 = draftNode("content.page1");
        ContentNode n2 = draftNode("content.page2");
        when(nodeRepository.findDueForPublish(any())).thenReturn(List.of(n1, n2));
        doThrow(new RuntimeException("RabbitMQ down"))
                .when(nodeService).updateStatus(eq("content.page1"), any(), any());

        service.processScheduledPublishes();

        verify(nodeService).updateStatus("content.page1", NodeStatus.PUBLISHED, "system:scheduler");
        verify(nodeService).updateStatus("content.page2", NodeStatus.PUBLISHED, "system:scheduler");
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

        // Same reasoning as the publish case: previously neither the author status
        // nor the publish site reflected a scheduled deactivation.
        verify(nodeService).updateStatus("content.page1", NodeStatus.ARCHIVED, "system:scheduler");
        verify(nodeService).updateStatus("content.page2", NodeStatus.ARCHIVED, "system:scheduler");
        verify(nodeRepository, times(2)).save(any(ContentNode.class));
    }

    @Test
    void processScheduledDeactivations_noDueNodes_doesNothing() {
        when(nodeRepository.findDueForDeactivation(any())).thenReturn(List.of());

        service.processScheduledDeactivations();

        verifyNoInteractions(nodeService);
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
