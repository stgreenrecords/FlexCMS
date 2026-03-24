package com.flexcms.pim.model;

import jakarta.persistence.*;

import java.util.UUID;

/**
 * Loose-coupling reference between a PIM product and a DAM asset.
 * References DAM assets by path (string), not by foreign key — the PIM
 * database has no knowledge of the DAM/CMS database schema.
 */
@Entity
@Table(name = "product_asset_refs",
       uniqueConstraints = @UniqueConstraint(columnNames = {"product_id", "asset_path", "role"}))
public class ProductAssetRef {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

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
