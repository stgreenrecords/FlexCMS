package com.flexcms.author.service;

import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.core.model.WorkflowDefinition;
import com.flexcms.core.model.WorkflowInstance;
import com.flexcms.core.model.WorkflowInstance.WorkflowStatus;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.core.repository.WorkflowDefinitionRepository;
import com.flexcms.core.repository.WorkflowInstanceRepository;
import com.flexcms.replication.model.ReplicationEvent;
import com.flexcms.replication.service.ReplicationAgent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.*;

/**
 * Workflow engine that drives content through approval/publish states.
 * Workflow definitions are stored as JSON in the DB (see 03_AUTHOR_PUBLISH_REPLICATION.md §4).
 */
@Service
@ConditionalOnProperty(name = "flexcms.runmode", havingValue = "author", matchIfMissing = true)
public class WorkflowEngine {

    private static final Logger log = LoggerFactory.getLogger(WorkflowEngine.class);

    @Autowired
    private WorkflowDefinitionRepository workflowDefRepo;

    @Autowired
    private WorkflowInstanceRepository instanceRepo;

    @Autowired
    private ContentNodeRepository nodeRepository;

    @Autowired(required = false)
    private ReplicationAgent replicationAgent;

    /**
     * Start a workflow for a content node.
     */
    @Transactional
    public WorkflowInstance startWorkflow(String workflowName, String contentPath, String userId) {
        WorkflowDefinition definition = workflowDefRepo.findByName(workflowName)
                .orElseThrow(() -> new IllegalArgumentException("Workflow not found: " + workflowName));

        // Check no active workflow already exists for this path
        instanceRepo.findByContentPathAndStatus(contentPath, WorkflowStatus.ACTIVE)
                .ifPresent(existing -> {
                    throw new IllegalStateException("Active workflow already exists for: " + contentPath);
                });

        ContentNode node = nodeRepository.findByPath(contentPath)
                .orElseThrow(() -> new IllegalArgumentException("Content not found: " + contentPath));

        // Find the start step from the definition JSON
        String startStepId = findStartStep(definition);

        WorkflowInstance instance = new WorkflowInstance();
        instance.setWorkflowName(workflowName);
        instance.setContentPath(contentPath);
        instance.setContentNodeId(node.getId());
        instance.setCurrentStepId(startStepId);
        instance.setStatus(WorkflowStatus.ACTIVE);
        instance.setStartedBy(userId);
        instance.setLastActionBy(userId);
        instance.setLastAction("start");
        instance.setLastActionAt(Instant.now());

        // Update content status
        node.setStatus(NodeStatus.DRAFT);
        nodeRepository.save(node);

        instance = instanceRepo.save(instance);
        log.info("Started workflow '{}' for {} by {}", workflowName, contentPath, userId);
        return instance;
    }

    /**
     * Advance a workflow instance by performing an action (approve, reject, publish, etc.).
     */
    @Transactional
    public WorkflowInstance advance(UUID instanceId, String action, String userId, String comment) {
        WorkflowInstance instance = instanceRepo.findById(instanceId)
                .orElseThrow(() -> new IllegalArgumentException("Workflow instance not found: " + instanceId));

        if (instance.getStatus() != WorkflowStatus.ACTIVE) {
            throw new IllegalStateException("Workflow is not active: " + instance.getStatus());
        }

        WorkflowDefinition definition = workflowDefRepo.findByName(instance.getWorkflowName())
                .orElseThrow();

        // Find current step and matching transition
        Map<String, Object> currentStep = findStep(definition, instance.getCurrentStepId());
        Map<String, Object> transition = findTransition(currentStep, action);

        String targetStepId = (String) transition.get("target");
        Map<String, Object> targetStep = findStep(definition, targetStepId);

        // Update instance
        instance.setPreviousStepId(instance.getCurrentStepId());
        instance.setCurrentStepId(targetStepId);
        instance.setLastAction(action);
        instance.setLastActionBy(userId);
        instance.setLastActionAt(Instant.now());
        instance.setLastComment(comment);

        // Execute step actions (e.g., replicate on publish)
        executeStepActions(targetStep, instance);

        // Update content node status based on step
        updateContentStatus(instance, targetStepId);

        // Check if workflow is complete
        String stepType = (String) targetStep.getOrDefault("type", "");
        if ("end".equals(stepType)) {
            instance.setStatus(WorkflowStatus.COMPLETED);
            instance.setCompletedAt(Instant.now());
        }

        instance = instanceRepo.save(instance);
        log.info("Advanced workflow {} to step '{}' via action '{}' by {}",
                instanceId, targetStepId, action, userId);
        return instance;
    }

