package com.flexcms.pim.component;

import com.flexcms.plugin.annotation.FlexCmsComponent;
import com.flexcms.plugin.annotation.ValueMapValue;
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

    // ── PIM-enriched data (resolved at render time) ───────────────────────────

    private PimProductData product;

    @Autowired
    private PimClient pimClient;

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    @Override
    protected void postInject() {
        if (productSku != null && !productSku.isBlank()) {
            product = pimClient.getProduct(productSku).orElse(null);
            if (product == null) {
                log.debug("ProductTeaserModel: product not found for SKU '{}' at path '{}'",
                        productSku, getResource() != null ? getResource().getPath() : "unknown");
            }
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
     * Hero image URL derived from the product's DAM assets (role = "hero").
     * Returns null if no hero asset is linked.
     */
    public String getHeroImagePath() {
        if (product == null || product.getAssets() == null) return null;
        return product.getAssets().stream()
                .filter(a -> "hero".equals(a.get("role")))
                .map(a -> (String) a.get("path"))
                .findFirst()
                .orElse(null);
    }

    /**
     * Thumbnail image URL (role = "thumbnail" or first available asset).
     */
    public String getThumbnailPath() {
        if (product == null || product.getAssets() == null) return null;
        List<Map<String, Object>> assets = product.getAssets();
        String thumbnail = assets.stream()
                .filter(a -> "thumbnail".equals(a.get("role")))
                .map(a -> (String) a.get("path"))
                .findFirst()
                .orElse(null);
        if (thumbnail == null && !assets.isEmpty()) {
            thumbnail = (String) assets.get(0).get("path");
        }
        return thumbnail;
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
