package com.flexcms.headless.controller;

import com.flexcms.search.service.SearchIndexService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * REST API for full-text search with optional faceted filtering.
 *
 * <p>Two endpoints:</p>
 * <ul>
 *   <li>{@code GET /api/content/v1/search} — basic full-text search</li>
 *   <li>{@code GET /api/content/v1/search/facets} — full-text search with aggregation facets</li>
 * </ul>
 */
@Tag(name = "Headless Search", description = "Full-text search across content and assets")
@Validated
@RestController
@RequestMapping("/api/content/v1/search")
public class SearchApiController {

    @Autowired
    private SearchIndexService searchService;

    /**
     * Basic full-text search — returns paginated hits without facet counts.
     */
    @Operation(summary = "Full-text search",
               description = "Search published content by keyword across title, description, and body text.")
    @GetMapping
    public ResponseEntity<SearchIndexService.SearchResult> search(
            @Parameter(description = "Search query string", required = true)
            @NotBlank(message = "query parameter 'q' is required") @RequestParam String q,
            @Parameter(description = "Site ID to scope results")
            @RequestParam(required = false) String site,
            @Parameter(description = "Locale filter (e.g. en, de)")
            @RequestParam(required = false) String locale,
            @Min(0) @RequestParam(defaultValue = "0") int page,
            @Min(1) @Max(100) @RequestParam(defaultValue = "20") int size) {

        var result = searchService.search(q, site, locale, PageRequest.of(page, size));
        return ResponseEntity.ok(result);
    }

    /**
     * Faceted search — returns paginated hits plus term-bucket aggregations for
     * {@code resourceType}, {@code locale}, and {@code template}.
     *
     * <p>Use the facet counts to render filter navigation. The optional
     * {@code resourceType} and {@code template} query parameters narrow results
     * in addition to being reflected in the aggregation buckets.</p>
     */
    @Operation(summary = "Faceted full-text search",
               description = "Search with aggregation facets for content type, locale, and template filtering.")
    @GetMapping("/facets")
    public ResponseEntity<SearchIndexService.FacetedSearchResult> searchWithFacets(
            @Parameter(description = "Search query string", required = true)
            @NotBlank(message = "query parameter 'q' is required") @RequestParam String q,
            @Parameter(description = "Site ID to scope results")
            @RequestParam(required = false) String site,
            @Parameter(description = "Locale filter (e.g. en, de)")
            @RequestParam(required = false) String locale,
            @Parameter(description = "Content type filter (e.g. flexcms/page, flexcms/blog-post)")
            @RequestParam(required = false) String resourceType,
            @Parameter(description = "Template name filter (e.g. blog-post, landing-page)")
            @RequestParam(required = false) String template,
            @Min(0) @RequestParam(defaultValue = "0") int page,
            @Min(1) @Max(100) @RequestParam(defaultValue = "20") int size) {

        var result = searchService.searchWithFacets(
                q, site, locale, resourceType, template, PageRequest.of(page, size));
        return ResponseEntity.ok(result);
    }
}

