package com.flexcms.pim.model;

import com.flexcms.pim.converter.PimJsonbConverter;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Product Schema — defines the shape of products (like a type system).
 *
 * <p>Schemas are versioned for year-over-year evolution. A v2027 schema can
 * inherit from v2026, adding/modifying attributes without breaking existing products.
 * Products are validated against their schema at write time.</p>
 */
@Entity
@Table(name = "product_schemas", uniqueConstraints = @UniqueConstraint(columnNames = {"name", "version"}))
public class ProductSchema {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String version;

    private String description;

    /** JSON Schema (draft-07) defining all product attributes */
    @Column(name = "schema_def", columnDefinition = "jsonb", nullable = false)
    @Convert(converter = PimJsonbConverter.class)
    private Map<String, Object> schemaDef;

    /** Grouped attribute layout for the admin UI */
    @Column(name = "attribute_groups", columnDefinition = "jsonb")
    @Convert(converter = PimJsonbConverter.class)
    private Map<String, Object> attributeGroups;

    /** Parent schema for inheritance (previous year's version) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private ProductSchema parent;

    private boolean active = true;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    // Getters & Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Map<String, Object> getSchemaDef() { return schemaDef; }
    public void setSchemaDef(Map<String, Object> schemaDef) { this.schemaDef = schemaDef; }
    public Map<String, Object> getAttributeGroups() { return attributeGroups; }
    public void setAttributeGroups(Map<String, Object> attributeGroups) { this.attributeGroups = attributeGroups; }
    public ProductSchema getParent() { return parent; }
    public void setParent(ProductSchema parent) { this.parent = parent; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    @PrePersist
    protected void onCreate() { createdAt = updatedAt = Instant.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = Instant.now(); }
}

