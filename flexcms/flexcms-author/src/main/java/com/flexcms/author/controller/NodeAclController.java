package com.flexcms.author.controller;

import com.flexcms.core.model.NodeAcl;
import com.flexcms.core.model.NodePermission;
import com.flexcms.core.service.NodeAclService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

/**
 * REST API for managing per-node ACL entries.
 *
 * <p>All endpoints require ADMIN or MANAGE_ACL permission on the target node.
 * Regular content authors can only be granted access by an ADMIN.
 */
@Tag(name = "Author ACL", description = "Per-node access control list management — grant and revoke permissions for principals on content nodes")
@ConditionalOnProperty(name = "flexcms.runmode", havingValue = "author", matchIfMissing = true)
@RestController
@RequestMapping("/api/author/acl")
public class NodeAclController {

    @Autowired
    private NodeAclService nodeAclService;

    @Operation(summary = "Get node ACLs", description = "Returns all ACL entries directly set on a node (not inherited).")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN') or hasPermission(#nodePath, 'MANAGE_ACL')")
    public ResponseEntity<List<NodeAcl>> getAcls(
            @NotBlank(message = "nodePath is required") @RequestParam String nodePath) {
        return ResponseEntity.ok(nodeAclService.getAclsForPath(nodePath));
    }

    @Operation(summary = "Get effective ACLs", description = "Returns effective ACL entries — direct entries plus those inherited from ancestor nodes.")
    @GetMapping("/effective")
    @PreAuthorize("hasAnyRole('ADMIN') or hasPermission(#nodePath, 'MANAGE_ACL')")
    public ResponseEntity<List<NodeAcl>> getEffectiveAcls(
            @NotBlank(message = "nodePath is required") @RequestParam String nodePath) {
        return ResponseEntity.ok(nodeAclService.getEffectiveAcls(nodePath));
    }

    @Operation(summary = "Grant permissions", description = "Grants or updates permissions for a principal (user/group) on a content node.")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasPermission(#request.nodePath, 'MANAGE_ACL')")
    public ResponseEntity<NodeAcl> grant(@Valid @RequestBody GrantAclRequest request) {
        NodeAcl acl = nodeAclService.grant(
                request.nodePath(),
                request.principal(),
                request.permissions(),
                request.allow(),
                request.inherit());
        return ResponseEntity.ok(acl);
    }

    @Operation(summary = "Revoke permissions", description = "Revokes all permissions for a principal on a content node.")
    @DeleteMapping
    @PreAuthorize("hasRole('ADMIN') or hasPermission(#nodePath, 'MANAGE_ACL')")
    public ResponseEntity<Void> revoke(
            @NotBlank(message = "nodePath is required") @RequestParam String nodePath,
            @NotBlank(message = "principal is required") @RequestParam String principal) {
        nodeAclService.revoke(nodePath, principal);
        return ResponseEntity.noContent().build();
    }

    // ── Request DTOs ──────────────────────────────────────────────────────────

    public record GrantAclRequest(
            @NotBlank(message = "nodePath is required") String nodePath,
            @NotBlank(message = "principal is required") String principal,
            @NotEmpty(message = "permissions must not be empty") Set<NodePermission> permissions,
            boolean allow,
            boolean inherit) {}
}
