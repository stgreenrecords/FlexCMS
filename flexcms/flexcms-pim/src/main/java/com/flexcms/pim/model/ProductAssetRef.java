package com.flexcms.pim.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.util.UUID;

/**
 * Loose-coupling reference between a PIM product and a DAM asset.
 * References DAM assets by path (string), not by foreign key — the PIM
 * database has no knowledge of the DAM/CMS database schema.
 */
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "product_asset_refs",
       uniqueConstraints = @UniqueConstraint(columnNames = {"product_id", "asset_path", "role"}))
public class ProductAssetRef {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Not serialized. These endpoints return the child directly, and the parent is
     * already identified by the request path — while walking back up drags a lazily
     * loaded Product and its Catalog into the response, which fails outside the
     * session with "Could not write JSON: Could not initialize proxy" and made every
     * variant and asset-reference call answer HTTP 500. Product already ignores the
     * inverse side for the same reason.
     */
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    /** DAM asset path (e.g., "/dam/products/shoe-x1/hero.jpg") */
    @Column(name = "asset_path", nullable = false, length = 2048)
    private String assetPath;

    /** Role of this asset: hero, gallery, thumbnail, swatch, document, etc. */
    @Column(nullable = false, length = 64)
    private String role = "gallery";

    @Column(name = "order_index")
    private int orderIndex = 0;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    public String getAssetPath() { return assetPath; }
    public void setAssetPath(String assetPath) { this.assetPath = assetPath; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }
}
