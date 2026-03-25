package com.flexcms.pim.event;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * RabbitMQ message published to the replication exchange when a PIM product
 * transitions to {@code PUBLISHED} status.
 *
 * <p>This message is consumed by the CMS author tier to trigger a page rebuild
 * for all content nodes that reference the published product (identified by SKU).
 * The convention is that CMS content nodes store the product reference in a
 * property named {@code productSku}.</p>
 *
 * <p>Routing key: {@code product.published} on exchange {@code flexcms.replication}.</p>
 */
public class ProductPublishedMessage implements Serializable {

    private String sku;
    private UUID catalogId;
    private String publishedBy;
    private Instant publishedAt;

    public ProductPublishedMessage() {}

    public ProductPublishedMessage(String sku, UUID catalogId, String publishedBy) {
        this.sku = sku;
        this.catalogId = catalogId;
        this.publishedBy = publishedBy;
        this.publishedAt = Instant.now();
    }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public UUID getCatalogId() { return catalogId; }
    public void setCatalogId(UUID catalogId) { this.catalogId = catalogId; }

    public String getPublishedBy() { return publishedBy; }
    public void setPublishedBy(String publishedBy) { this.publishedBy = publishedBy; }

    public Instant getPublishedAt() { return publishedAt; }
    public void setPublishedAt(Instant publishedAt) { this.publishedAt = publishedAt; }
}
