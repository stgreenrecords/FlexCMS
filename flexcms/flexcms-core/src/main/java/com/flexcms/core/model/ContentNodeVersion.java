package com.flexcms.core.model;

import com.flexcms.core.converter.JsonbConverter;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "content_node_versions")
public class ContentNodeVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "node_id", nullable = false)
    private UUID nodeId;

    @Column(name = "version_number", nullable = false)
    private Long versionNumber;

    @Column(name = "properties", columnDefinition = "jsonb")
    @Convert(converter = JsonbConverter.class)
    private Map<String, Object> properties;

    @Column(name = "resource_type")
    private String resourceType;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private NodeStatus status;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "version_label")
    private String versionLabel;

    @Column(name = "change_summary")
    private String changeSummary;

    public ContentNodeVersion() {}

    public static ContentNodeVersion fromNode(ContentNode node) {
        ContentNodeVersion v = new ContentNodeVersion();
        v.setNodeId(node.getId());
        v.setVersionNumber(node.getVersion());
        v.setProperties(Map.copyOf(node.getProperties()));
        v.setResourceType(node.getResourceType());
        v.setStatus(node.getStatus());
        v.setCreatedBy(node.getModifiedBy());
        v.setCreatedAt(Instant.now());
        return v;
    }

    // Getters and setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getNodeId() { return nodeId; }
    public void setNodeId(UUID nodeId) { this.nodeId = nodeId; }

    public Long getVersionNumber() { return versionNumber; }
    public void setVersionNumber(Long versionNumber) { this.versionNumber = versionNumber; }

    public Map<String, Object> getProperties() { return properties; }
    public void setProperties(Map<String, Object> properties) { this.properties = properties; }

    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }

    public NodeStatus getStatus() { return status; }
    public void setStatus(NodeStatus status) { this.status = status; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public String getVersionLabel() { return versionLabel; }
    public void setVersionLabel(String versionLabel) { this.versionLabel = versionLabel; }

    public String getChangeSummary() { return changeSummary; }
    public void setChangeSummary(String changeSummary) { this.changeSummary = changeSummary; }
}
