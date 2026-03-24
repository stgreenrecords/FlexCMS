package com.flexcms.core.security;

import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.NodePermission;
import com.flexcms.core.service.NodeAclService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.io.Serializable;

/**
 * Spring Security {@link PermissionEvaluator} for per-node ACL checks.
 *
 * <p>Enables expressions such as:
 * <pre>{@code
 *   @PreAuthorize("hasPermission(#path, 'WRITE')")
 *   @PreAuthorize("hasPermission(#path, 'com.flexcms.core.model.ContentNode', 'READ')")
 * }</pre>
 *
 * <p>Registered in {@code SecurityConfig} via a {@code MethodSecurityExpressionHandler} bean.
 */
@Component
public class NodePermissionEvaluator implements PermissionEvaluator {

    @Autowired
    private NodeAclService nodeAclService;

    /**
     * Called by {@code hasPermission(targetDomainObject, permission)} — where the
     * target is either a {@link ContentNode} (its path is used) or a plain {@link String}
     * treated directly as the node path.
     */
    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject,
                                  Object permission) {
        String nodePath = resolveNodePath(targetDomainObject);
        NodePermission perm = resolvePermission(permission);
        if (nodePath == null || perm == null) {
            return false;
        }
        return nodeAclService.isAllowed(authentication, nodePath, perm);
    }

    /**
     * Called by {@code hasPermission(targetId, targetType, permission)} — where
     * {@code targetId} is the node path string and {@code targetType} is ignored
     * (we only manage one ACL type: content nodes).
     */
    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId,
                                  String targetType, Object permission) {
        if (!(targetId instanceof String nodePath)) {
            return false;
        }
        NodePermission perm = resolvePermission(permission);
        if (perm == null) {
            return false;
        }
        return nodeAclService.isAllowed(authentication, nodePath, perm);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String resolveNodePath(Object target) {
        if (target instanceof ContentNode node) {
            return node.getPath();
        }
        if (target instanceof String s) {
            return s;
        }
        return null;
    }

    private NodePermission resolvePermission(Object permission) {
        if (permission instanceof NodePermission perm) {
            return perm;
        }
        if (permission instanceof String s) {
            try {
                return NodePermission.valueOf(s.toUpperCase());
            } catch (IllegalArgumentException e) {
                return null;
            }
        }
        return null;
    }
}
