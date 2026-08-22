package com.flexcms.core.event;

import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.NodeStatus;
import org.springframework.context.ApplicationEvent;

/**
 * Spring ApplicationEvent fired whenever a content node's {@link NodeStatus} changes.
 *
 * <p>Published by {@code ContentNodeService.updateStatus(...)} — the single place a
 * node's status actually changes — so that every publish path emits it exactly once:
 * the single-node status endpoint, bulk publish, and scheduled publishing all funnel
 * through the same method.</p>
 *
 * <p>Consumers react without a direct module dependency on the core service. The
 * replication module listens for transitions into {@link NodeStatus#PUBLISHED} to
 * activate content on the publish instance, and for transitions away from it to
 * deactivate. Listeners should bind with
 * {@code @TransactionalEventListener(phase = AFTER_COMMIT)} so a rolled-back
 * transition never reaches the publish environment.</p>
 *
 * @see ContentIndexEvent
 */
public class ContentStatusChangedEvent extends ApplicationEvent {

    private final ContentNode node;
    private final NodeStatus previousStatus;
    private final NodeStatus newStatus;
    private final String userId;

    public ContentStatusChangedEvent(Object source,
                                     ContentNode node,
                                     NodeStatus previousStatus,
                                     NodeStatus newStatus,
                                     String userId) {
        super(source);
        this.node = node;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.userId = userId;
    }

    public ContentNode getNode() {
        return node;
    }

    public String getPath() {
        return node != null ? node.getPath() : null;
    }

    public String getResourceType() {
        return node != null ? node.getResourceType() : null;
    }

    /** The status the node held before the transition; {@code null} if unknown. */
    public NodeStatus getPreviousStatus() {
        return previousStatus;
    }

    public NodeStatus getNewStatus() {
        return newStatus;
    }

    public String getUserId() {
        return userId;
    }

    /** True when this transition made the node published. */
    public boolean isPublished() {
        return newStatus == NodeStatus.PUBLISHED;
    }

    /** True when this transition took a previously published node out of publication. */
    public boolean isUnpublished() {
        return previousStatus == NodeStatus.PUBLISHED && newStatus != NodeStatus.PUBLISHED;
    }
}
