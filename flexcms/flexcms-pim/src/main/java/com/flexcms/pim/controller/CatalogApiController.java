package com.flexcms.pim.controller;

import com.flexcms.pim.model.Catalog;
import com.flexcms.pim.service.CatalogService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * PIM Catalog REST API.
 *
 * <p>Catalogs group products by year/season and go through a lifecycle:
 * DRAFT → ACTIVE → ARCHIVED.</p>
 */
@RestController
@RequestMapping("/api/pim/v1/catalogs")
public class CatalogApiController {

    @Autowired
    private CatalogService catalogService;

    @GetMapping
    public ResponseEntity<List<Catalog>> listAll(
            @RequestParam(required = false) Integer year) {
        List<Catalog> result = year != null
                ? catalogService.listByYear(year)
                : catalogService.listAll();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Catalog> getById(@PathVariable UUID id) {
        return catalogService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Catalog> create(@Valid @RequestBody CreateCatalogRequest request) {
        Catalog catalog = catalogService.create(
                request.name(), request.year(), request.season(), request.description(),
                request.schemaId(), request.settings(), request.userId()
        );
        return ResponseEntity.ok(catalog);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Catalog> update(
            @PathVariable UUID id,
            @RequestBody UpdateCatalogRequest request) {
        Catalog catalog = catalogService.update(id, request.name(),
                request.description(), request.settings());
        return ResponseEntity.ok(catalog);
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<Catalog> activate(@PathVariable UUID id) {
        return ResponseEntity.ok(catalogService.activate(id));
    }

    @PostMapping("/{id}/archive")
    public ResponseEntity<Catalog> archive(@PathVariable UUID id) {
        return ResponseEntity.ok(catalogService.archive(id));
    }

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
