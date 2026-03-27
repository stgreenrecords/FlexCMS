package com.flexcms.pim.component;

import com.flexcms.plugin.annotation.FlexCmsComponent;
import com.flexcms.plugin.annotation.ValueMapValue;
import com.flexcms.plugin.pim.PimClient;
import com.flexcms.plugin.pim.PimProductData;
import com.flexcms.plugin.spi.AbstractComponentModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * ComponentModel for the {@code tut/product-specs} component.
 *
 * <p>Renders a specification table for a single product. Authors pick which
 * attribute keys to highlight; all attribute values are pulled from PIM at
 * render time so that they always reflect the latest product data without
 * requiring a CMS republish when prices or specs change in PIM.</p>
 *
 * <p>Authored properties (stored in JSONB):</p>
 * <ul>
 *   <li>{@code productSku} – required; identifies the product whose specs to show</li>
 *   <li>{@code highlightedSpecs} – optional JSON array of attribute key names to
 *       surface first; remaining attributes follow in natural order</li>
 * </ul>
 */
@FlexCmsComponent(
        resourceType = "tut/product-specs",
        title = "Product Specifications",
        group = "Commerce"
)
public class ProductSpecsModel extends AbstractComponentModel {

    private static final Logger log = LoggerFactory.getLogger(ProductSpecsModel.class);

    // ── Authored node properties ──────────────────────────────────────────────

    @ValueMapValue
    private String productSku;

    @ValueMapValue
    private List<String> highlightedSpecs;

    // ── PIM-enriched data ─────────────────────────────────────────────────────

    private PimProductData product;

    /** Ordered spec rows: highlighted first, then remaining attributes. */
    private List<Map<String, Object>> specs;

    @Autowired
    private PimClient pimClient;

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    @Override
    protected void postInject() {
        if (productSku != null && !productSku.isBlank()) {
            product = pimClient.getProduct(productSku).orElse(null);
            if (product != null) {
                specs = buildSpecs(product, highlightedSpecs);
            } else {
                log.debug("ProductSpecsModel: product not found for SKU '{}' at path '{}'",
                        productSku, getResource() != null ? getResource().getPath() : "unknown");
                specs = List.of();
            }
        } else {
            specs = List.of();
        }
    }

    // ── Derived getters ───────────────────────────────────────────────────────

    /** Fully-resolved product data from PIM. */
    public PimProductData getProduct() {
        return product;
    }

    /**
     * Ordered specification rows for template rendering.
     * Each entry is {@code { "key": "...", "label": "...", "value": ... }}.
     */
    public List<Map<String, Object>> getSpecs() {
        return specs;
    }

    public boolean isProductFound() {
        return product != null;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private static List<Map<String, Object>> buildSpecs(PimProductData product, List<String> highlighted) {
        Map<String, Object> attributes = product.getAttributes();
        if (attributes == null || attributes.isEmpty()) {
            return List.of();
        }

        List<Map<String, Object>> result = new ArrayList<>();

        // Add highlighted specs first (in the order specified by the author)
        if (highlighted != null) {
            for (String key : highlighted) {
                if (attributes.containsKey(key)) {
                    result.add(specRow(key, attributes.get(key)));
                }
            }
        }

        // Append remaining attributes that weren't already highlighted
        for (Map.Entry<String, Object> entry : attributes.entrySet()) {
            if (highlighted == null || !highlighted.contains(entry.getKey())) {
                result.add(specRow(entry.getKey(), entry.getValue()));
            }
        }

        return result;
    }

    private static Map<String, Object> specRow(String key, Object value) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("key", key);
        row.put("label", toLabel(key));
        row.put("value", value);
        return row;
    }

    /** Converts camelCase or snake_case attribute key to a readable label. */
    private static String toLabel(String key) {
        // camelCase → insert spaces before uppercase letters
        String spaced = key.replaceAll("([A-Z])", " $1")
                           .replaceAll("_", " ")
                           .trim();
        if (spaced.isEmpty()) return key;
        return Character.toUpperCase(spaced.charAt(0)) + spaced.substring(1);
    }
}
