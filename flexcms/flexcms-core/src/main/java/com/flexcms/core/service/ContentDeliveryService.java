package com.flexcms.core.service;

import com.flexcms.core.model.ContentNode;
import com.flexcms.plugin.model.RenderContext;
import com.flexcms.plugin.spi.ComponentModel;
import com.flexcms.plugin.spi.ContentNodeData;
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
 */
@Service
public class ContentDeliveryService {

    private static final Logger log = LoggerFactory.getLogger(ContentDeliveryService.class);

    @Autowired
    private ContentNodeService nodeService;

    @Autowired
    private ComponentRegistry componentRegistry;

    /**
     * Render a page as a structured JSON response for headless delivery.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> renderPage(String path, RenderContext context) {
        ContentNode page = nodeService.getWithChildren(path)
                .orElseThrow(() -> new IllegalArgumentException("Page not found: " + path));

        Map<String, Object> result = new LinkedHashMap<>();

        // Page metadata
        Map<String, Object> pageMeta = new LinkedHashMap<>();
        pageMeta.put("path", page.getPath());
        pageMeta.put("title", page.getProperty("jcr:title", ""));
        pageMeta.put("description", page.getProperty("jcr:description", ""));
        pageMeta.put("template", page.getProperty("template", ""));
        pageMeta.put("locale", page.getLocale());
        pageMeta.put("lastModified", page.getModifiedAt());
        result.put("page", pageMeta);

        // Build component tree
        List<Map<String, Object>> components = new ArrayList<>();
        for (ContentNodeData child : page.getChildren()) {
            components.add(adaptComponent(child, context));
        }
        result.put("components", components);

        return result;
    }

    /**
     * Adapt a single component node through its model, recursively processing children.
     */
    private Map<String, Object> adaptComponent(ContentNodeData node, RenderContext context) {
        Map<String, Object> componentData = new LinkedHashMap<>();
        componentData.put("name", node.getName());
        componentData.put("resourceType", node.getResourceType());

        // Run through component model if available
        Optional<ComponentModel> model = componentRegistry.getModel(node.getResourceType());
        if (model.isPresent()) {
            try {
                Map<String, Object> adapted = model.get().adapt(node, context);
                componentData.put("data", adapted);
            } catch (Exception e) {
                log.error("Error adapting component {} at {}: {}",
                        node.getResourceType(), node.getPath(), e.getMessage());
                componentData.put("data", node.getProperties());
                componentData.put("_error", e.getMessage());
            }
        } else {
            // No model registered — pass raw properties
            componentData.put("data", node.getProperties());
        }

        // Process children recursively (for containers)
        if (node.getChildren() != null && !node.getChildren().isEmpty()) {
            List<Map<String, Object>> children = new ArrayList<>();
            for (ContentNodeData child : node.getChildren()) {
                children.add(adaptComponent(child, context));
            }
            componentData.put("children", children);
        }

        return componentData;
    }

    /**
     * Build page map in the structure expected by the GraphQL Page type.
     * Fields: path, title, description, template, locale, lastModified, components (empty for list view).
     */
    public Map<String, Object> buildPageMap(ContentNode node) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("path", node.getPath());
        map.put("title", node.getProperty("jcr:title", node.getName()));
        map.put("description", node.getProperty("jcr:description", null));
        map.put("template", node.getProperty("template", null));
        map.put("locale", node.getLocale());
        map.put("lastModified", node.getModifiedAt() != null ? node.getModifiedAt().toString() : null);
        map.put("components", List.of());
        return map;
    }

    /**
     * List pages for a site — used by the GraphQL {@code pages} query.
     * Returns a PageConnection-style map: {@code {totalCount, items}}.
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
        boolean hasNextPage = (long) offset + limit < totalCount;
        boolean hasPreviousPage = offset > 0;
        Integer nextOffset = hasNextPage ? offset + limit : null;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalCount", totalCount);
        result.put("items", items);
        result.put("hasNextPage", hasNextPage);
        result.put("hasPreviousPage", hasPreviousPage);
        result.put("nextOffset", nextOffset);
        return result;
    }

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
            item.put("url", resolveUrl(child));
            item.put("path", child.getPath());

            List<Map<String, Object>> subItems = buildNavLevel(child.getPath(), maxDepth, currentDepth + 1);
            if (!subItems.isEmpty()) {
                item.put("children", subItems);
            }

            navItems.add(item);
        }

        return navItems;
    }

    private String resolveUrl(ContentNode node) {
        // Strip content tree prefix to build clean URL
        String path = node.getPath();
        // content.corporate.en.about -> /about
        String[] segments = path.split("\\.");
        if (segments.length > 3) {
            return "/" + String.join("/", Arrays.copyOfRange(segments, 3, segments.length));
        }
        return "/";
    }
}
