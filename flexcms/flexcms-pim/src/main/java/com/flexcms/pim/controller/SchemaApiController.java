package com.flexcms.pim.controller;

import com.flexcms.pim.model.ProductSchema;
import com.flexcms.pim.service.SchemaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * PIM Product Schema REST API.
 *
 * <p>Schemas define the attribute structure for products.
 * They are versioned to support year-over-year evolution with inheritance.</p>
 */
@Tag(name = "PIM Schemas", description = "Product schema management — versioned attribute definitions for catalogs")
@RestController
@RequestMapping("/api/pim/v1/schemas")
public class SchemaApiController {

    @Autowired
    private SchemaService schemaService;

    @Operation(summary = "List active schemas", description = "Returns paginated active product schemas.")
    @GetMapping
    public ResponseEntity<Map<String, Object>> listActive(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int clampedSize = Math.min(size, 100);
        Page<ProductSchema> result = schemaService.listActive(PageRequest.of(page, clampedSize));
        return ResponseEntity.ok(toPageResponse(result));
    }

    @Operation(summary = "Get schema by ID", description = "Returns a single product schema by its UUID.")
    @GetMapping("/{id}")
    public ResponseEntity<ProductSchema> getById(@PathVariable UUID id) {
        return schemaService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "List schemas by name", description = "Returns paginated schemas matching the given name (all versions).")
    @GetMapping("/by-name/{name}")
    public ResponseEntity<Map<String, Object>> listByName(
            @PathVariable String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int clampedSize = Math.min(size, 100);
        Page<ProductSchema> result = schemaService.listByName(name, PageRequest.of(page, clampedSize));
        return ResponseEntity.ok(toPageResponse(result));
    }

    @Operation(summary = "Create schema", description = "Creates a new product attribute schema with its JSON Schema definition.")
    @PostMapping
    public ResponseEntity<ProductSchema> create(@Valid @RequestBody CreateSchemaRequest request) {
        ProductSchema schema = schemaService.create(
                request.name(), request.version(), request.description(),
                request.schemaDef(), request.attributeGroups(),
                request.parentId(), request.userId()
        );
        return ResponseEntity.ok(schema);
    }

    @Operation(summary = "Create schema version", description = "Creates a new version of an existing schema, inheriting from the parent.")
    @PostMapping("/{id}/new-version")
    public ResponseEntity<ProductSchema> createNewVersion(
            @PathVariable UUID id,
            @Valid @RequestBody NewVersionRequest request) {
        ProductSchema schema = schemaService.createNewVersion(id, request.newVersion(),
                request.schemaDef(), request.userId());
        return ResponseEntity.ok(schema);
    }

    @Operation(summary = "Update schema", description = "Updates a schema's description, JSON Schema definition, and attribute groups.")
    @PutMapping("/{id}")
    public ResponseEntity<ProductSchema> update(
            @PathVariable UUID id,
            @RequestBody UpdateSchemaRequest request) {
        ProductSchema schema = schemaService.update(id, request.description(),
                request.schemaDef(), request.attributeGroups());
        return ResponseEntity.ok(schema);
    }

    @Operation(summary = "Deactivate schema", description = "Marks a schema as inactive — it will no longer appear in active schema lists.")
    @PostMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable UUID id) {
        schemaService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Delete schema", description = "Permanently deletes a schema. Fails if catalogs are still using it.")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        schemaService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private Map<String, Object> toPageResponse(Page<ProductSchema> result) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("items", result.getContent());
        response.put("totalCount", result.getTotalElements());
        response.put("page", result.getNumber());
        response.put("size", result.getSize());
        response.put("hasNextPage", result.hasNext());
        return response;
    }

    public record CreateSchemaRequest(
            @NotBlank(message = "name is required") String name,
            @NotBlank(message = "version is required") String version,
            String description,
            @NotNull(message = "schemaDef is required") Map<String, Object> schemaDef,
            Map<String, Object> attributeGroups,
            UUID parentId,
            @NotBlank(message = "userId is required") String userId) {}

    public record NewVersionRequest(
            @NotBlank(message = "newVersion is required") String newVersion,
            @NotNull(message = "schemaDef is required") Map<String, Object> schemaDef,
            @NotBlank(message = "userId is required") String userId) {}

    public record UpdateSchemaRequest(
            String description,
            Map<String, Object> schemaDef,
            Map<String, Object> attributeGroups) {}
}
