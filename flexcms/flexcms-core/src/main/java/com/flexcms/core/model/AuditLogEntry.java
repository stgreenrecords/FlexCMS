package com.flexcms.core.model;

import com.flexcms.core.converter.JsonbConverter;
import jakarta.persistence.*;
import org.hibernate.annotations.ColumnTransformer;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "audit_log")
public class AuditLogEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "entity_type", nullable = false)
    private String entityType;

    @Column(name = "entity_id")
    private UUID entityId;

    @Column(name = "entity_path")
    private String entityPath;

    @Column(nullable = false)
    private String action;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(columnDefinition = "jsonb")
    @ColumnTransformer(write = "?::jsonb")
    @Convert(converter = JsonbConverter.class)
    private Map<String, Object> changes;

    @Column(name = "timestamp")
    private Instant timestamp;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    public AuditLogEntry() {}

    public static AuditLogEntry create(String entityType, UUID entityId, String entityPath,
                                        String action, String userId) {
        AuditLogEntry entry = new AuditLogEntry();
        entry.entityType = entityType;
        entry.entityId = entityId;
        entry.entityPath = entityPath;
        entry.action = action;
        entry.userId = userId;
        entry.timestamp = Instant.now();
        return entry;
    }

    // Getters and setters
    public UUID getId() { return id; }
    public String getEntityType() { return entityType; }
    public UUID getEntityId() { return entityId; }
    public String getEntityPath() { return entityPath; }
    public String getAction() { return action; }
    public String getUserId() { return userId; }
    public Map<String, Object> getChanges() { return changes; }
    public void setChanges(Map<String, Object> changes) { this.changes = changes; }
    public Instant getTimestamp() { return timestamp; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
}
