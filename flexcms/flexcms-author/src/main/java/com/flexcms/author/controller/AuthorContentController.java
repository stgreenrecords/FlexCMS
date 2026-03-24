package com.flexcms.author.controller;

import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.ContentNodeVersion;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.core.service.ContentNodeService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Author-side REST API for content CRUD, locking, versioning.
 */
@RestController
@RequestMapping("/api/author/content")
public class AuthorContentController {

    @Autowired
    private ContentNodeService nodeService;

    /**
     * Get a content node by path.
     */
    @GetMapping("/node")
    public ResponseEntity<ContentNode> getNode(@RequestParam String path) {
        return ResponseEntity.ok(
                nodeService.getByPath(path)
                        .orElseThrow(() -> NotFoundException.forPath(path))
        );
    }

    /**
     * Get a page with full component tree.
     */
    @GetMapping("/page")
    public ResponseEntity<ContentNode> getPage(@RequestParam String path) {
        return ResponseEntity.ok(
                nodeService.getWithChildren(path)
                        .orElseThrow(() -> NotFoundException.forPath(path))
        );
    }

    /**
     * Create a new content node.
     */
    @PostMapping("/node")
    public ResponseEntity<ContentNode> createNode(@Valid @RequestBody CreateNodeRequest request) {
        ContentNode node = nodeService.create(
                request.parentPath(),
                request.name(),
                request.resourceType(),
                request.properties(),
                request.userId()
        );
        return ResponseEntity.ok(node);
    }

    /**
     * Update node properties (partial merge).
     */
    @PutMapping("/node/properties")
    public ResponseEntity<ContentNode> updateProperties(@Valid @RequestBody UpdatePropertiesRequest request) {
        ContentNode node = nodeService.updateProperties(request.path(), request.properties(), request.userId());
        return ResponseEntity.ok(node);
    }

    /**
     * Move a node to a new parent.
     */
    @PostMapping("/node/move")
    public ResponseEntity<ContentNode> moveNode(@Valid @RequestBody MoveNodeRequest request) {
        ContentNode node = nodeService.move(request.sourcePath(), request.targetParentPath(), request.userId());
        return ResponseEntity.ok(node);
    }

    /**
     * Delete a node and all descendants.
     */
    @DeleteMapping("/node")
    public ResponseEntity<Void> deleteNode(@RequestParam String path) {
        nodeService.delete(path);
        return ResponseEntity.ok().build();
    }

    /**
     * Lock a node for editing.
     */
    @PostMapping("/node/lock")
    public ResponseEntity<ContentNode> lock(@RequestParam String path, @RequestParam String userId) {
        return ResponseEntity.ok(nodeService.lock(path, userId));
    }

    /**
     * Unlock a node.
     */
    @PostMapping("/node/unlock")
    public ResponseEntity<ContentNode> unlock(@RequestParam String path, @RequestParam String userId) {
        return ResponseEntity.ok(nodeService.unlock(path, userId));
    }

    /**
     * Update node status.
     */
    @PostMapping("/node/status")
    public ResponseEntity<ContentNode> updateStatus(@RequestParam String path,
                                                      @RequestParam NodeStatus status,
                                                      @RequestParam String userId) {
        return ResponseEntity.ok(nodeService.updateStatus(path, status, userId));
    }

    /**
     * Get version history.
     */
    @GetMapping("/node/versions")
    public ResponseEntity<Page<ContentNodeVersion>> getVersions(
            @RequestParam UUID nodeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(nodeService.getVersionHistory(nodeId, PageRequest.of(page, size)));
    }

    /**
     * Restore a specific version.
     */
    @PostMapping("/node/restore")
    public ResponseEntity<ContentNode> restoreVersion(@RequestParam UUID nodeId,
                                                        @RequestParam Long versionNumber,
                                                        @RequestParam String userId) {
        return ResponseEntity.ok(nodeService.restoreVersion(nodeId, versionNumber, userId));
    }

    // Request DTOs with validation constraints
    public record CreateNodeRequest(
            @NotBlank(message = "parentPath is required") String parentPath,
            @NotBlank(message = "name is required") String name,
            @NotBlank(message = "resourceType is required") String resourceType,
            Map<String, Object> properties,
            @NotBlank(message = "userId is required") String userId) {}

    public record UpdatePropertiesRequest(
            @NotBlank(message = "path is required") String path,
            @NotNull(message = "properties is required") Map<String, Object> properties,
            @NotBlank(message = "userId is required") String userId) {}

    public record MoveNodeRequest(
            @NotBlank(message = "sourcePath is required") String sourcePath,
            @NotBlank(message = "targetParentPath is required") String targetParentPath,
            @NotBlank(message = "userId is required") String userId) {}
}
