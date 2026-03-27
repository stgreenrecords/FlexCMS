package com.flexcms.plugin.dam;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Client API for accessing DAM asset data from within CMS ComponentModels.
 *
 * <p>This interface mirrors the {@code PimClient} pattern: ComponentModels that
 * need to resolve product image paths to actual rendition URLs, or fetch asset
 * metadata (dimensions, MIME type, file size), can auto-wire this bean without
 * taking a hard dependency on DAM internals.</p>
 *
 * <p>The default implementation ({@code DirectDamClient}) resolves assets
 * in-process by calling {@code AssetIngestService}. When CMS and DAM run in
 * separate processes, a REST-based implementation can be substituted.</p>
 *
 * <h3>Usage in a component model:</h3>
 * <pre>{@code
 * @FlexCmsComponent(resourceType = "tut/product-teaser")
 * public class ProductTeaserModel extends AbstractComponentModel {
 *
 *     @Autowired private PimClient pimClient;
 *     @Autowired private DamClient damClient;
 *
 *     private String heroImageUrl;
 *
 *     @Override
 *     protected void postInject() {
 *         PimProductData product = pimClient.getProduct(productSku).orElse(null);
 *         if (product != null) {
 *             String heroPath = resolveHeroPath(product);
 *             if (heroPath != null) {
 *                 heroImageUrl = damClient.getRenditionUrl(heroPath, "hero-desktop");
 *             }
 *         }
 *     }
 * }
 * }</pre>
 */
public interface DamClient {

    /**
     * Look up an asset by its DAM path.
     * Returns empty if the asset does not exist or is not active.
     *
     * @param path DAM asset path (e.g. {@code "/dam/products/shoe-x1/hero.jpg"})
     */
    Optional<DamAssetData> getAssetByPath(String path);

    /**
     * Bulk lookup — retrieve multiple assets by path in a single call.
     * Assets not found are silently omitted from the result list.
     *
     * @param paths collection of DAM paths to retrieve
     */
    List<DamAssetData> getBulkByPath(Collection<String> paths);

    /**
     * Resolve a rendition URL for an asset.
     *
     * <p>If the asset has a named rendition matching {@code renditionKey},
     * the rendition URL is returned. Otherwise the original asset stream URL
     * is returned as a fallback.</p>
     *
     * @param assetPath    DAM asset path
     * @param renditionKey rendition name (e.g. {@code "hero-desktop"}, {@code "thumbnail"})
     * @return absolute or root-relative URL, or {@code null} if the asset does not exist
     */
    String getRenditionUrl(String assetPath, String renditionKey);

    /**
     * Resolve metadata for multiple product asset refs in one call.
     *
     * <p>Useful for ProductTeaserModel / ProductSpecsModel: given the asset ref maps
     * returned by {@code PimProductData.getAssets()}, this method enriches them with
     * DAM metadata (dimensions, rendition URLs) so the template has everything it needs
     * in a single pass.</p>
     *
     * @param assetRefs list of maps from {@code PimProductData.getAssets()} —
     *                  each map contains at minimum {@code "assetPath"} and {@code "role"}
     * @return enriched maps including {@code "url"}, {@code "thumbnailUrl"},
     *         {@code "width"}, {@code "height"}, {@code "mimeType"}
     */
    List<Map<String, Object>> enrichProductAssets(List<Map<String, Object>> assetRefs);

    /**
     * Check whether an asset path exists and is active in the DAM.
     * Cheaper than {@link #getAssetByPath} when you only need an existence check.
     */
    boolean exists(String path);
}
