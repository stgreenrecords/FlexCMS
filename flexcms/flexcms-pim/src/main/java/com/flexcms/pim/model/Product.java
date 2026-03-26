package com.flexcms.pim.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.flexcms.pim.converter.PimJsonbConverter;
import jakarta.persistence.*;
import org.hibernate.annotations.ColumnTransformer;

import java.time.Instant;
import java.util.*;

/**
 * Product — the core PIM entity.
 *
 * <p>Products are identified by a globally unique SKU. Attributes are stored
 * as JSONB conforming to the associated ProductSchema. Products support
 * year-over-year carryforward: a 2027 product can reference a 2026 source,
 * inheriting all unchanged attributes.</p>
 */
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String sku;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "catalog_id", nullable = false)
    private Catalog catalog;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schema_id", nullable = false)
    private ProductSchema schema;

    /** Product attributes conforming to the schema */
    @Column(columnDefinition = "jsonb", nullable = false)
    @ColumnTransformer(write = "?::jsonb")
    @Convert(converter = PimJsonbConverter.class)
    private Map<String, Object> attributes = new HashMap<>();

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ProductStatus status = ProductStatus.DRAFT;

    /** Source product for year-over-year carryforward */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_product_id")
    private Product sourceProduct;

    /** Fields manually overridden (vs. inherited from source) */
    @Column(name = "overridden_fields", columnDefinition = "text[]")
    private String[] overriddenFields = {};

    private Long version = 1L;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_by")
    private String updatedBy;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @JsonIgnore
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductVariant> variants = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private List<ProductAssetRef> assetRefs = new ArrayList<>();

    /**
     * Get fully resolved attributes — merges source product attributes
     * with locally overridden fields.
     */
    public Map<String, Object> getResolvedAttributes() {
        if (sourceProduct == null) return attributes;

        Map<String, Object> resolved = new HashMap<>(sourceProduct.getResolvedAttributes());
        // Apply local overrides
        if (overriddenFields != null) {
            for (String field : overriddenFields) {
                if (attributes.containsKey(field)) {
                    resolved.put(field, attributes.get(field));
                }
            }
        }
        return resolved;
    }

    // Getters & Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Catalog getCatalog() { return catalog; }
    public void setCatalog(Catalog catalog) { this.catalog = catalog; }
    public ProductSchema getSchema() { return schema; }
    public void setSchema(ProductSchema schema) { this.schema = schema; }
    public Map<String, Object> getAttributes() { return attributes; }
    public void setAttributes(Map<String, Object> attributes) { this.attributes = attributes; }
    public ProductStatus getStatus() { return status; }
    public void setStatus(ProductStatus status) { this.status = status; }
    public Product getSourceProduct() { return sourceProduct; }
    public void setSourceProduct(Product sourceProduct) { this.sourceProduct = sourceProduct; }
    public String[] getOverriddenFields() { return overriddenFields; }
    public void setOverriddenFields(String[] overriddenFields) { this.overriddenFields = overriddenFields; }
    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public List<ProductVariant> getVariants() { return variants; }
    public void setVariants(List<ProductVariant> variants) { this.variants = variants; }
    public List<ProductAssetRef> getAssetRefs() { return assetRefs; }
    public void setAssetRefs(List<ProductAssetRef> assetRefs) { this.assetRefs = assetRefs; }

    @PrePersist
    protected void onCreate() { createdAt = updatedAt = Instant.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = Instant.now(); version++; }
}

