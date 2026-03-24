package com.flexcms.author.controller;

import com.flexcms.author.service.WorkflowEngine;
import com.flexcms.core.model.WorkflowInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Author-side REST API for workflow management.
 */
@RestController
@RequestMapping("/api/author/workflow")
public class AuthorWorkflowController {

    @Autowired
    private WorkflowEngine workflowEngine;

    /**
     * Start a new workflow for content.
     */
    @PostMapping("/start")
    public ResponseEntity<WorkflowInstance> startWorkflow(@RequestBody StartWorkflowRequest request) {
        WorkflowInstance instance = workflowEngine.startWorkflow(
                request.workflowName(), request.contentPath(), request.userId());
        return ResponseEntity.ok(instance);
    }

    /**
     * Advance a workflow (approve, reject, publish, etc.).
     */
    @PostMapping("/advance")
    public ResponseEntity<WorkflowInstance> advance(@RequestBody AdvanceWorkflowRequest request) {
        WorkflowInstance instance = workflowEngine.advance(
                request.instanceId(), request.action(), request.userId(), request.comment());
        return ResponseEntity.ok(instance);
    }

    /**
     * Cancel an active workflow.
     */
    @PostMapping("/cancel")
    public ResponseEntity<WorkflowInstance> cancel(@RequestParam UUID instanceId,
                                                     @RequestParam String userId,
                                                     @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(workflowEngine.cancel(instanceId, userId, reason));
    }

    /**
     * Get the active workflow for a content path.
     */
    @GetMapping("/active")
    public ResponseEntity<WorkflowInstance> getActive(@RequestParam String contentPath) {
        return workflowEngine.getActiveWorkflow(contentPath)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    public record StartWorkflowRequest(String workflowName, String contentPath, String userId) {}
    public record AdvanceWorkflowRequest(UUID instanceId, String action, String userId, String comment) {}
}

