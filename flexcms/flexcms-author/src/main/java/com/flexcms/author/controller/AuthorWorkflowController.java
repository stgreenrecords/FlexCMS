package com.flexcms.author.controller;

import com.flexcms.author.service.WorkflowEngine;
import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.model.WorkflowInstance;
import com.flexcms.core.model.WorkflowInstance.WorkflowStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import java.util.UUID;

/**
 * Author-side REST API for workflow management.
 */
@Tag(name = "Author Workflow", description = "Content approval workflows — start, advance, and query workflow instances")
@ConditionalOnProperty(name = "flexcms.runmode", havingValue = "author", matchIfMissing = true)
@RestController
@RequestMapping("/api/author/workflow")
public class AuthorWorkflowController {

    @Autowired
    private WorkflowEngine workflowEngine;

    @Operation(summary = "Start workflow", description = "Starts a new approval workflow for the specified content path.")
    @PostMapping("/start")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR')")
    public ResponseEntity<WorkflowInstance> startWorkflow(@Valid @RequestBody StartWorkflowRequest request) {
        WorkflowInstance instance = workflowEngine.startWorkflow(
                request.workflowName(), request.contentPath(), request.userId());
        return ResponseEntity.ok(instance);
    }

    @Operation(summary = "Advance workflow", description = "Advances a workflow by performing an action (approve, reject, publish, etc.).")
    @PostMapping("/advance")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_REVIEWER','CONTENT_PUBLISHER')")
    public ResponseEntity<WorkflowInstance> advance(@Valid @RequestBody AdvanceWorkflowRequest request) {
        WorkflowInstance instance = workflowEngine.advance(
                request.instanceId(), request.action(), request.userId(), request.comment());
        return ResponseEntity.ok(instance);
    }

    @Operation(summary = "Cancel workflow", description = "Cancels an active workflow instance.")
    @PostMapping("/cancel")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR')")
    public ResponseEntity<WorkflowInstance> cancel(@RequestParam UUID instanceId,
                                                    @RequestParam String userId,
                                                    @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(workflowEngine.cancel(instanceId, userId, reason));
    }

    @Operation(summary = "List workflows by status", description = "Returns a paginated list of workflow instances filtered by status (ACTIVE, COMPLETED, CANCELLED).")
    @GetMapping("/list")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_REVIEWER','CONTENT_PUBLISHER')")
    public ResponseEntity<Page<WorkflowInstance>> list(
            @RequestParam(defaultValue = "ACTIVE") WorkflowStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(workflowEngine.listByStatus(status, PageRequest.of(page, Math.min(size, 200))));
    }

    @Operation(summary = "List workflows for user", description = "Returns paginated workflow instances pending the given user's action.")
    @GetMapping("/for-user")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_REVIEWER','CONTENT_PUBLISHER')")
    public ResponseEntity<Page<WorkflowInstance>> listForUser(
            @RequestParam String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(workflowEngine.listForUser(userId, PageRequest.of(page, Math.min(size, 200))));
    }

    @Operation(summary = "Get active workflow", description = "Returns the active workflow instance for the given content path, or 404 if none.")
    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR','CONTENT_REVIEWER','CONTENT_PUBLISHER')")
    public ResponseEntity<WorkflowInstance> getActive(@RequestParam String contentPath) {
        return ResponseEntity.ok(
                workflowEngine.getActiveWorkflow(contentPath)
                        .orElseThrow(() -> new NotFoundException(
                                "No active workflow for content path: " + contentPath))
        );
    }

    public record StartWorkflowRequest(
            @NotBlank(message = "workflowName is required") String workflowName,
            @NotBlank(message = "contentPath is required") String contentPath,
            @NotBlank(message = "userId is required") String userId) {}

    public record AdvanceWorkflowRequest(
            @NotNull(message = "instanceId is required") UUID instanceId,
            @NotBlank(message = "action is required") String action,
            @NotBlank(message = "userId is required") String userId,
            String comment) {}
}
