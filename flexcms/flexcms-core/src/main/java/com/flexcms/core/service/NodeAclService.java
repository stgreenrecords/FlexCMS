package com.flexcms.core.service;

import com.flexcms.core.model.NodeAcl;
import com.flexcms.core.model.NodePermission;
import com.flexcms.core.repository.NodeAclRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Evaluates per-node ACL permissions and manages ACL entries.
 *
 * <h3>Permission evaluation algorithm</h3>
 * <ol>
 *   <li>ADMIN role → always allow (bypass ACL).</li>
 *   <li>Collect effective ACL entries: direct entries on the node + inheritable
 *       entries from ancestors (closest ancestor first, because the repository
 *       query orders by {@code length(node_path) DESC}).</li>
 *   <li>Find the first entry that:
 *       <ul>
 *         <li>matches the principal ({@code user:{id}}, {@code role:{roleName}},
 *             or {@code everyone}), AND</li>
 *         <li>contains the requested permission.</li>
 *       </ul>
 *   </li>
 *   <li>If the first matching entry is a DENY → deny. If it is an ALLOW → allow.</li>
 *   <li>No matching entry → deny (safe default).</li>
 * </ol>
 */
@Service
public class NodeAclService {

    /** Principal prefix for user-specific entries. */
    public static final String USER_PREFIX = "user:";

    /** Principal prefix for role-specific entries. */
    public static final String ROLE_PREFIX = "role:";

    /** Wildcard principal that matches every authenticated user. */
    public static final String EVERYONE = "everyone";

    @Autowired
    private NodeAclRepository aclRepository;

    // ── Permission evaluation ──────────────────────────────────────────────────

    /**
     * Returns {@code true} if the authenticated principal is allowed to perform
     * {@code permission} on {@code nodePath}.
     *
     * @param authentication the current Spring Security authentication token
     * @param nodePath       content node path (ltree dot-separated)
     * @param permission     the requested permission
     */
    public boolean isAllowed(Authentication authentication, String nodePath,
                              NodePermission permission) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        // ADMIN bypasses all ACL checks
        if (hasAdminRole(authentication)) {
            return true;
        }

        String userId = authentication.getName();
        Set<String> roles = extractRoles(authentication);

        List<NodeAcl> effective = aclRepository.findEffectiveAcls(nodePath);

        for (NodeAcl acl : effective) {
            if (!matchesPrincipal(acl.getPrincipal(), userId, roles)) {
                continue;
            }
            if (!acl.getPermissions().contains(permission.name())) {
                continue;
            }
            // First matching entry decides (closest ancestor first due to ORDER BY)
            return acl.isAllow();
        }

        // No matching ACL entry → deny
        return false;
    }

    // ── ACL management ────────────────────────────────────────────────────────

    /**
     * Retrieve all ACL entries directly on a node.
     */
    @Transactional(readOnly = true)
    public List<NodeAcl> getAclsForPath(String nodePath) {
        return aclRepository.findByNodePath(nodePath);
    }

    /**
     * Retrieve effective ACL entries (direct + inherited from ancestors).
     */
    @Transactional(readOnly = true)
    public List<NodeAcl> getEffectiveAcls(String nodePath) {
        return aclRepository.findEffectiveAcls(nodePath);
    }

    /**
     * Grant or update permissions for a principal on a node.
     * If an entry for the same path+principal already exists it is replaced.
     */
    @Transactional
    public NodeAcl grant(String nodePath, String principal,
                         Set<NodePermission> permissions,
                         boolean allow, boolean inherit) {
        // Remove any existing entry for this path+principal
        aclRepository.deleteByNodePathAndPrincipal(nodePath, principal);

        List<String> permNames = permissions.stream()
                .map(Enum::name)
                .collect(Collectors.toList());

        NodeAcl acl = new NodeAcl(nodePath, principal, permNames, allow, inherit);
        return aclRepository.save(acl);
    }

    /**
     * Revoke all permissions for a principal on a specific node.
     */
    @Transactional
    public void revoke(String nodePath, String principal) {
        aclRepository.deleteByNodePathAndPrincipal(nodePath, principal);
    }

    /**
     * Remove all ACL entries for a node (called when the node is deleted).
     */
    @Transactional
    public void deleteAclsForNode(String nodePath) {
        aclRepository.deleteByNodePath(nodePath);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private boolean hasAdminRole(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN"));
    }

    private Set<String> extractRoles(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring("ROLE_".length()))   // strip ROLE_ prefix
                .collect(Collectors.toSet());
    }

    private boolean matchesPrincipal(String principal, String userId, Set<String> roles) {
        if (EVERYONE.equals(principal)) {
            return true;
        }
        if (principal.startsWith(USER_PREFIX)) {
            return userId.equals(principal.substring(USER_PREFIX.length()));
        }
        if (principal.startsWith(ROLE_PREFIX)) {
            String roleName = principal.substring(ROLE_PREFIX.length());
            return roles.contains(roleName);
        }
        return false;
    }
}
