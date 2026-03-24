package com.flexcms.replication.model;

import java.io.Serializable;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Event published to the replication queue when content is activated/deactivated.
 */
public class ReplicationEvent implements Serializable {

    private UUID eventId;
    private ReplicationAction action;
    private String path;
    private UUID nodeId;
    private Long version;
    private String siteId;
    private String locale;
    private Instant timestamp;
    private String initiatedBy;
    private ReplicationType type;
    private List<String> affectedPaths;
    private String assetPath;
    private List<String> renditionKeys;

    // Embedded node data for ACTIVATE events
    private Map<String, Object> nodeProperties;
    private String resourceType;
    private String parentPath;
    private Integer orderIndex;

    public ReplicationEvent() {}

    public static ReplicationEvent contentActivate(String path, UUID nodeId, Long version,
                                                     String siteId, String locale, String userId) {
        ReplicationEvent event = new ReplicationEvent();
        event.eventId = UUID.randomUUID();
        event.action = ReplicationAction.ACTIVATE;
        event.path = path;
        event.nodeId = nodeId;
        event.version = version;
        event.siteId = siteId;
        event.locale = locale;
        event.timestamp = Instant.now();
        event.initiatedBy = userId;
        event.type = ReplicationType.CONTENT;
        return event;
    }

    public static ReplicationEvent contentDeactivate(String path, String siteId, String userId) {
        ReplicationEvent event = new ReplicationEvent();
        event.eventId = UUID.randomUUID();
        event.action = ReplicationAction.DEACTIVATE;
        event.path = path;
        event.siteId = siteId;
        event.timestamp = Instant.now();
        event.initiatedBy = userId;
        event.type = ReplicationType.CONTENT;
        return event;
    }

    public static ReplicationEvent treeActivate(String rootPath, List<String> affectedPaths,
                                                  String siteId, String userId) {
        ReplicationEvent event = new ReplicationEvent();
        event.eventId = UUID.randomUUID();
        event.action = ReplicationAction.ACTIVATE;
        event.path = rootPath;
        event.siteId = siteId;
        event.timestamp = Instant.now();
        event.initiatedBy = userId;
        event.type = ReplicationType.TREE;
        event.affectedPaths = affectedPaths;
        return event;
    }

    public static ReplicationEvent assetActivate(String assetPath, List<String> renditionKeys, String userId) {
        ReplicationEvent event = new ReplicationEvent();
        event.eventId = UUID.randomUUID();
        event.action = ReplicationAction.ACTIVATE;
        event.path = assetPath;
        event.assetPath = assetPath;
        event.renditionKeys = renditionKeys;
        event.timestamp = Instant.now();
        event.initiatedBy = userId;
        event.type = ReplicationType.ASSET;
        return event;
    }

    public enum ReplicationAction { ACTIVATE, DEACTIVATE, DELETE }
    public enum ReplicationType { CONTENT, ASSET, TREE }

    // Getters and setters
    public UUID getEventId() { return eventId; }
    public void setEventId(UUID eventId) { this.eventId = eventId; }
    public ReplicationAction getAction() { return action; }
    public void setAction(ReplicationAction action) { this.action = action; }
    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
    public UUID getNodeId() { return nodeId; }
    public void setNodeId(UUID nodeId) { this.nodeId = nodeId; }
    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
    public String getSiteId() { return siteId; }
    public void setSiteId(String siteId) { this.siteId = siteId; }
    public String getLocale() { return locale; }
    public void setLocale(String locale) { this.locale = locale; }
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
    public String getInitiatedBy() { return initiatedBy; }
    public void setInitiatedBy(String initiatedBy) { this.initiatedBy = initiatedBy; }
    public ReplicationType getType() { return type; }
    public void setType(ReplicationType type) { this.type = type; }
    public List<String> getAffectedPaths() { return affectedPaths; }
    public void setAffectedPaths(List<String> affectedPaths) { this.affectedPaths = affectedPaths; }
    public String getAssetPath() { return assetPath; }
    public void setAssetPath(String assetPath) { this.assetPath = assetPath; }
    public List<String> getRenditionKeys() { return renditionKeys; }
    public void setRenditionKeys(List<String> renditionKeys) { this.renditionKeys = renditionKeys; }
    public Map<String, Object> getNodeProperties() { return nodeProperties; }
    public void setNodeProperties(Map<String, Object> nodeProperties) { this.nodeProperties = nodeProperties; }
    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }
    public String getParentPath() { return parentPath; }
    public void setParentPath(String parentPath) { this.parentPath = parentPath; }
    public Integer getOrderIndex() { return orderIndex; }
    public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }
}

