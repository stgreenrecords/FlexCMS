package com.flexcms.pim.model;

import com.flexcms.pim.converter.PimJsonbConverter;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "product_variants")
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "variant_sku", unique = true, nullable = false)
    private String variantSku;

    @Column(columnDefinition = "jsonb", nullable = false)
    @Convert(converter = PimJsonbConverter.class)
    private Map<String, Object> attributes = new HashMap<>();

    @Column(columnDefinition = "jsonb")
    @Convert(converter = PimJsonbConverter.class)
    private Map<String, Object> pricing = new HashMap<>();

    @Column(columnDefinition = "jsonb")
    @Convert(converter = PimJsonbConverter.class)
    private Map<String, Object> inventory = new HashMap<>();

    @Column(nullable = false)
    private String status = "ACTIVE";

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    public String getVariantSku() { return variantSku; }
    public void setVariantSku(String variantSku) { this.variantSku = variantSku; }
    public Map<String, Object> getAttributes() { return attributes; }
    public void setAttributes(Map<String, Object> attributes) { this.attributes = attributes; }
    public Map<String, Object> getPricing() { return pricing; }
    public void setPricing(Map<String, Object> pricing) { this.pricing = pricing; }
    public Map<String, Object> getInventory() { return inventory; }
    public void setInventory(Map<String, Object> inventory) { this.inventory = inventory; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    @PrePersist
    protected void onCreate() { createdAt = updatedAt = Instant.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = Instant.now(); }
}

