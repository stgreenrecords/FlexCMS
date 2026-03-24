package com.flexcms.author.controller;

import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.ContentNodeVersion;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.core.service.ContentNodeService;
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
        return nodeService.getByPath(path)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get a page with full component tree.
     */
    @GetMapping("/page")
    public ResponseEntity<ContentNode> getPage(@RequestParam String path) {
        return nodeService.getWithChildren(path)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Create a new content node.
     */
    @PostMapping("/node")
    public ResponseEntity<ContentNode> createNode(@RequestBody CreateNodeRequest request) {
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
    public ResponseEntity<ContentNode> updateProperties(@RequestBody UpdatePropertiesRequest request) {
        ContentNode node = nodeService.updateProperties(request.path(), request.properties(), request.userId());
        return ResponseEntity.ok(node);
    }

    /**
     * Move a node to a new parent.
     */
    @PostMapping("/node/move")
    public ResponseEntity<ContentNode> moveNode(@RequestBody MoveNodeRequest request) {
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

    // Request DTOs
    public record CreateNodeRequest(String parentPath, String name, String resourceType,
                                     Map<String, Object> properties, String userId) {}
    public record UpdatePropertiesRequest(String path, Map<String, Object> properties, String userId) {}
    public record MoveNodeRequest(String sourcePath, String targetParentPath, String userId) {}
}

