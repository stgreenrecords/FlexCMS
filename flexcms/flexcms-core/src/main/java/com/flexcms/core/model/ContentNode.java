package com.flexcms.core.model;

import com.flexcms.plugin.spi.ContentNodeData;
import jakarta.persistence.*;
import org.hibernate.annotations.ColumnTransformer;

import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "content_nodes")
public class ContentNode implements ContentNodeData {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "path", unique = true, nullable = false)
    private String path;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "resource_type", nullable = false)
    private String resourceType;

    @Column(name = "parent_path")
    private String parentPath;

    @Column(name = "order_index")
    private Integer orderIndex = 0;

    @Column(name = "properties", columnDefinition = "jsonb")
    @ColumnTransformer(write = "?::jsonb")
    @Convert(converter = com.flexcms.core.converter.JsonbConverter.class)
    private Map<String, Object> properties = new HashMap<>();

    @Column(name = "version")
    private Long version = 1L;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private NodeStatus status = NodeStatus.DRAFT;

    @Column(name = "locked_by")
    private String lockedBy;

    @Column(name = "locked_at")
    private Instant lockedAt;

    @Column(name = "site_id")
    private String siteId;

    @Column(name = "locale")
    private String locale;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "modified_by")
    private String modifiedBy;

    @Column(name = "modified_at")
    private Instant modifiedAt;

    @Column(name = "scheduled_publish_at")
    private Instant scheduledPublishAt;

    @Column(name = "scheduled_deactivate_at")
    private Instant scheduledDeactivateAt;

    @Transient
    private List<ContentNodeData> children = new ArrayList<>();

    public ContentNode() {}

    public ContentNode(String path, String name, String resourceType) {
        this.path = path;
        this.name = name;
        this.resourceType = resourceType;
    }

    // --- ContentNodeData interface ---

    @Override
    public String getPath() { return path; }

    @Override
    public String getName() { return name; }

    @Override
    public String getResourceType() { return resourceType; }

    @Override
    public String getSiteId() { return siteId; }

    @Override
    public String getLocale() { return locale; }

    @Override
    public Long getVersion() { return version; }

    @Override
    public Map<String, Object> getProperties() { return properties; }

    @Override
    @SuppressWarnings("unchecked")
    public <T> T getProperty(String name, Class<T> type) {
        Object value = properties.get(name);
        if (value == null) return null;
        if (type.isInstance(value)) return (T) value;
        // String conversion fallback
        if (type == String.class) return (T) String.valueOf(value);
        return null;
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> T getProperty(String name, T defaultValue) {
        Object value = properties.get(name);
        if (value == null) return defaultValue;
        try {
            return (T) value;
        } catch (ClassCastException e) {
            return defaultValue;
        }
    }

    @Override
    public List<ContentNodeData> getChildren() { return children; }

    // --- Setters ---

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public void setPath(String path) { this.path = path; }
    public void setName(String name) { this.name = name; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }

    public String getParentPath() { return parentPath; }
    public void setParentPath(String parentPath) { this.parentPath = parentPath; }

    public Integer getOrderIndex() { return orderIndex; }
    public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }

    public void setProperties(Map<String, Object> properties) { this.properties = properties; }
    public void setProperty(String key, Object value) { this.properties.put(key, value); }

    public void setVersion(Long version) { this.version = version; }

    public NodeStatus getStatus() { return status; }
    public void setStatus(NodeStatus status) { this.status = status; }

    public String getLockedBy() { return lockedBy; }
    public void setLockedBy(String lockedBy) { this.lockedBy = lockedBy; }

    public Instant getLockedAt() { return lockedAt; }
    public void setLockedAt(Instant lockedAt) { this.lockedAt = lockedAt; }

    public void setSiteId(String siteId) { this.siteId = siteId; }
    public void setLocale(String locale) { this.locale = locale; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public String getModifiedBy() { return modifiedBy; }
    public void setModifiedBy(String modifiedBy) { this.modifiedBy = modifiedBy; }

    public Instant getModifiedAt() { return modifiedAt; }
    public void setModifiedAt(Instant modifiedAt) { this.modifiedAt = modifiedAt; }

    public Instant getScheduledPublishAt() { return scheduledPublishAt; }
    public void setScheduledPublishAt(Instant scheduledPublishAt) { this.scheduledPublishAt = scheduledPublishAt; }

    public Instant getScheduledDeactivateAt() { return scheduledDeactivateAt; }
    public void setScheduledDeactivateAt(Instant scheduledDeactivateAt) { this.scheduledDeactivateAt = scheduledDeactivateAt; }

    public void setChildren(List<ContentNodeData> children) { this.children = children; }

    /**
     * Create a deep copy of this node (for language copies, etc.)
     */
    public ContentNode deepCopy() {
        ContentNode copy = new ContentNode();
        copy.setName(this.name);
        copy.setResourceType(this.resourceType);
        copy.setOrderIndex(this.orderIndex);
        copy.setProperties(new HashMap<>(this.properties));
        copy.setVersion(1L);
        copy.setStatus(NodeStatus.DRAFT);
        copy.setSiteId(this.siteId);
        return copy;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        modifiedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        modifiedAt = Instant.now();
        version++;
    }
}
