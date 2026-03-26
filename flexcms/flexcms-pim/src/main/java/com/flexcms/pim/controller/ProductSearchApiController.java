package com.flexcms.pim.controller;

import com.flexcms.pim.service.ProductIndexRebuildService;
import com.flexcms.pim.service.ProductSearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * REST API for PIM product full-text search and index management.
 *
 * <p>Backed by the {@code flexcms-products} Elasticsearch index.</p>
 */
@RestController
@RequestMapping("/api/pim/v1/search")
@Tag(name = "PIM Search", description = "Full-text product search and index management")
public class ProductSearchApiController {

    @Autowired
    private ProductSearchService productSearchService;

    @Autowired
    private ProductIndexRebuildService productIndexRebuildService;

    // -------------------------------------------------------------------------
    // Search
    // -------------------------------------------------------------------------

    @GetMapping
    @Operation(summary = "Full-text search across products")
    public ResponseEntity<?> search(
            @Parameter(description = "Free-text query") @RequestParam String q,
            @Parameter(description = "Filter by catalog ID") @RequestParam(required = false) String catalogId,
            @Parameter(description = "Filter by status (e.g. PUBLISHED)") @RequestParam(required = false) String status,
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {

        ProductSearchService.ProductSearchResult result =
                productSearchService.search(q, catalogId, status, PageRequest.of(page, size));
        return ResponseEntity.ok(result);
    }

    @GetMapping("/facets")
    @Operation(summary = "Full-text search with facet aggregations by status and catalog")
    public ResponseEntity<?> searchWithFacets(
            @Parameter(description = "Free-text query") @RequestParam String q,
            @Parameter(description = "Filter by catalog ID") @RequestParam(required = false) String catalogId,
            @Parameter(description = "Filter by status") @RequestParam(required = false) String status,
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {

        ProductSearchService.ProductFacetedSearchResult result =
                productSearchService.searchWithFacets(q, catalogId, status, PageRequest.of(page, size));
        return ResponseEntity.ok(result);
    }

    // -------------------------------------------------------------------------
    // Index rebuild
    // -------------------------------------------------------------------------

    @PostMapping("/reindex/catalog/{catalogId}")
    @Operation(summary = "Reindex all products in a catalog")
    public ResponseEntity<?> reindexCatalog(
            @Parameter(description = "Catalog UUID") @PathVariable UUID catalogId) {
        int count = productIndexRebuildService.rebuildCatalog(catalogId);
        return ResponseEntity.ok(Map.of("indexed", count, "catalogId", catalogId));
    }

    @PostMapping("/reindex/catalog/{catalogId}/purge")
    @Operation(summary = "Purge and reindex all products in a catalog")
    public ResponseEntity<?> purgeAndReindexCatalog(
            @Parameter(description = "Catalog UUID") @PathVariable UUID catalogId) {
        int count = productIndexRebuildService.purgeAndRebuildCatalog(catalogId);
        return ResponseEntity.ok(Map.of("indexed", count, "catalogId", catalogId));
    }

    @PostMapping("/reindex/all")
    @Operation(summary = "Reindex all products across all catalogs")
    public ResponseEntity<?> reindexAll() {
        int count = productIndexRebuildService.rebuildAll();
        return ResponseEntity.ok(Map.of("indexed", count));
    }
}
