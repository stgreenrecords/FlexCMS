package com.flexcms.headless.controller;

import com.flexcms.core.model.ComponentDefinition;
import com.flexcms.core.service.ComponentRegistry;
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

