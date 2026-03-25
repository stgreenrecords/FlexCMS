package com.flexcms.author.controller;

import com.flexcms.author.service.WorkflowEngine;
import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.model.WorkflowInstance;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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

    /** Start a new workflow for content. */
    @PostMapping("/start")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR')")
    public ResponseEntity<WorkflowInstance> startWorkflow(@Valid @RequestBody StartWorkflowRequest request) {
        WorkflowInstance instance = workflowEngine.startWorkflow(
                request.workflowName(), request.contentPath(), request.userId());
        return ResponseEntity.ok(instance);
    }

    /** Advance a workflow (approve, reject, publish, etc.). */
    @PostMapping("/advance")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_REVIEWER','CONTENT_PUBLISHER')")
    public ResponseEntity<WorkflowInstance> advance(@Valid @RequestBody AdvanceWorkflowRequest request) {
        WorkflowInstance instance = workflowEngine.advance(
                request.instanceId(), request.action(), request.userId(), request.comment());
        return ResponseEntity.ok(instance);
    }

    /** Cancel an active workflow. */
    @PostMapping("/cancel")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR')")
    public ResponseEntity<WorkflowInstance> cancel(@RequestParam UUID instanceId,
                                                    @RequestParam String userId,
                                                    @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(workflowEngine.cancel(instanceId, userId, reason));
    }

    /** Get the active workflow for a content path. */
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
