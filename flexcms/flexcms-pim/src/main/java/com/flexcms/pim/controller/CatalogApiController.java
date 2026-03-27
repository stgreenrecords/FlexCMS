package com.flexcms.pim.controller;

import com.flexcms.pim.model.Catalog;
import com.flexcms.pim.service.CatalogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
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
 * PIM Catalog REST API.
 *
 * <p>Catalogs group products by year/season and go through a lifecycle:
 * DRAFT → ACTIVE → ARCHIVED.</p>
 */
@Tag(name = "PIM Catalogs", description = "Catalog management — create, activate, archive, and delete product catalogs")
@RestController
@RequestMapping("/api/pim/v1/catalogs")
public class CatalogApiController {

    @Autowired
    private CatalogService catalogService;

    @Operation(summary = "List catalogs", description = "Returns paginated catalogs, optionally filtered by year.")
    @GetMapping
    public ResponseEntity<Map<String, Object>> listAll(
            @RequestParam(required = false) Integer year,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int clampedSize = Math.min(size, 100);
        PageRequest pageable = PageRequest.of(page, clampedSize);
        Page<Catalog> result = year != null
                ? catalogService.listByYear(year, pageable)
                : catalogService.listAll(pageable);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("items", result.getContent());
        response.put("totalCount", result.getTotalElements());
        response.put("page", result.getNumber());
        response.put("size", result.getSize());
        response.put("hasNextPage", result.hasNext());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get catalog by ID", description = "Returns a single catalog by its UUID.")
    @GetMapping("/{id}")
    public ResponseEntity<Catalog> getById(@PathVariable UUID id) {
        return catalogService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Create catalog", description = "Creates a new product catalog for a given year and season.")
    @PostMapping
    public ResponseEntity<Catalog> create(@Valid @RequestBody CreateCatalogRequest request) {
        Catalog catalog = catalogService.create(
                request.name(), request.year(), request.season(), request.description(),
                request.schemaId(), request.settings(), request.userId()
        );
        return ResponseEntity.ok(catalog);
    }

    @Operation(summary = "Update catalog", description = "Updates a catalog's name, description, and settings.")
    @PutMapping("/{id}")
    public ResponseEntity<Catalog> update(
            @PathVariable UUID id,
            @RequestBody UpdateCatalogRequest request) {
        Catalog catalog = catalogService.update(id, request.name(),
                request.description(), request.settings());
        return ResponseEntity.ok(catalog);
    }

    @Operation(summary = "Activate catalog", description = "Transitions a catalog from DRAFT to ACTIVE status.")
    @PostMapping("/{id}/activate")
    public ResponseEntity<Catalog> activate(@PathVariable UUID id) {
        return ResponseEntity.ok(catalogService.activate(id));
    }

    @Operation(summary = "Archive catalog", description = "Archives a catalog — no further modifications allowed.")
    @PostMapping("/{id}/archive")
    public ResponseEntity<Catalog> archive(@PathVariable UUID id) {
        return ResponseEntity.ok(catalogService.archive(id));
    }

    @Operation(summary = "Delete catalog", description = "Permanently deletes a catalog and all its products.")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        catalogService.delete(id);
        return ResponseEntity.noContent().build();
    }

    public record CreateCatalogRequest(
            @NotBlank(message = "name is required") String name,
            @Min(value = 2000, message = "year must be 2000 or later") int year,
            String season,
            String description,
            @NotNull(message = "schemaId is required") UUID schemaId,
            Map<String, Object> settings,
            @NotBlank(message = "userId is required") String userId) {}

    public record UpdateCatalogRequest(
            String name,
            String description,
            Map<String, Object> settings) {}
}
