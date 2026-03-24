package com.flexcms.core.model;

import com.flexcms.core.converter.JsonbConverter;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "template_definitions")
public class TemplateDefinition {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String name;

    private String title;
    private String description;
    private String thumbnail;

    @Column(name = "resource_type")
    private String resourceType = "flexcms/page";

    @Column(name = "structure", columnDefinition = "jsonb", nullable = false)
    @Convert(converter = JsonbConverter.class)
    private Map<String, Object> structure;

    @Column(name = "initial_content", columnDefinition = "jsonb")
    @Convert(converter = JsonbConverter.class)
    private Map<String, Object> initialContent;

    @Column(name = "page_properties", columnDefinition = "jsonb")
    @Convert(converter = JsonbConverter.class)
    private Map<String, Object> pageProperties;

    @Column(name = "allowed_sites")
    private String allowedSitesRaw;

    private boolean active = true;

    @Column(name = "created_at")
    private Instant createdAt;

    public TemplateDefinition() {}

    // Getters and setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getThumbnail() { return thumbnail; }
    public void setThumbnail(String thumbnail) { this.thumbnail = thumbnail; }

    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }

    public Map<String, Object> getStructure() { return structure; }
    public void setStructure(Map<String, Object> structure) { this.structure = structure; }

    public Map<String, Object> getInitialContent() { return initialContent; }
    public void setInitialContent(Map<String, Object> initialContent) { this.initialContent = initialContent; }

    public Map<String, Object> getPageProperties() { return pageProperties; }
    public void setPageProperties(Map<String, Object> pageProperties) { this.pageProperties = pageProperties; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Instant getCreatedAt() { return createdAt; }

    @PrePersist
    protected void onCreate() { createdAt = Instant.now(); }
}
