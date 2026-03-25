package com.flexcms.plugin.pim;

import java.util.List;
import java.util.Map;

/**
 * Lightweight product data carrier for use in CMS ComponentModels.
 *
 * <p>This DTO represents a fully-resolved product (inherited attributes already merged)
 * as returned by the PIM system. ComponentModels receive this object after calling
 * {@link PimClient#getProduct(String)} and can expose it directly to the template
 * or derive additional computed values from it.</p>
 *
 * <h3>Example usage in a component model:</h3>
 * <pre>{@code
 * @FlexCmsComponent(resourceType = "myapp/product-teaser")
 * public class ProductTeaserModel extends AbstractComponentModel {
 *
 *     @ValueMapValue
 *     private String productSku;
 *
 *     @Autowired
 *     private PimClient pimClient;
 *
 *     private PimProductData product;
 *
 *     @Override
 *     protected void postInject() {
 *         product = pimClient.getProduct(productSku).orElse(null);
 *     }
 *
 *     public PimProductData getProduct() { return product; }
 * }
 * }</pre>
 */
public class PimProductData {

    private String id;
    private String sku;
    private String name;
    private String status;

    /**
     * Fully-resolved product attributes: base attributes merged with any
     * year-over-year carryforward overrides. The consumer sees a complete
     * attribute map regardless of the product's inheritance chain depth.
     */
    private Map<String, Object> attributes;

    /**
     * Fields explicitly overridden in this year's catalog vs. the source year.
     * Empty for standalone (non-carryforward) products.
     */
    private List<String> overriddenFields;

    /** SKU-level variants (size, color, etc.) with their own pricing and inventory. */
    private List<Map<String, Object>> variants;

    /** DAM asset references: path + role (hero, gallery, thumbnail, swatch, document). */
    private List<Map<String, Object>> assets;

    private String catalogId;
    private String schemaId;

    public PimProductData() {}

    public PimProductData(String id, String sku, String name, String status,
                          Map<String, Object> attributes, List<String> overriddenFields,
                          List<Map<String, Object>> variants, List<Map<String, Object>> assets,
                          String catalogId, String schemaId) {
        this.id = id;
        this.sku = sku;
        this.name = name;
        this.status = status;
        this.attributes = attributes;
        this.overriddenFields = overriddenFields;
        this.variants = variants;
        this.assets = assets;
        this.catalogId = catalogId;
        this.schemaId = schemaId;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Map<String, Object> getAttributes() { return attributes; }
    public void setAttributes(Map<String, Object> attributes) { this.attributes = attributes; }
    public List<String> getOverriddenFields() { return overriddenFields; }
    public void setOverriddenFields(List<String> overriddenFields) { this.overriddenFields = overriddenFields; }
    public List<Map<String, Object>> getVariants() { return variants; }
    public void setVariants(List<Map<String, Object>> variants) { this.variants = variants; }
    public List<Map<String, Object>> getAssets() { return assets; }
    public void setAssets(List<Map<String, Object>> assets) { this.assets = assets; }
    public String getCatalogId() { return catalogId; }
    public void setCatalogId(String catalogId) { this.catalogId = catalogId; }
    public String getSchemaId() { return schemaId; }
    public void setSchemaId(String schemaId) { this.schemaId = schemaId; }
}
