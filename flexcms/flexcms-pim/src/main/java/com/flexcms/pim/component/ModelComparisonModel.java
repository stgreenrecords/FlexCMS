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
 * ComponentModel for the {@code tut/model-comparison} component.
 *
 * <p>Renders a side-by-side specification comparison table for two or more
 * products. Authors choose which SKUs to compare and which attribute keys to
 * surface; all product data is fetched from PIM in a single bulk call.</p>
 *
 * <p>Authored properties (stored in JSONB):</p>
 * <ul>
 *   <li>{@code productSkus} – required; JSON array of SKUs to compare (2–4 products)</li>
 *   <li>{@code compareAttributes} – optional JSON array of attribute key names to
 *       show in the comparison grid; defaults to all common attributes</li>
 * </ul>
 */
@FlexCmsComponent(
        resourceType = "tut/model-comparison",
        title = "Model Comparison",
        group = "Commerce"
)
public class ModelComparisonModel extends AbstractComponentModel {

    private static final Logger log = LoggerFactory.getLogger(ModelComparisonModel.class);

    // ── Authored node properties ──────────────────────────────────────────────

    @ValueMapValue
    private List<String> productSkus;

    @ValueMapValue
    private List<String> compareAttributes;

    // ── PIM-enriched data ─────────────────────────────────────────────────────

    private List<PimProductData> products;

    /**
     * Comparison grid rows:
     * {@code [ { "attribute": "...", "label": "...", "values": [ val1, val2, ... ] } ]}
     */
    private List<Map<String, Object>> comparisonRows;

    @Autowired
    private PimClient pimClient;

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    @Override
    protected void postInject() {
        if (productSkus == null || productSkus.isEmpty()) {
            products = List.of();
            comparisonRows = List.of();
            return;
        }

        products = pimClient.getBulk(productSkus);

        if (products.isEmpty()) {
            log.debug("ModelComparisonModel: no products found for SKUs {} at path '{}'",
                    productSkus, getResource() != null ? getResource().getPath() : "unknown");
            comparisonRows = List.of();
            return;
        }

        comparisonRows = buildComparisonRows(products, compareAttributes);
    }

    // ── Derived getters ───────────────────────────────────────────────────────

    /** Resolved list of products in the same order as {@code productSkus}. */
    public List<PimProductData> getProducts() {
        return products;
    }

    /**
     * Structured comparison grid suitable for tabular rendering.
     * Each row entry: {@code { "attribute": key, "label": readableLabel, "values": [val, val, ...] }}.
     */
    public List<Map<String, Object>> getComparisonRows() {
        return comparisonRows;
    }

    /** Column headers: product names in comparison order. */
    public List<String> getProductNames() {
        if (products == null) return List.of();
        return products.stream().map(PimProductData::getName).toList();
    }

    /** Column sub-headers: SKUs in comparison order. */
    public List<String> getProductSkuList() {
        if (products == null) return List.of();
        return products.stream().map(PimProductData::getSku).toList();
    }

    public boolean hasProducts() {
        return products != null && !products.isEmpty();
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private static List<Map<String, Object>> buildComparisonRows(
            List<PimProductData> products, List<String> requestedAttributes) {

        // Determine attribute keys to compare
        List<String> keys;
        if (requestedAttributes != null && !requestedAttributes.isEmpty()) {
            keys = requestedAttributes;
        } else {
            // Use all attributes present in the first product as default
            keys = products.get(0).getAttributes() != null
                    ? new ArrayList<>(products.get(0).getAttributes().keySet())
                    : List.of();
        }

        List<Map<String, Object>> rows = new ArrayList<>();
        for (String key : keys) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("attribute", key);
            row.put("label", toLabel(key));

            List<Object> values = new ArrayList<>();
            for (PimProductData product : products) {
                Object val = product.getAttributes() != null
                        ? product.getAttributes().get(key)
                        : null;
                values.add(val);
            }
            row.put("values", values);
            rows.add(row);
        }
        return rows;
    }

    private static String toLabel(String key) {
        String spaced = key.replaceAll("([A-Z])", " $1")
                           .replaceAll("_", " ")
                           .trim();
        if (spaced.isEmpty()) return key;
        return Character.toUpperCase(spaced.charAt(0)) + spaced.substring(1);
    }
}
