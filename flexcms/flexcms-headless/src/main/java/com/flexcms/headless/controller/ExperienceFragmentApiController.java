package com.flexcms.headless.controller;

import com.flexcms.author.service.ExperienceFragmentService;
import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.model.ContentNode;
import com.flexcms.core.service.ContentDeliveryService;
import com.flexcms.plugin.model.RenderContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Public headless API for delivering Experience Fragment content.
 *
 * <p>These endpoints are intentionally <em>public</em> (no authentication required)
 * so that SSR frontends can embed XF content (header, footer, promos) without
 * requiring a Bearer token on every page render.
 *
 * <p>Base URL: {@code /api/content/v1/xf}
 */
@Tag(name = "Experience Fragments (Headless)", description = "Public delivery API for Experience Fragment variations")
@RestController
@RequestMapping("/api/content/v1/xf")
public class ExperienceFragmentApiController {

    @Autowired
    private ExperienceFragmentService xfService;

    @Autowired
    private ContentDeliveryService deliveryService;

    /**
     * Get the resolved component tree for a specific XF variation.
     *
     * <p>The response mirrors the structure of a regular page's {@code components}
     * array so frontends can render it with the same component map.
     *
     * <p>Example: {@code GET /api/content/v1/xf/experience-fragments.wknd.en.site.header/master}
     *
     * @param xfPath       dot-separated path of the XF folder (e.g. {@code experience-fragments.wknd.en.site.header})
     * @param variationType the variation name (e.g. {@code master}, {@code mobile})
     */
    @Operation(
        summary = "Get resolved component tree for an XF variation",
        description = "Returns the component array of the requested XF variation, ready for headless rendering. " +
                      "Nested flexcms/experience-fragment references within the variation are resolved inline."
    )
    @GetMapping("/{*xfPath}/variations/{variationType}")
    public ResponseEntity<Map<String, Object>> getVariation(
            @Parameter(description = "Dot-path of the XF folder, e.g. experience-fragments.wknd.en.site.header")
            @PathVariable String xfPath,
            @Parameter(description = "Variation name, e.g. master | mobile | email")
            @PathVariable String variationType) {

        String path = normalise(xfPath);

        ContentNode variation = xfService.getVariation(path, variationType)
                .orElseThrow(() -> new NotFoundException(
                        "XF variation '" + variationType + "' not found at: " + path));

        // Build a page-like response with the variation's component tree
        RenderContext ctx = new RenderContext();
        Map<String, Object> response = deliveryService.renderXfVariation(variation, ctx);
        return ResponseEntity.ok(response);
    }

    /**
     * Get the default variation (prefers "master") of an Experience Fragment.
     */
    @Operation(summary = "Get the default (master) variation of an XF")
    @GetMapping("/{*xfPath}")
    public ResponseEntity<Map<String, Object>> getDefaultVariation(
            @PathVariable String xfPath) {

        String path = normalise(xfPath);

        ContentNode variation = xfService.getDefaultVariation(path)
                .orElseThrow(() -> new NotFoundException(
                        "No variations found for Experience Fragment: " + path));

        RenderContext ctx = new RenderContext();
        Map<String, Object> response = deliveryService.renderXfVariation(variation, ctx);
        return ResponseEntity.ok(response);
    }

    /**
     * List all available variations for an Experience Fragment (metadata only, no component trees).
     */
    @Operation(summary = "List available variations for an XF")
    @GetMapping("/{*xfPath}/variations")
    public ResponseEntity<List<Map<String, Object>>> listVariations(@PathVariable String xfPath) {
        String path = normalise(xfPath);
        List<ContentNode> variations = xfService.listVariations(path);
        List<Map<String, Object>> result = variations.stream()
                .map(v -> Map.<String, Object>of(
                        "variationType", v.getProperty("variationType", v.getName()),
                        "title",         v.getProperty("jcr:title", v.getName()),
                        "path",          v.getPath(),
                        "isMaster",      v.getProperty("xfMasterVariation", false)
                ))
                .toList();
        return ResponseEntity.ok(result);
    }

    // -------------------------------------------------------------------------

    /** Strip leading slash if Spring MVC injects one; convert slashes to dots. */
    private static String normalise(String path) {
        return path.startsWith("/") ? path.substring(1).replace('/', '.') : path;
    }
}

