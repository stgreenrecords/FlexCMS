package com.flexcms.pim.model;

import java.util.List;

/**
 * Summary of differences between a source catalog and a target catalog
 * after a year-over-year carryforward operation.
 *
 * <p>Used by operations teams to review what needs to be edited for the new year,
 * what products are entirely new, and which source products were not carried forward.</p>
 */
public class CarryforwardDeltaReport {

    /** Products that were carried forward but have at least one overridden field. */
    private List<ProductDelta> modifiedProducts;

    /**
     * Products in the target catalog with no {@code sourceProduct} link —
     * they were created fresh, not carried from the source.
     */
    private List<String> newProductSkus;

    /**
     * SKUs from the source catalog that have no corresponding carryforward
     * product in the target catalog.
     */
    private List<String> notCarriedForwardSkus;

    /** Total products in source catalog. */
    private int sourceTotalCount;

    /** Total products in target catalog. */
    private int targetTotalCount;

    /** Number of products carried forward (target products with a sourceProduct link). */
    private int carriedForwardCount;

    public CarryforwardDeltaReport(List<ProductDelta> modifiedProducts,
                                   List<String> newProductSkus,
                                   List<String> notCarriedForwardSkus,
                                   int sourceTotalCount,
                                   int targetTotalCount,
                                   int carriedForwardCount) {
        this.modifiedProducts = modifiedProducts;
        this.newProductSkus = newProductSkus;
        this.notCarriedForwardSkus = notCarriedForwardSkus;
        this.sourceTotalCount = sourceTotalCount;
        this.targetTotalCount = targetTotalCount;
        this.carriedForwardCount = carriedForwardCount;
    }

    public List<ProductDelta> getModifiedProducts() { return modifiedProducts; }
    public List<String> getNewProductSkus() { return newProductSkus; }
    public List<String> getNotCarriedForwardSkus() { return notCarriedForwardSkus; }
    public int getSourceTotalCount() { return sourceTotalCount; }
    public int getTargetTotalCount() { return targetTotalCount; }
    public int getCarriedForwardCount() { return carriedForwardCount; }

    /**
     * Per-product delta entry within a {@link CarryforwardDeltaReport}.
     */
    public static class ProductDelta {

        private String targetSku;
        private String sourceSku;
        private List<String> overriddenFields;

        public ProductDelta(String targetSku, String sourceSku, List<String> overriddenFields) {
            this.targetSku = targetSku;
            this.sourceSku = sourceSku;
            this.overriddenFields = overriddenFields;
        }

        public String getTargetSku() { return targetSku; }
        public String getSourceSku() { return sourceSku; }
        public List<String> getOverriddenFields() { return overriddenFields; }
    }
}
