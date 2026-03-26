package com.flexcms.core.model;

import com.flexcms.core.converter.JsonbConverter;
import jakarta.persistence.*;
import org.hibernate.annotations.ColumnTransformer;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "workflow_instances")
public class WorkflowInstance {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "workflow_name", nullable = false)
    private String workflowName;

    @Column(name = "content_path", nullable = false)
    private String contentPath;

    @Column(name = "content_node_id")
    private UUID contentNodeId;

    @Column(name = "current_step_id", nullable = false)
    private String currentStepId;

    @Column(name = "previous_step_id")
    private String previousStepId;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private WorkflowStatus status = WorkflowStatus.ACTIVE;

    @Column(name = "started_by")
    private String startedBy;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "last_action")
    private String lastAction;

    @Column(name = "last_action_by")
    private String lastActionBy;

    @Column(name = "last_action_at")
    private Instant lastActionAt;

    @Column(name = "last_comment")
    private String lastComment;

    @Column(name = "metadata", columnDefinition = "jsonb")
    @ColumnTransformer(write = "?::jsonb")
    @Convert(converter = JsonbConverter.class)
    private Map<String, Object> metadata;

    public WorkflowInstance() {}

    public enum WorkflowStatus { ACTIVE, COMPLETED, CANCELLED }

    // Getters and setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getWorkflowName() { return workflowName; }
    public void setWorkflowName(String workflowName) { this.workflowName = workflowName; }

    public String getContentPath() { return contentPath; }
    public void setContentPath(String contentPath) { this.contentPath = contentPath; }

    public UUID getContentNodeId() { return contentNodeId; }
    public void setContentNodeId(UUID contentNodeId) { this.contentNodeId = contentNodeId; }

    public String getCurrentStepId() { return currentStepId; }
    public void setCurrentStepId(String currentStepId) { this.currentStepId = currentStepId; }

    public String getPreviousStepId() { return previousStepId; }
    public void setPreviousStepId(String previousStepId) { this.previousStepId = previousStepId; }

    public WorkflowStatus getStatus() { return status; }
    public void setStatus(WorkflowStatus status) { this.status = status; }

    public String getStartedBy() { return startedBy; }
    public void setStartedBy(String startedBy) { this.startedBy = startedBy; }

    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public String getLastAction() { return lastAction; }
    public void setLastAction(String lastAction) { this.lastAction = lastAction; }

    public String getLastActionBy() { return lastActionBy; }
    public void setLastActionBy(String lastActionBy) { this.lastActionBy = lastActionBy; }

    public Instant getLastActionAt() { return lastActionAt; }
    public void setLastActionAt(Instant lastActionAt) { this.lastActionAt = lastActionAt; }

    public String getLastComment() { return lastComment; }
    public void setLastComment(String lastComment) { this.lastComment = lastComment; }

    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }

    @PrePersist
    protected void onCreate() { startedAt = Instant.now(); }
}
