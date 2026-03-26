package com.flexcms.author.controller;

import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.model.BulkOperationResult;
import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.ContentNodeVersion;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.core.service.ContentNodeService;
import com.flexcms.replication.model.ReplicationEvent;
import com.flexcms.replication.service.ReplicationAgent;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.flexcms.author.service.ScheduledPublishingService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Author-side REST API for content CRUD, locking, versioning.
 *
 * <p>Role requirements:
 * <ul>
 *   <li>ADMIN — all operations</li>
 *   <li>CONTENT_AUTHOR — create, edit, delete, lock, restore</li>
 *   <li>CONTENT_REVIEWER — read-only (get node/page, view versions, view active workflows)</li>
 *   <li>CONTENT_PUBLISHER — update status (publish/unpublish), read</li>
 * </ul>
 */
@Tag(name = "Author Content", description = "Content node CRUD, versioning, locking, and scheduled publishing")
@ConditionalOnProperty(name = "flexcms.runmode", havingValue = "author", matchIfMissing = true)
@RestController
@RequestMapping("/api/author/content")
public class AuthorContentController {

    @Autowired
    private ContentNodeService nodeService;

    @Autowired
    private ScheduledPublishingService scheduledPublishingService;

    @Autowired
    private ReplicationAgent replicationAgent;

    /** Get a content node by path. */
    @GetMapping("/node")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR','CONTENT_REVIEWER','CONTENT_PUBLISHER')")
    public ResponseEntity<ContentNode> getNode(@RequestParam String path) {
        String contentPath = toContentPath(path);
        return ResponseEntity.ok(
                nodeService.getByPath(contentPath)
                        .orElseThrow(() -> NotFoundException.forPath(contentPath))
        );
    }

    /**
     * List content nodes for a site, paginated.
     * Used by the admin Content Tree UI.
     *
     * @param site   site ID (e.g. "my-site") — required
     * @param locale locale (e.g. "en") — optional, omit to list all locales
     * @param page   zero-based page index (default 0)
     * @param size   page size (default 50, max 200)
     */
    @GetMapping("/list")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR','CONTENT_REVIEWER','CONTENT_PUBLISHER')")
    public ResponseEntity<Page<ContentNode>> listNodes(
            @RequestParam String site,
            @RequestParam(required = false) String locale,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        int clampedSize = Math.min(size, 200);
        return ResponseEntity.ok(
                nodeService.listBySite(site, locale, PageRequest.of(page, clampedSize))
        );
    }

    /** Get a page with full component tree. */
    @GetMapping("/page")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR','CONTENT_REVIEWER','CONTENT_PUBLISHER')")
    public ResponseEntity<ContentNode> getPage(@RequestParam String path) {
        String contentPath = toContentPath(path);
        return ResponseEntity.ok(
                nodeService.getWithChildren(contentPath)
                        .orElseThrow(() -> NotFoundException.forPath(contentPath))
        );
    }

    /** Create a new content node. */
    @PostMapping("/node")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR')")
    public ResponseEntity<ContentNode> createNode(@Valid @RequestBody CreateNodeRequest request) {
        ContentNode node = nodeService.create(
                toContentPath(request.parentPath()),
                request.name(),
                request.resourceType(),
                request.properties(),
                request.userId()
        );
        return ResponseEntity.ok(node);
    }

    /** Update node properties (partial merge). */
    @PutMapping("/node/properties")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR')")
    public ResponseEntity<ContentNode> updateProperties(@Valid @RequestBody UpdatePropertiesRequest request) {
        ContentNode node = nodeService.updateProperties(toContentPath(request.path()), request.properties(), request.userId());
        return ResponseEntity.ok(node);
    }

    /** Move a node to a new parent. */
    @PostMapping("/node/move")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR')")
    public ResponseEntity<ContentNode> moveNode(@Valid @RequestBody MoveNodeRequest request) {
        ContentNode node = nodeService.move(toContentPath(request.sourcePath()), toContentPath(request.targetParentPath()), request.userId());
        return ResponseEntity.ok(node);
    }

    /** Delete a node and all descendants. */
    @DeleteMapping("/node")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR')")
    public ResponseEntity<Void> deleteNode(@RequestParam String path, @RequestParam String userId) {
        nodeService.delete(toContentPath(path), userId);
        return ResponseEntity.ok().build();
    }

    /** Lock a node for editing. */
    @PostMapping("/node/lock")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR')")
    public ResponseEntity<ContentNode> lock(@RequestParam String path, @RequestParam String userId) {
        return ResponseEntity.ok(nodeService.lock(toContentPath(path), userId));
    }

    /** Unlock a node. */
    @PostMapping("/node/unlock")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR')")
    public ResponseEntity<ContentNode> unlock(@RequestParam String path, @RequestParam String userId) {
        return ResponseEntity.ok(nodeService.unlock(toContentPath(path), userId));
    }

