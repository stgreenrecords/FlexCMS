package com.flexcms.headless.controller;

import com.flexcms.core.model.ContentNode;
import com.flexcms.core.service.ContentNodeService;
import com.flexcms.plugin.spi.ContentNodeData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * REST API for raw content node access.
 */
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
        String contentPath = path.replace("/", ".");

        return nodeService.getByPath(contentPath)
                .map(node -> ResponseEntity.ok(toMap(node)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get subtree of descendants.
     */
    @GetMapping("/{*path}/descendants")
    public ResponseEntity<List<Map<String, Object>>> getDescendants(@PathVariable String path) {
        String contentPath = path.replace("/", ".");

        return nodeService.getWithChildren(contentPath)
                .map(node -> {
                    List<Map<String, Object>> descendants = new ArrayList<>();
                    collectDescendants(node, descendants);
                    return ResponseEntity.ok(descendants);
                })
                .orElse(ResponseEntity.notFound().build());
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

    private void collectDescendants(ContentNode node, List<Map<String, Object>> result) {
        for (ContentNodeData child : node.getChildren()) {
            if (child instanceof ContentNode cn) {
                result.add(toMap(cn));
                collectDescendants(cn, result);
            }
        }
    }
}