    /**
     * Cancel an active workflow.
     */
    @Transactional
    public WorkflowInstance cancel(UUID instanceId, String userId, String reason) {
        WorkflowInstance instance = instanceRepo.findById(instanceId)
                .orElseThrow(() -> new IllegalArgumentException("Workflow instance not found"));

        instance.setStatus(WorkflowStatus.CANCELLED);
        instance.setCompletedAt(Instant.now());
        instance.setLastAction("cancel");
        instance.setLastActionBy(userId);
        instance.setLastComment(reason);

        return instanceRepo.save(instance);
    }

    /**
     * Get the current workflow for a content path.
     */
    public Optional<WorkflowInstance> getActiveWorkflow(String contentPath) {
        return instanceRepo.findByContentPathAndStatus(contentPath, WorkflowStatus.ACTIVE);
    }

    /**
     * List workflow instances by status, paginated.
     */
    public Page<WorkflowInstance> listByStatus(WorkflowStatus status, Pageable pageable) {
        return instanceRepo.findByStatus(status, pageable);
    }

    /**
     * List workflow instances pending action by the given user.
     * In this implementation returns all ACTIVE instances (no per-user step filtering
     * is performed — all reviewers/publishers see the same inbox in local dev).
     */
    public Page<WorkflowInstance> listForUser(String userId, Pageable pageable) {
        return instanceRepo.findByStatus(WorkflowStatus.ACTIVE, pageable);
    }

    // --- Private helpers ---

    @SuppressWarnings("unchecked")
    private String findStartStep(WorkflowDefinition definition) {
        List<Map<String, Object>> steps = (List<Map<String, Object>>) definition.getDefinition().get("steps");
        if (steps == null || steps.isEmpty()) {
            throw new IllegalStateException("Workflow has no steps");
        }
        return steps.stream()
                .filter(s -> "start".equals(s.get("type")))
                .map(s -> (String) s.get("id"))
                .findFirst()
                .orElse((String) steps.get(0).get("id"));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> findStep(WorkflowDefinition definition, String stepId) {
        List<Map<String, Object>> steps = (List<Map<String, Object>>) definition.getDefinition().get("steps");
        return steps.stream()
                .filter(s -> stepId.equals(s.get("id")))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Step not found: " + stepId));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> findTransition(Map<String, Object> step, String action) {
        List<Map<String, Object>> transitions = (List<Map<String, Object>>) step.get("transitions");
        if (transitions == null) {
            throw new IllegalStateException("No transitions defined for step: " + step.get("id"));
        }
        return transitions.stream()
                .filter(t -> action.equals(t.get("action")))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Invalid action '" + action + "' for step '" + step.get("id") + "'"));
    }

    @SuppressWarnings("unchecked")
    private void executeStepActions(Map<String, Object> step, WorkflowInstance instance) {
        List<String> actions = (List<String>) step.get("actions");
        if (actions == null) return;

        for (String actionName : actions) {
            switch (actionName) {
                case "replicate-activate" -> {
                    if (replicationAgent != null) {
                        replicationAgent.replicate(
                                instance.getContentPath(),
                                ReplicationEvent.ReplicationAction.ACTIVATE,
                                instance.getLastActionBy());
                    }
                }
                case "replicate-deactivate" -> {
                    if (replicationAgent != null) {
                        replicationAgent.replicate(
                                instance.getContentPath(),
                                ReplicationEvent.ReplicationAction.DEACTIVATE,
                                instance.getLastActionBy());
                    }
                }
            }
        }
    }

    private void updateContentStatus(WorkflowInstance instance, String stepId) {
        nodeRepository.findByPath(instance.getContentPath()).ifPresent(node -> {
            switch (stepId) {
                case "review" -> node.setStatus(NodeStatus.IN_REVIEW);
                case "approved" -> node.setStatus(NodeStatus.APPROVED);
                case "published" -> node.setStatus(NodeStatus.PUBLISHED);
                case "draft" -> node.setStatus(NodeStatus.DRAFT);
                default -> {} // no change
            }
            nodeRepository.save(node);
        });
    }
}

