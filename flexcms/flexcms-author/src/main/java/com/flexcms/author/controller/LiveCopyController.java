package com.flexcms.author.controller;

import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.LiveCopyRelationship;
import com.flexcms.multisite.service.LiveCopyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST API for live copy (blueprint/inheritance) management.
 *
 * <ul>
 *   <li>{@code POST  /api/author/livecopy}             — create a live copy</li>
 *   <li>{@code POST  /api/author/livecopy/rollout}     — rollout blueprint changes to live copies</li>
 *   <li>{@code DELETE /api/author/livecopy}            — detach a live copy</li>
 *   <li>{@code GET   /api/author/livecopy}             — list all live copies of a source</li>
 *   <li>{@code GET   /api/author/livecopy/status}      — check if a path is a live copy</li>
 * </ul>
 */
@Tag(name = "Live Copy", description = "Live copy (blueprint) management for multi-site content sharing")
@RestController
@RequestMapping("/api/author/livecopy")
public class LiveCopyController {

    @Autowired
    private LiveCopyService liveCopyService;

    /**
     * Create a live copy of a content subtree.
     *
     * @param request the creation request (sourcePath, targetParentPath, targetName, deep, excludedProps)
     * @return the created root copy node
     */
    @Operation(summary = "Create a live copy of a content subtree")
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR')")
    public ResponseEntity<ContentNode> createLiveCopy(@Valid @RequestBody CreateLiveCopyRequest request) {
        ContentNode copy = liveCopyService.createLiveCopy(
                toContentPath(request.sourcePath()),
                toContentPath(request.targetParentPath()),
                request.targetName(),
                request.deep(),
                request.excludedProps(),
                request.userId()
        );
        return ResponseEntity.ok(copy);
    }

    /**
     * Roll out blueprint changes to all registered live copies.
     *
     * @param sourcePath the blueprint path to roll out from
     * @param userId     actor performing the rollout
     * @return rollout result summary
     */
    @Operation(summary = "Rollout blueprint changes to live copies")
    @PostMapping("/rollout")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR','CONTENT_PUBLISHER')")
    public ResponseEntity<LiveCopyService.RolloutResult> rollout(
            @NotBlank(message = "sourcePath is required") @RequestParam String sourcePath,
            @NotBlank(message = "userId is required") @RequestParam String userId) {

        LiveCopyService.RolloutResult result = liveCopyService.rollout(toContentPath(sourcePath), userId);
        return ResponseEntity.ok(result);
    }

    /**
     * Detach a live copy, breaking its synchronization with the blueprint.
     *
     * @param targetPath the live copy path to detach
     * @param deep       if {@code true}, also detach all descendant relationships
     */
    @Operation(summary = "Detach a live copy from its blueprint")
    @DeleteMapping
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR')")
    public ResponseEntity<Void> detach(
            @NotBlank(message = "targetPath is required") @RequestParam String targetPath,
            @RequestParam(defaultValue = "true") boolean deep) {

        liveCopyService.detach(toContentPath(targetPath), deep);
        return ResponseEntity.ok().build();
    }

    /**
     * List all live copies of a blueprint path.
     *
     * @param sourcePath the blueprint path
     * @return list of live-copy relationships
     */
    @Operation(summary = "List all live copies of a blueprint path")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR','CONTENT_REVIEWER','CONTENT_PUBLISHER')")
    public ResponseEntity<List<LiveCopyRelationship>> findLiveCopies(
            @NotBlank(message = "sourcePath is required") @RequestParam String sourcePath) {

        List<LiveCopyRelationship> copies = liveCopyService.findLiveCopies(toContentPath(sourcePath));
        return ResponseEntity.ok(copies);
    }

    /**
     * Check whether a given path is a live copy, and if so return its blueprint relationship.
     *
     * @param targetPath the content path to check
     * @return JSON status object: {@code {isLiveCopy: boolean, sourcePath: string|null}}
     */
    @Operation(summary = "Check if a path is a live copy and get its blueprint")
    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR','CONTENT_REVIEWER','CONTENT_PUBLISHER')")
    public ResponseEntity<Map<String, Object>> getLiveCopyStatus(
            @NotBlank(message = "targetPath is required") @RequestParam String targetPath) {

        String contentPath = toContentPath(targetPath);
        var rel = liveCopyService.getRelationship(contentPath);

        Map<String, Object> status = new java.util.LinkedHashMap<>();
        status.put("isLiveCopy", rel.isPresent());
        status.put("targetPath", contentPath);
        status.put("sourcePath", rel.map(LiveCopyRelationship::getSourcePath).orElse(null));
        status.put("deep", rel.map(LiveCopyRelationship::isDeep).orElse(null));
        status.put("excludedProps", rel.map(r -> r.getExcludedPropsList()).orElse(null));
        return ResponseEntity.ok(status);
    }

    private String toContentPath(String path) {
        if (path == null) return null;
        String p = path.startsWith("/") ? path.substring(1) : path;
        p = p.replace("/", ".");
        return p.startsWith("content.") ? p : "content." + p;
    }

    public record CreateLiveCopyRequest(
            @NotBlank(message = "sourcePath is required") String sourcePath,
            @NotBlank(message = "targetParentPath is required") String targetParentPath,
            @NotBlank(message = "targetName is required") String targetName,
            boolean deep,
            String excludedProps,
            @NotBlank(message = "userId is required") String userId
    ) {
        public CreateLiveCopyRequest {
            if (!deep && excludedProps == null) excludedProps = "";
        }
    }
}
