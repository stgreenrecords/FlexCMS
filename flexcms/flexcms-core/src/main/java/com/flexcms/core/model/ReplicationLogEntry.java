package com.flexcms.core.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "replication_log")
public class ReplicationLogEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ReplicationAction action;

    @Column(name = "content_path", nullable = false)
    private String contentPath;

    @Column(name = "node_id")
    private UUID nodeId;

    private Long version;

    @Column(name = "site_id")
    private String siteId;

    private String locale;

    @Column(name = "replication_type")
    @Enumerated(EnumType.STRING)
    private ReplicationType replicationType;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private ReplicationStatus status = ReplicationStatus.PENDING;

    @Column(name = "initiated_by")
    private String initiatedBy;

    @Column(name = "initiated_at")
    private Instant initiatedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "retry_count")
    private int retryCount = 0;

    public ReplicationLogEntry() {}

    public enum ReplicationAction { ACTIVATE, DEACTIVATE, DELETE }
    public enum ReplicationType { CONTENT, ASSET, TREE }
    public enum ReplicationStatus { PENDING, IN_PROGRESS, COMPLETED, FAILED }

    // Getters and setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getEventId() { return eventId; }
    public void setEventId(UUID eventId) { this.eventId = eventId; }

    public ReplicationAction getAction() { return action; }
    public void setAction(ReplicationAction action) { this.action = action; }

    public String getContentPath() { return contentPath; }
    public void setContentPath(String contentPath) { this.contentPath = contentPath; }

    public UUID getNodeId() { return nodeId; }
    public void setNodeId(UUID nodeId) { this.nodeId = nodeId; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }

    public String getSiteId() { return siteId; }
    public void setSiteId(String siteId) { this.siteId = siteId; }

    public String getLocale() { return locale; }
    public void setLocale(String locale) { this.locale = locale; }

    public ReplicationType getReplicationType() { return replicationType; }
    public void setReplicationType(ReplicationType replicationType) { this.replicationType = replicationType; }

    public ReplicationStatus getStatus() { return status; }
    public void setStatus(ReplicationStatus status) { this.status = status; }

    public String getInitiatedBy() { return initiatedBy; }
    public void setInitiatedBy(String initiatedBy) { this.initiatedBy = initiatedBy; }

    public Instant getInitiatedAt() { return initiatedAt; }
    public void setInitiatedAt(Instant initiatedAt) { this.initiatedAt = initiatedAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public int getRetryCount() { return retryCount; }
    public void setRetryCount(int retryCount) { this.retryCount = retryCount; }

    @PrePersist
    protected void onCreate() { initiatedAt = Instant.now(); }
}
