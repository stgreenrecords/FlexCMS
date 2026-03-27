package com.flexcms.pim.component;

import com.flexcms.plugin.annotation.FlexCmsComponent;
import com.flexcms.plugin.annotation.ValueMapValue;
import com.flexcms.plugin.dam.DamClient;
import com.flexcms.plugin.pim.PimClient;
import com.flexcms.plugin.pim.PimProductData;
import com.flexcms.plugin.spi.AbstractComponentModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Map;

/**
 * ComponentModel for the {@code tut/product-teaser} component.
 *
 * <p>Renders a single product as a teaser card, hero, or compact tile.
 * The component node stores only the product SKU; all product data
 * (name, attributes, assets, variants) is resolved at render time via
 * {@link PimClient} so that content authors never have to duplicate
 * product information in the CMS.</p>
 *
 * <p>Authored properties (stored in JSONB):</p>
 * <ul>
 *   <li>{@code productSku} – required; identifies the product to display</li>
 *   <li>{@code displayMode} – optional; {@code "hero"} | {@code "compact"} | {@code "card"} (default: card)</li>
 *   <li>{@code showPrice} – optional boolean; controls price visibility</li>
 *   <li>{@code ctaLabel} – override for the call-to-action button label</li>
 *   <li>{@code ctaLink} – override for the call-to-action button URL</li>
 * </ul>
 */
@FlexCmsComponent(
        resourceType = "tut/product-teaser",
        title = "Product Teaser",
        group = "Commerce"
)
public class ProductTeaserModel extends AbstractComponentModel {

    private static final Logger log = LoggerFactory.getLogger(ProductTeaserModel.class);

    // ── Authored node properties ──────────────────────────────────────────────

    @ValueMapValue
    private String productSku;

    @ValueMapValue
    private String displayMode = "card";

    @ValueMapValue
    private boolean showPrice = true;

    @ValueMapValue
    private String ctaLabel;

    @ValueMapValue
    private String ctaLink;

    // ── PIM + DAM enriched data (resolved at render time) ────────────────────

    private PimProductData product;
    private List<Map<String, Object>> enrichedAssets;

    @Autowired
    private PimClient pimClient;

    @Autowired
    private DamClient damClient;

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    @Override
    protected void postInject() {
        if (productSku != null && !productSku.isBlank()) {
            product = pimClient.getProduct(productSku).orElse(null);
            if (product == null) {
                log.debug("ProductTeaserModel: product not found for SKU '{}' at path '{}'",
                        productSku, getResource() != null ? getResource().getPath() : "unknown");
                enrichedAssets = List.of();
            } else {
                // Enrich asset refs with actual DAM URLs, dimensions, and MIME types
                enrichedAssets = damClient.enrichProductAssets(product.getAssets());
            }
        } else {
            enrichedAssets = List.of();
        }
    }

    // ── Derived / computed getters (auto-exported by AbstractComponentModel) ──

    /**
     * Fully-resolved product data from PIM (may be null if SKU not found).
     */
    public PimProductData getProduct() {
        return product;
    }

    /**
     * Product asset refs enriched with DAM metadata (url, thumbnailUrl, width, height, mimeType).
     * In template order: hero first, then gallery, thumbnail, swatch, document.
     */
    public List<Map<String, Object>> getAssets() {
        return enrichedAssets;
    }

    /**
     * Hero image URL — first asset with role "hero", resolved via DAM.
     */
    public String getHeroImageUrl() {
        return enrichedAssets.stream()
                .filter(a -> "hero".equals(a.get("role")))
                .map(a -> (String) a.get("url"))
                .findFirst()
                .orElse(null);
    }

    /**
     * Thumbnail URL — first asset with role "thumbnail", or first asset if none.
     */
    public String getThumbnailUrl() {
        String url = enrichedAssets.stream()
                .filter(a -> "thumbnail".equals(a.get("role")))
                .map(a -> (String) a.get("url"))
                .findFirst()
                .orElse(null);
        if (url == null && !enrichedAssets.isEmpty()) {
            url = (String) enrichedAssets.get(0).get("url");
        }
        return url;
    }

    /**
     * Price from product attributes (key = "price"). Returns null if not set.
     */
    public Object getPrice() {
        if (product == null || product.getAttributes() == null) return null;
        return product.getAttributes().get("price");
    }

    /**
     * Whether the PIM product was resolved successfully.
     */
    public boolean isProductFound() {
        return product != null;
    }
}
