package com.flexcms.pim.model;

import com.flexcms.pim.converter.PimJsonbConverter;
import jakarta.persistence.*;
import org.hibernate.annotations.ColumnTransformer;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Immutable snapshot of a {@link Product} at a specific version.
 *
 * <p>A new snapshot is created every time a product is saved — whether
 * on create, attribute update, or status change. This table functions as
 * an append-only audit log; rows are never updated or deleted.</p>
 */
@Entity
@Table(name = "product_versions")
public class ProductVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "version_number", nullable = false)
    private Long versionNumber;

    @Column(name = "sku", nullable = false)
    private String sku;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "attributes", columnDefinition = "jsonb", nullable = false)
    @ColumnTransformer(write = "?::jsonb")
    @Convert(converter = PimJsonbConverter.class)
    private Map<String, Object> attributes;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private ProductStatus status;

    @Column(name = "updated_by")
    private String updatedBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "change_summary")
    private String changeSummary;

    public ProductVersion() {}

    /**
     * Snapshot factory — captures the current state of a product.
     */
    public static ProductVersion fromProduct(Product product) {
        ProductVersion v = new ProductVersion();
        v.setProductId(product.getId());
        v.setVersionNumber(product.getVersion());
        v.setSku(product.getSku());
        v.setName(product.getName());
        v.setAttributes(Map.copyOf(product.getAttributes()));
        v.setStatus(product.getStatus());
        v.setUpdatedBy(product.getUpdatedBy() != null ? product.getUpdatedBy() : product.getCreatedBy());
        v.setCreatedAt(Instant.now());
        return v;
    }

    // Getters & setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getProductId() { return productId; }
    public void setProductId(UUID productId) { this.productId = productId; }

    public Long getVersionNumber() { return versionNumber; }
    public void setVersionNumber(Long versionNumber) { this.versionNumber = versionNumber; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Map<String, Object> getAttributes() { return attributes; }
    public void setAttributes(Map<String, Object> attributes) { this.attributes = attributes; }

    public ProductStatus getStatus() { return status; }
    public void setStatus(ProductStatus status) { this.status = status; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public String getChangeSummary() { return changeSummary; }
    public void setChangeSummary(String changeSummary) { this.changeSummary = changeSummary; }
}
