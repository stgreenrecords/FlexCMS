package com.flexcms.pim.model;

import com.flexcms.pim.converter.PimJsonbConverter;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Named, reusable configuration for mapping source fields to PIM schema attributes.
 *
 * <p>Profiles are scoped to a catalog and a source type. Teams can create a "CSV
 * 2026 Spring Import" profile once and reuse it for every seasonal import, only
 * updating mappings when the source format changes.</p>
 */
@Entity
@Table(name = "field_mapping_profiles")
public class FieldMappingProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "source_type", nullable = false)
    private String sourceType;

    @Column(name = "catalog_id", nullable = false)
    private UUID catalogId;

    @Column(name = "sku_field", nullable = false)
    private String skuField = "sku";

    @Column(name = "name_field", nullable = false)
    private String nameField = "name";

    /** Maps source field names → schema attribute names */
    @Column(name = "field_mappings", columnDefinition = "jsonb", nullable = false)
    @Convert(converter = PimJsonbConverter.class)
    private Map<String, Object> fieldMappings = new HashMap<>();

    /** Default values applied when a source field is absent */
    @Column(name = "defaults", columnDefinition = "jsonb", nullable = false)
    @Convert(converter = PimJsonbConverter.class)
    private Map<String, Object> defaults = new HashMap<>();

    /**
     * Transform expressions applied after field mapping.
     * Supported transforms: {@code trim}, {@code uppercase}, {@code lowercase},
     * {@code prefix:<value>}, {@code suffix:<value>}.
     */
    @Column(name = "transforms", columnDefinition = "jsonb", nullable = false)
    @Convert(converter = PimJsonbConverter.class)
    private Map<String, Object> transforms = new HashMap<>();

    @Column(name = "update_existing", nullable = false)
    private boolean updateExisting = true;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() { createdAt = updatedAt = Instant.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = Instant.now(); }

    // Getters & setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }
    public UUID getCatalogId() { return catalogId; }
    public void setCatalogId(UUID catalogId) { this.catalogId = catalogId; }
    public String getSkuField() { return skuField; }
    public void setSkuField(String skuField) { this.skuField = skuField; }
    public String getNameField() { return nameField; }
    public void setNameField(String nameField) { this.nameField = nameField; }
    public Map<String, Object> getFieldMappings() { return fieldMappings; }
    public void setFieldMappings(Map<String, Object> fieldMappings) { this.fieldMappings = fieldMappings; }
    public Map<String, Object> getDefaults() { return defaults; }
    public void setDefaults(Map<String, Object> defaults) { this.defaults = defaults; }
    public Map<String, Object> getTransforms() { return transforms; }
    public void setTransforms(Map<String, Object> transforms) { this.transforms = transforms; }
    public boolean isUpdateExisting() { return updateExisting; }
    public void setUpdateExisting(boolean updateExisting) { this.updateExisting = updateExisting; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
