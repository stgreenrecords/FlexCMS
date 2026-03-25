package com.flexcms.headless.controller;

import com.flexcms.core.model.ContentNode;
import com.flexcms.core.service.ContentNodeService;
import com.flexcms.plugin.spi.ContentNodeData;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * REST API for raw content node access.
 */
@Tag(name = "Headless Nodes", description = "Raw content node access and descendant tree traversal")
@RestController
@RequestMapping("/api/content/v1/nodes")
public class NodeApiController {

    @Autowired
    private ContentNodeService nodeService;

    /**
     * Get a raw content node by path.
     */
    @GetMapping("/{*path}")
    public ResponseEntity<Map<String, Object>> getNode(@PathVariable String path) {
        String contentPath = toContentPath(path);

        return nodeService.getByPath(contentPath)
                .map(node -> ResponseEntity.ok(toMap(node)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get subtree of descendants up to a maximum depth.
     *
     * @param depth maximum traversal depth (1 = direct children only, default 5, max 10)
     */
    @GetMapping("/{*path}/descendants")
    public ResponseEntity<Map<String, Object>> getDescendants(
            @PathVariable String path,
            @RequestParam(defaultValue = "5") int depth) {
        String contentPath = toContentPath(path);
        int cappedDepth = Math.min(Math.max(depth, 1), 10);

        return nodeService.getWithChildren(contentPath)
                .map(node -> {
                    List<Map<String, Object>> descendants = new ArrayList<>();
                    collectDescendants(node, descendants, cappedDepth, 0);
                    Map<String, Object> response = new LinkedHashMap<>();
                    response.put("path", contentPath);
                    response.put("depth", cappedDepth);
                    response.put("count", descendants.size());
                    response.put("items", descendants);
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private String toContentPath(String path) {
        String p = path.startsWith("/") ? path.substring(1) : path;
        p = p.replace("/", ".");
        return p.startsWith("content.") ? p : "content." + p;
    }

    private Map<String, Object> toMap(ContentNode node) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("path", node.getPath());
        map.put("name", node.getName());
        map.put("resourceType", node.getResourceType());
        map.put("properties", node.getProperties());
        map.put("status", node.getStatus());
        map.put("version", node.getVersion());
        map.put("locale", node.getLocale());
        map.put("siteId", node.getSiteId());
        map.put("modifiedAt", node.getModifiedAt());
        return map;
    }

    private void collectDescendants(ContentNode node, List<Map<String, Object>> result, int maxDepth, int currentDepth) {
        if (currentDepth >= maxDepth) return;
        for (ContentNodeData child : node.getChildren()) {
            if (child instanceof ContentNode cn) {
                result.add(toMap(cn));
                collectDescendants(cn, result, maxDepth, currentDepth + 1);
            }
        }
    }
}

