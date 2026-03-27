package com.flexcms.pim.controller;

import com.flexcms.pim.model.ProductSchema;
import com.flexcms.pim.service.SchemaService;
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
@RestController
@RequestMapping("/api/pim/v1/schemas")
public class SchemaApiController {

    @Autowired
    private SchemaService schemaService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> listActive(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int clampedSize = Math.min(size, 100);
        Page<ProductSchema> result = schemaService.listActive(PageRequest.of(page, clampedSize));
        return ResponseEntity.ok(toPageResponse(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductSchema> getById(@PathVariable UUID id) {
        return schemaService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/by-name/{name}")
    public ResponseEntity<Map<String, Object>> listByName(
            @PathVariable String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int clampedSize = Math.min(size, 100);
        Page<ProductSchema> result = schemaService.listByName(name, PageRequest.of(page, clampedSize));
        return ResponseEntity.ok(toPageResponse(result));
    }

    @PostMapping
    public ResponseEntity<ProductSchema> create(@Valid @RequestBody CreateSchemaRequest request) {
        ProductSchema schema = schemaService.create(
                request.name(), request.version(), request.description(),
                request.schemaDef(), request.attributeGroups(),
                request.parentId(), request.userId()
        );
        return ResponseEntity.ok(schema);
    }

    @PostMapping("/{id}/new-version")
    public ResponseEntity<ProductSchema> createNewVersion(
            @PathVariable UUID id,
            @Valid @RequestBody NewVersionRequest request) {
        ProductSchema schema = schemaService.createNewVersion(id, request.newVersion(),
                request.schemaDef(), request.userId());
        return ResponseEntity.ok(schema);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductSchema> update(
            @PathVariable UUID id,
            @RequestBody UpdateSchemaRequest request) {
        ProductSchema schema = schemaService.update(id, request.description(),
                request.schemaDef(), request.attributeGroups());
        return ResponseEntity.ok(schema);
    }

    @PostMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable UUID id) {
        schemaService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

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