    /** Update node status (DRAFT → REVIEW → PUBLISHED → ARCHIVED). */
    @PostMapping("/node/status")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR','CONTENT_PUBLISHER')")
    public ResponseEntity<ContentNode> updateStatus(@RequestParam String path,
                                                     @RequestParam NodeStatus status,
                                                     @RequestParam String userId) {
        return ResponseEntity.ok(nodeService.updateStatus(toContentPath(path), status, userId));
    }

    /** Get version history. */
    @GetMapping("/node/versions")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR','CONTENT_REVIEWER','CONTENT_PUBLISHER')")
    public ResponseEntity<Page<ContentNodeVersion>> getVersions(
            @RequestParam UUID nodeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(nodeService.getVersionHistory(nodeId, PageRequest.of(page, size)));
    }

    /** Schedule a node for future publishing. Pass null publishAt to clear the schedule. */
    @PutMapping("/node/schedule-publish")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_PUBLISHER')")
    public ResponseEntity<Void> schedulePublish(
            @NotBlank(message = "path is required") @RequestParam String path,
            @RequestParam(required = false) Instant publishAt) {
        scheduledPublishingService.schedulePublish(toContentPath(path), publishAt);
        return ResponseEntity.ok().build();
    }

    /** Schedule a node for future deactivation. Pass null deactivateAt to clear the schedule. */
    @PutMapping("/node/schedule-deactivate")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_PUBLISHER')")
    public ResponseEntity<Void> scheduleDeactivate(
            @NotBlank(message = "path is required") @RequestParam String path,
            @RequestParam(required = false) Instant deactivateAt) {
        scheduledPublishingService.scheduleDeactivate(toContentPath(path), deactivateAt);
        return ResponseEntity.ok().build();
    }

    // ── Bulk operations ────────────────────────────────────────────────────────

    /** Bulk publish: publish all listed paths and trigger replication for each. */
    @PostMapping("/bulk/publish")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_PUBLISHER')")
    public ResponseEntity<BulkOperationResult> bulkPublish(@Valid @RequestBody BulkPathsRequest req) {
        BulkOperationResult result = nodeService.bulkUpdateStatus(
                req.paths().stream().map(this::toContentPath).toList(),
                NodeStatus.PUBLISHED, req.userId());
        // Trigger replication for each successfully published path
        req.paths().forEach(path -> {
            try {
                replicationAgent.replicate(toContentPath(path),
                        ReplicationEvent.ReplicationAction.ACTIVATE, req.userId());
            } catch (Exception e) {
                result.addError(path, "replication failed: " + e.getMessage());
            }
        });
        return ResponseEntity.ok(result);
    }

    /** Bulk delete: delete all listed paths and their descendants. */
    @DeleteMapping("/bulk")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR')")
    public ResponseEntity<BulkOperationResult> bulkDelete(@Valid @RequestBody BulkPathsRequest req) {
        BulkOperationResult result = nodeService.bulkDelete(
                req.paths().stream().map(this::toContentPath).toList(),
                req.userId());
        return ResponseEntity.ok(result);
    }

    /** Bulk move: move all listed paths to a common target parent. */
    @PostMapping("/bulk/move")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR')")
    public ResponseEntity<BulkOperationResult> bulkMove(@Valid @RequestBody BulkMoveRequest req) {
        BulkOperationResult result = nodeService.bulkMove(
                req.paths().stream().map(this::toContentPath).toList(),
                toContentPath(req.targetParentPath()),
                req.userId());
        return ResponseEntity.ok(result);
    }

    /** Restore a specific version. */
    @PostMapping("/node/restore")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR')")
    public ResponseEntity<ContentNode> restoreVersion(@RequestParam UUID nodeId,
                                                       @RequestParam Long versionNumber,
                                                       @RequestParam String userId) {
        return ResponseEntity.ok(nodeService.restoreVersion(nodeId, versionNumber, userId));
    }

    /**
     * Normalize a content path from either URL format ({@code /site/en/home})
     * or ltree format ({@code content.site.en.home}) to the canonical ltree form.
     */
    private String toContentPath(String path) {
        String p = path.startsWith("/") ? path.substring(1) : path;
        p = p.replace("/", ".");
        return p.startsWith("content.") ? p : "content." + p;
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

    public record BulkPathsRequest(
            @NotNull(message = "paths is required") List<String> paths,
            @NotBlank(message = "userId is required") String userId) {}

    public record BulkMoveRequest(
            @NotNull(message = "paths is required") List<String> paths,
            @NotBlank(message = "targetParentPath is required") String targetParentPath,
            @NotBlank(message = "userId is required") String userId) {}
}
