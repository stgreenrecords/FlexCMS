package com.flexcms.plugin.spi;

import com.flexcms.plugin.model.RenderContext;
import java.util.Map;

/**
 * SPI for component backend logic.
 * Each CMS component implements this to provide data for rendering.
 * Implementations have full access to Spring beans and external services.
 *
 * <h3>Two styles of implementation:</h3>
 *
 * <p><b>1. Field-injection style (recommended — ComponentModel pattern):</b></p>
 * <p>Extend {@link AbstractComponentModel} and declare properties as annotated fields:</p>
 * <pre>{@code
 * @FlexCmsComponent(resourceType = "myapp/hero-banner")
 * public class HeroBannerModel extends AbstractComponentModel {
 *
 *     @ValueMapValue
 *     private String title;
 *
 *     @ValueMapValue(name = "theme")
 *     private String theme = "light";
 *
 *     @Autowired
 *     private DamService damService;
 *
 *     // Derived getter — auto-exported to model
 *     public String getImageUrl() {
 *         return damService.getRenditionUrl(backgroundImagePath, "hero-desktop");
 *     }
 * }
 * }</pre>
 *
 * <p><b>2. Programmatic style (advanced — full manual control):</b></p>
 * <p>Implement this interface directly and build the model map in {@code adapt()}:</p>
 * <pre>{@code
 * @FlexCmsComponent(resourceType = "myapp/dynamic-feed")
 * public class DynamicFeedModel implements ComponentModel {
 *     @Override
 *     public Map<String, Object> adapt(ContentNodeData node, RenderContext context) {
 *         // Full manual control over the model map
 *         return Map.of("items", fetchExternalFeed(node));
 *     }
 * }
 * }</pre>
 */
public interface ComponentModel {

    /**
     * Adapt a content node into a view model map for rendering.
     *
     * @param node    the content node containing authored properties
     * @param context the render context (site, locale, request info)
     * @return map of view model properties to pass to the template or API response
     */
    Map<String, Object> adapt(ContentNodeData node, RenderContext context);

    /**
     * Generate a cache key for this component's output.
     * Return null to use the default key (path + locale + version).
     */
    default String getCacheKey(ContentNodeData node, RenderContext context) {
        return null;
    }
}
