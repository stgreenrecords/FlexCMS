package com.flexcms.core.event;

import org.springframework.context.ApplicationEvent;

import java.util.UUID;

/**
 * Published when a content node and its subtree are deleted on the author side.
 *
 * <p>Deletion used to be a purely local operation: {@code ContentNodeService.delete()}
 * removed the subtree and wrote an audit entry, and nothing told the publish
 * environment. {@code ReplicationReceiver} had always implemented
 * {@code case DELETE -> deleteContent(event)}, but no producer anywhere emitted a
 * {@code ReplicationAction.DELETE}, so an author could delete a published page and
 * the public site would keep serving it indefinitely.</p>
 *
 * <p>This event closes that gap the same way {@link ContentStatusChangedEvent}
 * closed the publish gap: the service announces what happened, and a listener in
 * {@code flexcms-replication} decides what to do about it. Consumers bind with
 * {@code AFTER_COMMIT} so a rolled-back deletion is never replicated.</p>
 *
 * <p>The node itself is gone by the time this fires, so the event carries the
 * identifying details rather than the entity.</p>
 */
public class ContentDeletedEvent extends ApplicationEvent {

    private final String path;
    private final UUID nodeId;
    private final String resourceType;
    private final String siteId;
    private final String locale;
    private final String userId;

    public ContentDeletedEvent(Object source, String path, UUID nodeId, String resourceType,
                               String siteId, String locale, String userId) {
        super(source);
        this.path = path;
        this.nodeId = nodeId;
        this.resourceType = resourceType;
        this.siteId = siteId;
        this.locale = locale;
        this.userId = userId;
    }

    /** ltree path of the deleted subtree root. */
    public String getPath() {
        return path;
    }

    /** Id the node had before deletion, for audit correlation. */
    public UUID getNodeId() {
        return nodeId;
    }

    public String getResourceType() {
        return resourceType;
    }

    /** Site the deleted content belonged to; carried so listeners need no lookup. */
    public String getSiteId() {
        return siteId;
    }

    /** Locale the deleted content belonged to. */
    public String getLocale() {
        return locale;
    }

    public String getUserId() {
        return userId;
    }
}
