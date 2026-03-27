package com.flexcms.core.service;

import com.flexcms.core.model.ContentNode;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.plugin.model.RenderContext;
import com.flexcms.plugin.spi.ComponentModel;
import com.flexcms.plugin.spi.ContentNodeData;
import io.micrometer.core.annotation.Timed;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Builds page data by resolving the component tree and adapting each
 * component through its registered ComponentModel.
 *
 * <p><b>Experience Fragment resolution:</b> when a component node has
 * {@code resourceType = "flexcms/experience-fragment"}, this service
 * fetches the variation pointed to by the {@code fragmentPath} property
 * and embeds its component tree inline (replacing the placeholder node).
 * A thread-local depth counter (max {@value #MAX_XF_DEPTH}) prevents
 * infinite loops from circular XF references.
 */
@Service
public class ContentDeliveryService {

    private static final Logger log = LoggerFactory.getLogger(ContentDeliveryService.class);

    /** Resource type that signals an inline Experience Fragment reference. */
    public static final String XF_REFERENCE_TYPE = "flexcms/experience-fragment";

    /** Maximum XF resolution depth — prevents circular reference loops. */
    private static final int MAX_XF_DEPTH = 5;

    @Autowired
    private ContentNodeService nodeService;

    @Autowired
    private ComponentRegistry componentRegistry;

    @Autowired
    private ContentNodeRepository nodeRepository;

    // =========================================================================
    // Page rendering
    // =========================================================================

    /**
     * Render a page as a structured JSON response for headless delivery.
     */
    @Timed(value = "flexcms.content.page.render", description = "Time to render a page component tree")
    @Transactional(readOnly = true)
    public Map<String, Object> renderPage(String path, RenderContext context) {
        ContentNode page = nodeService.getWithChildren(path)
                .orElseThrow(() -> new IllegalArgumentException("Page not found: " + path));

        Map<String, Object> result = new LinkedHashMap<>();

        Map<String, Object> pageMeta = new LinkedHashMap<>();
        pageMeta.put("path", page.getPath());
        pageMeta.put("title", page.getProperty("jcr:title", ""));
        pageMeta.put("description", page.getProperty("jcr:description", ""));
        pageMeta.put("template", page.getProperty("template", ""));
        pageMeta.put("locale", page.getLocale());
        pageMeta.put("lastModified", page.getModifiedAt());
        result.put("page", pageMeta);

        List<Map<String, Object>> components = new ArrayList<>();
        for (ContentNodeData child : page.getChildren()) {
            components.add(adaptComponent(child, context, 0));
        }
        result.put("components", components);

        return result;
    }

    /**
     * Render an Experience Fragment variation as a page-like response.
     * Used by the headless XF API.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> renderXfVariation(ContentNode variation, RenderContext context) {
        ContentNode loaded = nodeService.getWithChildren(variation.getPath())
                .orElse(variation);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("xfPath",        loaded.getParentPath());
        result.put("variationType", loaded.getProperty("variationType", loaded.getName()));
        result.put("title",         loaded.getProperty("jcr:title", loaded.getName()));
        result.put("path",          loaded.getPath());

        List<Map<String, Object>> components = new ArrayList<>();
        for (ContentNodeData child : loaded.getChildren()) {
            components.add(adaptComponent(child, context, 0));
        }
        result.put("components", components);
        return result;
    }

    // =========================================================================
    // Component adaptation (recursive, XF-aware)
    // =========================================================================

    /**
     * Adapt a single component node through its model, recursively processing children.
     *
     * <p>When {@code resourceType = "flexcms/experience-fragment"}, the node's
     * {@code fragmentPath} property is resolved and the referenced variation's
     * component tree is embedded inline under an {@code inlineContent} key.
     *
     * @param node    component node to adapt
     * @param context render context (site, locale, etc.)
     * @param xfDepth current XF resolution depth (0 at page root)
     */
    private Map<String, Object> adaptComponent(ContentNodeData node, RenderContext context, int xfDepth) {
        Map<String, Object> componentData = new LinkedHashMap<>();
        componentData.put("name",         node.getName());
        componentData.put("resourceType", node.getResourceType());

        // ── Experience Fragment reference — resolve inline ─────────────────
        if (XF_REFERENCE_TYPE.equals(node.getResourceType())) {
            resolveXfInline(node, context, xfDepth, componentData);
            return componentData;
        }

        // ── Regular component — adapt through model ────────────────────────
        Optional<ComponentModel> model = componentRegistry.getModel(node.getResourceType());
        if (model.isPresent()) {
            try {
                Map<String, Object> adapted = model.get().adapt(node, context);
                componentData.put("data", adapted);
            } catch (Exception e) {
                log.error("Error adapting component {} at {}: {}",
                        node.getResourceType(), node.getPath(), e.getMessage());
                componentData.put("data",   node.getProperties());
                componentData.put("_error", e.getMessage());
            }
        } else {
            componentData.put("data", node.getProperties());
        }

        // ── Children (containers) ─────────────────────────────────────────
        if (node.getChildren() != null && !node.getChildren().isEmpty()) {
            List<Map<String, Object>> children = new ArrayList<>();
            for (ContentNodeData child : node.getChildren()) {
                children.add(adaptComponent(child, context, xfDepth));
            }
            componentData.put("children", children);
        }

        return componentData;
    }

    /**
     * Resolves an XF reference node by fetching the variation from the DB and
     * embedding its component tree under {@code inlineContent}.
     */
    private void resolveXfInline(ContentNodeData node, RenderContext context,
                                  int xfDepth, Map<String, Object> componentData) {
        componentData.put("data", node.getProperties());   // keep reference properties visible

        if (xfDepth >= MAX_XF_DEPTH) {
            log.warn("XF max resolution depth ({}) reached at {}. Circular reference?",
                    MAX_XF_DEPTH, node.getPath());
            componentData.put("_xfError", "Max resolution depth exceeded — possible circular reference");
            return;
        }

        String fragmentPath = (String) node.getProperties().get("fragmentPath");
        if (fragmentPath == null || fragmentPath.isBlank()) {
            componentData.put("_xfError", "fragmentPath property is missing or blank");
            return;
        }

        // Resolve via repository directly to avoid @PreAuthorize overhead for delivery
        Optional<ContentNode> variationOpt = nodeRepository.findByPath(fragmentPath);
        if (variationOpt.isEmpty()) {
            log.debug("XF variation not found: {}", fragmentPath);
            componentData.put("_xfError", "XF variation not found: " + fragmentPath);
            return;
        }

        ContentNode variation = variationOpt.get();
        if (!"flexcms/xf-page".equals(variation.getResourceType())) {
            componentData.put("_xfError", "Resolved node is not an XF page: " + fragmentPath);
            return;
        }

        // Load children of the variation
        ContentNode loaded = nodeService.getWithChildren(fragmentPath).orElse(variation);

        List<Map<String, Object>> inlineComponents = new ArrayList<>();
        for (ContentNodeData child : loaded.getChildren()) {
            inlineComponents.add(adaptComponent(child, context, xfDepth + 1));
        }

        componentData.put("inlineContent", Map.of(
                "xfPath",        variation.getParentPath(),
                "variationType", variation.getProperty("variationType", variation.getName()),
                "components",    inlineComponents
        ));
    }

    // =========================================================================
    // Page listing (GraphQL pages query)
    // =========================================================================

    /**
     * Build page map in the structure expected by the GraphQL Page type.
     * Fields: path, title, description, template, locale, lastModified, components (empty for list view).
     */
    public Map<String, Object> buildPageMap(ContentNode node) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("path",         node.getPath());
        map.put("title",        node.getProperty("jcr:title", node.getName()));
        map.put("description",  node.getProperty("jcr:description", null));
        map.put("template",     node.getProperty("template", null));
        map.put("locale",       node.getLocale());
        map.put("lastModified", node.getModifiedAt() != null ? node.getModifiedAt().toString() : null);
        map.put("components",   List.of());
        return map;
    }

    /**
     * List pages for a site — used by the GraphQL {@code pages} query.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> listPages(String siteId, String locale, String template,
                                          int limit, int offset) {
        int pageNum = limit > 0 ? offset / limit : 0;
        Page<ContentNode> page = nodeService.search(siteId, locale, "", PageRequest.of(pageNum, Math.max(limit, 1)));

        List<Map<String, Object>> items = page.getContent().stream()
                .filter(n -> template == null || template.equals(n.getProperty("template", "")))
                .map(this::buildPageMap)
                .toList();

        long totalCount = page.getTotalElements();
        boolean hasNextPage   = (long) offset + limit < totalCount;
        boolean hasPreviousPage = offset > 0;
        Integer nextOffset    = hasNextPage ? offset + limit : null;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalCount",     totalCount);
        result.put("items",          items);
        result.put("hasNextPage",    hasNextPage);
        result.put("hasPreviousPage", hasPreviousPage);
        result.put("nextOffset",     nextOffset);
        return result;
    }

    // =========================================================================
    // Navigation
    // =========================================================================

    /**
     * Build navigation tree for a site.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> buildNavigation(String siteId, String locale, int depth) {
        String rootPath = "content." + siteId + "." + locale;
        return buildNavLevel(rootPath, depth, 0);
    }

    private List<Map<String, Object>> buildNavLevel(String parentPath, int maxDepth, int currentDepth) {
        if (currentDepth >= maxDepth) return List.of();

        List<ContentNode> children = nodeService.getByPath(parentPath)
                .map(node -> {
                    ContentNode loaded = nodeService.getWithChildren(parentPath).orElse(node);
                    return loaded.getChildren().stream()
                            .filter(c -> "flexcms/page".equals(c.getResourceType()))
                            .filter(c -> !Boolean.TRUE.equals(c.getProperty("hideInNav", Boolean.class)))
                            .map(c -> (ContentNode) c)
                            .toList();
                })
                .orElse(List.of());

        List<Map<String, Object>> navItems = new ArrayList<>();
        for (ContentNode child : children) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("title", child.getProperty("navTitle",
                    child.getProperty("jcr:title", child.getName())));
            item.put("url",   resolveUrl(child));
            item.put("path",  child.getPath());

            List<Map<String, Object>> subItems = buildNavLevel(child.getPath(), maxDepth, currentDepth + 1);
            if (!subItems.isEmpty()) item.put("children", subItems);
            navItems.add(item);
        }

        return navItems;
    }

    private String resolveUrl(ContentNode node) {
        String path = node.getPath();
        String[] segments = path.split("\\.");
        if (segments.length > 3) {
            return "/" + String.join("/", Arrays.copyOfRange(segments, 3, segments.length));
        }
        return "/";
    }
}
