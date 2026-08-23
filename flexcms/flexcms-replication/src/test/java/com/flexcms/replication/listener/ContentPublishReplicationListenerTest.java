package com.flexcms.replication.listener;

import com.flexcms.core.event.ContentStatusChangedEvent;
import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.replication.model.ReplicationEvent;
import com.flexcms.replication.service.ReplicationAgent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

/**
 * Unit tests for {@link ContentPublishReplicationListener}.
 *
 * <p>Covers the regression this listener exists for: publishing a page through any
 * path must replicate the whole subtree, so the publish environment never serves a
 * page with zero components.</p>
 */
@ExtendWith(MockitoExtension.class)
class ContentPublishReplicationListenerTest {

    @Mock
    private ReplicationAgent replicationAgent;

    @InjectMocks
    private ContentPublishReplicationListener listener;

    private ContentNode node(String path, String resourceType) {
        ContentNode node = new ContentNode(path, path.substring(path.lastIndexOf('.') + 1), resourceType);
        node.setSiteId("tut-usa");
        node.setLocale("en");
        return node;
    }

    private ContentStatusChangedEvent event(ContentNode node, NodeStatus previous, NodeStatus next) {
        return new ContentStatusChangedEvent(this, node, previous, next, "admin");
    }

    @Test
    void publishingAPage_replicatesTheWholeSubtree() {
        ContentNode page = node("content.tut-usa.home", "flexcms/page");

        listener.onContentStatusChanged(event(page, NodeStatus.DRAFT, NodeStatus.PUBLISHED));

        verify(replicationAgent).replicateTree("content.tut-usa.home", "admin");
        verify(replicationAgent, never()).replicate(anyString(), any(), anyString());
    }

    @Test
    void publishingASiteRoot_replicatesTheWholeSubtree() {
        ContentNode siteRoot = node("content.tut-usa", "flexcms/site-root");

        listener.onContentStatusChanged(event(siteRoot, NodeStatus.APPROVED, NodeStatus.PUBLISHED));

        verify(replicationAgent).replicateTree("content.tut-usa", "admin");
    }

    /**
     * An Experience Fragment variation owns component children just as a page does.
     *
     * <p>It was absent from the tree-replication list, so publishing one replicated the
     * variation and left its components behind: the headless XF API on the publish
     * instance served the fragment with `components: []`, and the only way to get
     * reusable content live was to publish each component individually. The equivalent
     * page operation worked, which made the gap easy to miss.</p>
     */
    @Test
    void publishingAnXfVariation_replicatesTheWholeSubtree() {
        ContentNode variation = node(
                "content.experience-fragments.tut-usa.global.navigation.master", "flexcms/xf-page");

        listener.onContentStatusChanged(event(variation, NodeStatus.DRAFT, NodeStatus.PUBLISHED));

        verify(replicationAgent).replicateTree(
                "content.experience-fragments.tut-usa.global.navigation.master", "admin");
        verify(replicationAgent, never()).replicate(anyString(), any(), anyString());
    }

    /** The fragment *folder* holds no components, so it replicates as a single node. */
    @Test
    void publishingAnXfFolder_replicatesTheSingleNode() {
        ContentNode folder = node(
                "content.experience-fragments.tut-usa.global.navigation", "flexcms/xf-folder");

        listener.onContentStatusChanged(event(folder, NodeStatus.DRAFT, NodeStatus.PUBLISHED));

        verify(replicationAgent).replicate("content.experience-fragments.tut-usa.global.navigation",
                ReplicationEvent.ReplicationAction.ACTIVATE, "admin");
        verify(replicationAgent, never()).replicateTree(anyString(), anyString());
    }

    @Test
    void publishingAComponent_replicatesTheSingleNode() {
        ContentNode component = node("content.tut-usa.home.hero-banner",
                "tut-usa/calls-to-action-promotions-campaigns/hero-banner");

        listener.onContentStatusChanged(event(component, NodeStatus.DRAFT, NodeStatus.PUBLISHED));

        verify(replicationAgent).replicate("content.tut-usa.home.hero-banner",
                ReplicationEvent.ReplicationAction.ACTIVATE, "admin");
        verify(replicationAgent, never()).replicateTree(anyString(), anyString());
    }

    @Test
    void leavingPublished_deactivatesOnPublish() {
        ContentNode page = node("content.tut-usa.home", "flexcms/page");

        listener.onContentStatusChanged(event(page, NodeStatus.PUBLISHED, NodeStatus.ARCHIVED));

        verify(replicationAgent).replicate("content.tut-usa.home",
                ReplicationEvent.ReplicationAction.DEACTIVATE, "admin");
        verify(replicationAgent, never()).replicateTree(anyString(), anyString());
    }

    @Test
    void transitionBetweenUnpublishedStates_doesNotReplicate() {
        ContentNode page = node("content.tut-usa.home", "flexcms/page");

        listener.onContentStatusChanged(event(page, NodeStatus.DRAFT, NodeStatus.IN_REVIEW));

        verifyNoInteractions(replicationAgent);
    }

    @Test
    void replicationFailure_isSwallowedSoThePublishedStatusStands() {
        ContentNode page = node("content.tut-usa.home", "flexcms/page");
        doThrow(new IllegalStateException("queue unavailable"))
                .when(replicationAgent).replicateTree(anyString(), anyString());

        assertThatCode(() -> listener.onContentStatusChanged(event(page, NodeStatus.DRAFT, NodeStatus.PUBLISHED)))
                .doesNotThrowAnyException();
    }
}
