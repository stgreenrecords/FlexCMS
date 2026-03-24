package com.flexcms.author.service;

import com.flexcms.core.model.*;
import com.flexcms.core.model.WorkflowInstance.WorkflowStatus;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.core.repository.WorkflowDefinitionRepository;
import com.flexcms.core.repository.WorkflowInstanceRepository;
import com.flexcms.replication.model.ReplicationEvent.ReplicationAction;
import com.flexcms.replication.service.ReplicationAgent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkflowEngineTest {

    @Mock private WorkflowDefinitionRepository workflowDefRepo;
    @Mock private WorkflowInstanceRepository instanceRepo;
    @Mock private ContentNodeRepository nodeRepository;
    @Mock private ReplicationAgent replicationAgent;

    @InjectMocks
    private WorkflowEngine workflowEngine;

    // ── Fixture helpers ────────────────────────────────────────────────────────

    /**
     * Builds a minimal workflow definition:
     * start → review (action: "submit") → published (action: "approve", type: end)
     */
    private WorkflowDefinition simpleWorkflow() {
        Map<String, Object> submitTransition = new HashMap<>();
        submitTransition.put("action", "submit");
        submitTransition.put("target", "review");

        Map<String, Object> approveTransition = new HashMap<>();
        approveTransition.put("action", "approve");
        approveTransition.put("target", "published");

        Map<String, Object> startStep = new HashMap<>();
        startStep.put("id", "draft");
        startStep.put("type", "start");
        startStep.put("transitions", List.of(submitTransition));

        Map<String, Object> reviewStep = new HashMap<>();
        reviewStep.put("id", "review");
        reviewStep.put("transitions", List.of(approveTransition));

        Map<String, Object> publishedStep = new HashMap<>();
        publishedStep.put("id", "published");
        publishedStep.put("type", "end");
        publishedStep.put("transitions", List.of());

        WorkflowDefinition def = new WorkflowDefinition();
        def.setName("simple-review");
        def.setDefinition(Map.of("steps", List.of(startStep, reviewStep, publishedStep)));
        return def;
    }

    /**
     * Workflow whose published step fires the replicate-activate action.
     */
    private WorkflowDefinition replicatingWorkflow() {
        Map<String, Object> publishTransition = new HashMap<>();
        publishTransition.put("action", "publish");
        publishTransition.put("target", "published");

        Map<String, Object> startStep = new HashMap<>();
        startStep.put("id", "draft");
        startStep.put("type", "start");
        startStep.put("transitions", List.of(publishTransition));

        Map<String, Object> publishedStep = new HashMap<>();
        publishedStep.put("id", "published");
        publishedStep.put("type", "end");
        publishedStep.put("transitions", List.of());
        publishedStep.put("actions", List.of("replicate-activate"));

        WorkflowDefinition def = new WorkflowDefinition();
        def.setName("publish-workflow");
        def.setDefinition(Map.of("steps", List.of(startStep, publishedStep)));
        return def;
    }

    private ContentNode node(String path) {
        ContentNode n = new ContentNode(path, "homepage", "flexcms/page");
        n.setId(UUID.randomUUID());
        n.setSiteId("corporate");
        return n;
    }

    private WorkflowInstance activeInstance(String path, String stepId) {
        WorkflowInstance i = new WorkflowInstance();
        i.setId(UUID.randomUUID());
        i.setContentPath(path);
        i.setWorkflowName("simple-review");
        i.setCurrentStepId(stepId);
        i.setStatus(WorkflowStatus.ACTIVE);
        return i;
    }

    // ── startWorkflow ──────────────────────────────────────────────────────────

    @Test
    void startWorkflow_workflowNotFound_throws() {
        when(workflowDefRepo.findByName("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> workflowEngine.startWorkflow("missing", "content.home", "user1"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Workflow not found: missing");
    }

    @Test
    void startWorkflow_activeAlreadyExists_throws() {
        WorkflowDefinition def = simpleWorkflow();
        ContentNode n = node("content.home");
        WorkflowInstance existing = activeInstance("content.home", "draft");

        when(workflowDefRepo.findByName("simple-review")).thenReturn(Optional.of(def));
        when(instanceRepo.findByContentPathAndStatus("content.home", WorkflowStatus.ACTIVE))
                .thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> workflowEngine.startWorkflow("simple-review", "content.home", "alice"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Active workflow already exists");
    }

    @Test
    void startWorkflow_contentNotFound_throws() {
        WorkflowDefinition def = simpleWorkflow();
        when(workflowDefRepo.findByName("simple-review")).thenReturn(Optional.of(def));
        when(instanceRepo.findByContentPathAndStatus("content.home", WorkflowStatus.ACTIVE))
                .thenReturn(Optional.empty());
        when(nodeRepository.findByPath("content.home")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> workflowEngine.startWorkflow("simple-review", "content.home", "alice"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Content not found");
    }

    @Test
    void startWorkflow_success_savesInstanceAtStartStep() {
        WorkflowDefinition def = simpleWorkflow();
        ContentNode n = node("content.home");
        when(workflowDefRepo.findByName("simple-review")).thenReturn(Optional.of(def));
        when(instanceRepo.findByContentPathAndStatus("content.home", WorkflowStatus.ACTIVE))
                .thenReturn(Optional.empty());
        when(nodeRepository.findByPath("content.home")).thenReturn(Optional.of(n));
        when(instanceRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        WorkflowInstance result = workflowEngine.startWorkflow("simple-review", "content.home", "alice");

        assertThat(result.getCurrentStepId()).isEqualTo("draft");
        assertThat(result.getStatus()).isEqualTo(WorkflowStatus.ACTIVE);
        assertThat(result.getStartedBy()).isEqualTo("alice");
        assertThat(result.getLastAction()).isEqualTo("start");
        verify(nodeRepository).save(n);
    }

    // ── advance ────────────────────────────────────────────────────────────────

    @Test
    void advance_instanceNotFound_throws() {
        UUID id = UUID.randomUUID();
        when(instanceRepo.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> workflowEngine.advance(id, "submit", "alice", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Workflow instance not found");
    }

    @Test
    void advance_notActiveInstance_throws() {
        UUID id = UUID.randomUUID();
        WorkflowInstance completed = activeInstance("content.home", "published");
        completed.setStatus(WorkflowStatus.COMPLETED);
        when(instanceRepo.findById(id)).thenReturn(Optional.of(completed));

        assertThatThrownBy(() -> workflowEngine.advance(id, "approve", "alice", null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Workflow is not active");
    }

    @Test
    void advance_invalidAction_throws() {
        UUID id = UUID.randomUUID();
        WorkflowInstance instance = activeInstance("content.home", "draft");
        WorkflowDefinition def = simpleWorkflow();
        when(instanceRepo.findById(id)).thenReturn(Optional.of(instance));
        when(workflowDefRepo.findByName("simple-review")).thenReturn(Optional.of(def));

        assertThatThrownBy(() -> workflowEngine.advance(id, "invalid-action", "alice", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid action");
    }

    @Test
    void advance_validAction_movesToNextStep() {
        UUID id = UUID.randomUUID();
        WorkflowInstance instance = activeInstance("content.home", "draft");
        ContentNode n = node("content.home");
        WorkflowDefinition def = simpleWorkflow();

        when(instanceRepo.findById(id)).thenReturn(Optional.of(instance));
        when(workflowDefRepo.findByName("simple-review")).thenReturn(Optional.of(def));
        when(nodeRepository.findByPath("content.home")).thenReturn(Optional.of(n));
        when(instanceRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        WorkflowInstance result = workflowEngine.advance(id, "submit", "reviewer", "please review");

        assertThat(result.getCurrentStepId()).isEqualTo("review");
        assertThat(result.getPreviousStepId()).isEqualTo("draft");
        assertThat(result.getLastAction()).isEqualTo("submit");
        assertThat(result.getLastActionBy()).isEqualTo("reviewer");
        assertThat(result.getLastComment()).isEqualTo("please review");
        assertThat(result.getStatus()).isEqualTo(WorkflowStatus.ACTIVE);  // review is not end
    }

    @Test
    void advance_toEndStep_completesWorkflow() {
        UUID id = UUID.randomUUID();
        WorkflowInstance instance = activeInstance("content.home", "review");
        ContentNode n = node("content.home");
        WorkflowDefinition def = simpleWorkflow();

        when(instanceRepo.findById(id)).thenReturn(Optional.of(instance));
        when(workflowDefRepo.findByName("simple-review")).thenReturn(Optional.of(def));
        when(nodeRepository.findByPath("content.home")).thenReturn(Optional.of(n));
        when(instanceRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        WorkflowInstance result = workflowEngine.advance(id, "approve", "publisher", null);

        assertThat(result.getCurrentStepId()).isEqualTo("published");
        assertThat(result.getStatus()).isEqualTo(WorkflowStatus.COMPLETED);
        assertThat(result.getCompletedAt()).isNotNull();
    }

    @Test
    void advance_publishedStep_updatesContentStatus() {
        UUID id = UUID.randomUUID();
        WorkflowInstance instance = activeInstance("content.home", "review");
        ContentNode n = node("content.home");
        WorkflowDefinition def = simpleWorkflow();

        when(instanceRepo.findById(id)).thenReturn(Optional.of(instance));
        when(workflowDefRepo.findByName("simple-review")).thenReturn(Optional.of(def));
        when(nodeRepository.findByPath("content.home")).thenReturn(Optional.of(n));
        when(instanceRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        workflowEngine.advance(id, "approve", "publisher", null);

        assertThat(n.getStatus()).isEqualTo(NodeStatus.PUBLISHED);
    }

    @Test
    void advance_stepWithReplicateAction_triggersReplication() {
        UUID id = UUID.randomUUID();
        WorkflowInstance instance = activeInstance("content.home", "draft");
        instance.setWorkflowName("publish-workflow");
        ContentNode n = node("content.home");
        WorkflowDefinition def = replicatingWorkflow();

        when(instanceRepo.findById(id)).thenReturn(Optional.of(instance));
        when(workflowDefRepo.findByName("publish-workflow")).thenReturn(Optional.of(def));
        when(nodeRepository.findByPath("content.home")).thenReturn(Optional.of(n));
        when(instanceRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        workflowEngine.advance(id, "publish", "publisher", null);

        verify(replicationAgent).replicate("content.home", ReplicationAction.ACTIVATE, "publisher");
    }

    // ── cancel ─────────────────────────────────────────────────────────────────

    @Test
    void cancel_instanceNotFound_throws() {
        UUID id = UUID.randomUUID();
        when(instanceRepo.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> workflowEngine.cancel(id, "alice", "no reason"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Workflow instance not found");
    }

    @Test
    void cancel_setsStatusCancelled() {
        UUID id = UUID.randomUUID();
        WorkflowInstance instance = activeInstance("content.home", "review");
        when(instanceRepo.findById(id)).thenReturn(Optional.of(instance));
        when(instanceRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        WorkflowInstance result = workflowEngine.cancel(id, "alice", "change of plans");

        assertThat(result.getStatus()).isEqualTo(WorkflowStatus.CANCELLED);
        assertThat(result.getLastAction()).isEqualTo("cancel");
        assertThat(result.getLastComment()).isEqualTo("change of plans");
        assertThat(result.getCompletedAt()).isNotNull();
    }

    // ── getActiveWorkflow ──────────────────────────────────────────────────────

    @Test
    void getActiveWorkflow_delegatesToRepository() {
        WorkflowInstance instance = activeInstance("content.home", "review");
        when(instanceRepo.findByContentPathAndStatus("content.home", WorkflowStatus.ACTIVE))
                .thenReturn(Optional.of(instance));

        Optional<WorkflowInstance> result = workflowEngine.getActiveWorkflow("content.home");

        assertThat(result).contains(instance);
    }

    @Test
    void getActiveWorkflow_noneFound_returnsEmpty() {
        when(instanceRepo.findByContentPathAndStatus("content.home", WorkflowStatus.ACTIVE))
                .thenReturn(Optional.empty());

        assertThat(workflowEngine.getActiveWorkflow("content.home")).isEmpty();
    }
}
