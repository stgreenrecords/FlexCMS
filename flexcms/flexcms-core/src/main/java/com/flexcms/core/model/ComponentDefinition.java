package com.flexcms.core.model;

import com.flexcms.core.converter.JsonbConverter;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "component_definitions")
public class ComponentDefinition {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "resource_type", unique = true, nullable = false)
    private String resourceType;

    @Column(nullable = false)
    private String name;

    private String title;
    private String description;

    @Column(name = "group_name")
    private String groupName;

    private String icon;

    @Column(name = "is_container")
    private boolean container;

    @Column(name = "dialog", columnDefinition = "jsonb")
    @Convert(converter = JsonbConverter.class)
    private Map<String, Object> dialog;

    @Column(name = "policies", columnDefinition = "jsonb")
    @Convert(converter = JsonbConverter.class)
    private Map<String, Object> policies;

    /**
     * JSON Schema (draft-07) describing the shape of the component's output data.
     * This is the formal contract between backend and frontend — the backend guarantees
     * the adapted model will conform to this schema, and the frontend renders accordingly.
     */
    @Column(name = "data_schema", columnDefinition = "jsonb")
    @Convert(converter = JsonbConverter.class)
    private Map<String, Object> dataSchema;

    @Column(name = "client_lib")
    private String clientLib;

    private boolean active = true;

    @Column(name = "created_at")
    private Instant createdAt;

    public ComponentDefinition() {}

    public ComponentDefinition(String resourceType, String name, String title) {
        this.resourceType = resourceType;
        this.name = name;
        this.title = title;
    }

    // Getters and setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getGroupName() { return groupName; }
    public void setGroupName(String groupName) { this.groupName = groupName; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public boolean isContainer() { return container; }
    public void setContainer(boolean container) { this.container = container; }

    public Map<String, Object> getDialog() { return dialog; }
    public void setDialog(Map<String, Object> dialog) { this.dialog = dialog; }

    public Map<String, Object> getPolicies() { return policies; }
    public void setPolicies(Map<String, Object> policies) { this.policies = policies; }

    public Map<String, Object> getDataSchema() { return dataSchema; }
    public void setDataSchema(Map<String, Object> dataSchema) { this.dataSchema = dataSchema; }

    public String getClientLib() { return clientLib; }
    public void setClientLib(String clientLib) { this.clientLib = clientLib; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Instant getCreatedAt() { return createdAt; }

    @PrePersist
    protected void onCreate() { createdAt = Instant.now(); }
}
