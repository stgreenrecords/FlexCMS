package com.flexcms.headless.controller;

import com.flexcms.core.model.ComponentDefinition;
import com.flexcms.core.service.ComponentRegistry;
import com.flexcms.core.service.ContentNodeService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

/**
 * Component Registry API — the formal contract between backend and frontend.
 *
 * <p>Frontend teams use this endpoint to discover all registered components
 * and their data schemas. Both sides develop independently as long as the
 * contract (dataSchema) is honored.</p>
 */
@Tag(name = "Headless Components", description = "Component registry — discover registered component types and their data schemas")
@RestController
@RequestMapping("/api/content/v1/component-registry")
public class ComponentRegistryController {

    @Autowired
    private ComponentRegistry componentRegistry;

    @Autowired
    private ContentNodeService nodeService;

    @Operation(summary = "Get full component registry", description = "Returns all registered component types with their data schemas — the primary backend/frontend contract.")
    @GetMapping
    public ResponseEntity<Map<String, Object>> getRegistry() {
        List<Map<String, Object>> components = componentRegistry.getAllDefinitions().stream()
                .map(this::toContract)
                .toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("components", components);
        response.put("version", "1.0.0");
        response.put("generatedAt", Instant.now().toString());

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Component usage counts",
            description = "Number of content nodes per component resource type. Backs the admin component list's usage column.")
    @GetMapping("/usage")
    public ResponseEntity<Map<String, Object>> getUsageCounts() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("usage", nodeService.getComponentUsageCounts());
        return ResponseEntity.ok(response);
    }

    /**
     * Where one component is used.
     *
     * <p>The resource type is a query parameter rather than a path variable because it
     * contains slashes ({@code tut-usa/navigation-search-discovery/currency-selector}),
     * which a path variable would split.</p>
     */
    @Operation(summary = "Component usages",
            description = "Content nodes that use a component, so an author can see where it appears.")
    @GetMapping("/usages")
    public ResponseEntity<Map<String, Object>> getUsages(@RequestParam String resourceType) {
        List<Map<String, Object>> usages = nodeService.getComponentUsages(resourceType).stream()
                .map(node -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("path", node.getPath());
                    row.put("siteId", node.getSiteId());
                    row.put("status", node.getStatus() == null ? null : node.getStatus().name());
                    return row;
                })
                .toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("resourceType", resourceType);
        response.put("count", usages.size());
        response.put("usages", usages);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get component by resource type", description = "Returns the data schema contract for a single component type (e.g. tut/hero-banner).")
    @GetMapping("/{resourceType}")
    public ResponseEntity<Map<String, Object>> getComponent(@PathVariable String resourceType) {
        return componentRegistry.getDefinition(resourceType)
                .map(def -> ResponseEntity.ok(toContract(def)))
                .orElse(ResponseEntity.notFound().build());
    }

    private Map<String, Object> toContract(ComponentDefinition def) {
        Map<String, Object> contract = new LinkedHashMap<>();
        contract.put("resourceType", def.getResourceType());
        contract.put("name", def.getName());
        contract.put("title", def.getTitle());
        contract.put("description", def.getDescription());
        contract.put("group", def.getGroupName());
        contract.put("icon", def.getIcon());
        contract.put("isContainer", def.isContainer());
        contract.put("dataSchema", def.getDataSchema());
        contract.put("dialog", def.getDialog());
        return contract;
    }
}

