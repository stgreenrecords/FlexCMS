package com.flexcms.core.event;

import com.flexcms.core.model.ContentNode;
import org.springframework.context.ApplicationEvent;

/**
 * Spring ApplicationEvent fired when a content node must be added to or removed from
 * the full-text search index.
 *
 * <p>Published by the replication receiver after each ACTIVATE / DEACTIVATE / DELETE
 * operation so that the search module can react without a direct module dependency on
 * the replication module.</p>
 *
 * <p>Usage:</p>
 * <ul>
 *   <li>{@link #index(Object, ContentNode)} — after a node is activated/published</li>
 *   <li>{@link #remove(Object, String)} — after a node is deactivated or deleted</li>
 * </ul>
 */
public class ContentIndexEvent extends ApplicationEvent {

    public enum Action { INDEX, REMOVE }

    private final Action action;
    private final String path;

    /** Non-null when {@code action == INDEX}; null for {@code REMOVE} events. */
    private final ContentNode node;

    private ContentIndexEvent(Object source, Action action, String path, ContentNode node) {
        super(source);
        this.action = action;
        this.path = path;
        this.node = node;
    }

    /** Create an INDEX event carrying the full node payload. */
    public static ContentIndexEvent index(Object source, ContentNode node) {
        return new ContentIndexEvent(source, Action.INDEX, node.getPath(), node);
    }

    /** Create a REMOVE event for the given path (node payload not required). */
    public static ContentIndexEvent remove(Object source, String path) {
        return new ContentIndexEvent(source, Action.REMOVE, path, null);
    }

    public Action getAction() { return action; }
    public String getPath() { return path; }
    /** Returns the node for INDEX events; {@code null} for REMOVE events. */
    public ContentNode getNode() { return node; }
}
