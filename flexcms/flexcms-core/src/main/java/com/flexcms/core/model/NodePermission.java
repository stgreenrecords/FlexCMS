package com.flexcms.core.model;

/**
 * Permissions that can be granted or denied on a content node.
 *
 * <p>Permissions are checked hierarchically: if an ancestor node has an ACL entry
 * with {@code inherit=true}, it applies to all descendants unless overridden closer
 * to the target node.
 */
public enum NodePermission {

    /** Read node properties and children. */
    READ,

    /** Create or update node properties. */
    WRITE,

    /** Delete the node and its subtree. */
    DELETE,

    /** Change node status (e.g. DRAFT → PUBLISHED). */
    PUBLISH,

    /** Grant or revoke ACL entries on the node. */
    MANAGE_ACL
}
