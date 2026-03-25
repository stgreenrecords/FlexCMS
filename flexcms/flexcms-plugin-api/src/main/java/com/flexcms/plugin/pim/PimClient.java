package com.flexcms.plugin.pim;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Client API for retrieving product data from the PIM system within CMS ComponentModels.
 *
 * <p>This interface bridges the CMS and PIM pillars. ComponentModels that reference
 * products by SKU can auto-wire this bean to enrich their component data at render time
 * without taking a hard dependency on PIM internals.</p>
 *
 * <p>The default implementation ({@code DirectPimClient}) resolves products by calling
 * {@code ProductService} in-process (same JVM). When the CMS and PIM run in separate
 * processes, a REST-based implementation can be substituted without changing any
 * ComponentModel code.</p>
 *
 * <h3>Usage in a component model:</h3>
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
public interface PimClient {

    /**
     * Look up a single product by SKU with fully-resolved attributes.
     * Returns empty if the product does not exist or is archived.
     *
     * @param sku global product identifier
     */
    Optional<PimProductData> getProduct(String sku);

    /**
     * Bulk lookup — retrieve multiple products in a single call.
     * Products not found are silently omitted from the result list.
     * Order of results matches the input order where possible.
     *
     * @param skus collection of SKUs to retrieve
     */
    List<PimProductData> getBulk(Collection<String> skus);

    /**
     * Look up all published products in a given catalog.
     * Used for category-level or landing-page components that display
     * an entire product range rather than a single product.
     *
     * @param catalogId UUID of the catalog
     * @param page      0-based page number
     * @param size      page size (max 100)
     */
    List<PimProductData> listByCatalog(String catalogId, int page, int size);

    /**
     * Check whether a product SKU exists in the PIM system.
     * Cheaper than {@link #getProduct} when you only need existence, not data.
     */
    boolean exists(String sku);
}
