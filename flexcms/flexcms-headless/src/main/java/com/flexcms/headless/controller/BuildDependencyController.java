package com.flexcms.headless.controller;

import com.flexcms.core.service.BuildDependencyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST API for managing the static-build dependency graph.
 *
 * <p>These endpoints are called exclusively by the {@code build-worker} process —
 * they are not part of the public content-delivery API. Authentication is required
 * (ADMIN or CONTENT_PUBLISHER role).
 *
 * <h3>Workflow</h3>
 * <ol>
 *   <li>After rendering and uploading a page, the build worker POSTs to
 *       {@code /api/build/v1/dependencies} to record which components,
 *       assets and navigation entries the page depends on.</li>
 *   <li>When a replication event arrives for an asset or component, the build
 *       worker GETs {@code /api/build/v1/dependencies/pages} to find which
 *       pages must be recompiled.</li>
 *   <li>On DEACTIVATE / DELETE events the build worker DELETEs the stale
 *       dependency entries so they do not trigger false rebuilds.</li>
 * </ol>
 */
@Tag(name = "Build Dependencies",
     description = "Dependency graph management for incremental static site compilation")
@Validated
@RestController
@RequestMapping("/api/build/v1")
public class BuildDependencyController {

    @Autowired
    private BuildDependencyService buildDependencyService;

    // ─── Record dependencies ────────────────────────────────────────────────

    /**
     * Record (or replace) all dependency edges for a compiled page.
     *
     * <p>The build worker calls this after successfully rendering a page and
     * uploading it to S3. The existing edge set is atomically replaced with
     * the new one, so stale references are automatically cleaned up.
     *
     * @param request body containing siteId, locale, pagePath, and dependency list
     */
    @Operation(summary = "Record page dependency graph",
               description = "Atomically replaces all dependency edges for a compiled page. " +
                             "Called by the build worker after a successful render + upload.")
    @PostMapping("/dependencies")
    @PreAuthorize("hasAnyRole('ADMIN', 'CONTENT_PUBLISHER')")
    public ResponseEntity<Void> recordDependencies(
            @Valid @RequestBody RecordDependenciesRequest request) {

        List<BuildDependencyService.DependencyRecord> deps = request.dependencies().stream()
                .map(d -> new BuildDependencyService.DependencyRecord(d.type(), d.key()))
                .toList();

        buildDependencyService.recordPageDependencies(
                request.siteId(), request.locale(), request.pagePath(), deps);

        return ResponseEntity.ok().build();
    }

    // ─── Query affected pages ───────────────────────────────────────────────

    /**
     * Find all pages that depend on a given resource key.
     *
     * <p>Called by the build worker's {@code DependencyResolver} when it receives
     * an ASSET or COMPONENT change event and needs to know which pages to rebuild.
     *
     * @param siteId the site scope
     * @param locale the locale scope
     * @param type   dependency type — {@code ASSET}, {@code COMPONENT}, or {@code NAVIGATION}
     * @param key    the resource key (asset path, component resource type, or {@code nav})
     * @return list of content-tree page paths that must be recompiled
     */
    @Operation(summary = "Find pages affected by a dependency change",
               description = "Returns the page paths that depend on the specified resource key. " +
                             "Used by the build worker to resolve which pages need recompilation.")
    @GetMapping("/dependencies/pages")
    @PreAuthorize("hasAnyRole('ADMIN', 'CONTENT_PUBLISHER')")
    public ResponseEntity<List<String>> findAffectedPages(
            @Parameter(description = "Site identifier") @RequestParam @NotBlank String siteId,
            @Parameter(description = "Locale code, e.g. en") @RequestParam @NotBlank String locale,
            @Parameter(description = "Dependency type: ASSET, COMPONENT, or NAVIGATION")
            @RequestParam @NotBlank String type,
            @Parameter(description = "Resource key, e.g. /dam/images/logo.svg or flexcms/shared-header")
            @RequestParam @NotBlank String key) {

        List<String> pages = buildDependencyService.findAffectedPages(siteId, locale, type, key);
        return ResponseEntity.ok(pages);
    }

    /**
     * Find all pages that have any dependency of a given type.
     *
     * <p>Used to handle NAVIGATION change events, where every page with a
     * navigation dependency must be recompiled.
     */
    @Operation(summary = "Find all pages with a dependency of the given type")
    @GetMapping("/dependencies/pages/by-type")
    @PreAuthorize("hasAnyRole('ADMIN', 'CONTENT_PUBLISHER')")
    public ResponseEntity<List<String>> findPagesByDependencyType(
            @RequestParam @NotBlank String siteId,
            @RequestParam @NotBlank String locale,
            @RequestParam @NotBlank String type) {

        List<String> pages = buildDependencyService.findPagesByDependencyType(siteId, locale, type);
        return ResponseEntity.ok(pages);
    }

    /**
     * Get the recorded dependency graph for a specific page.
     * Useful for admin diagnostics and debugging incremental build issues.
     */
    @Operation(summary = "Get all dependencies for a specific page")
    @GetMapping("/dependencies")
    @PreAuthorize("hasAnyRole('ADMIN', 'CONTENT_PUBLISHER')")
    public ResponseEntity<List<BuildDependencyService.DependencyRecord>> getPageDependencies(
            @RequestParam @NotBlank String siteId,
            @RequestParam @NotBlank String locale,
            @RequestParam @NotBlank String pagePath) {

        List<BuildDependencyService.DependencyRecord> deps =
                buildDependencyService.getDependenciesForPage(siteId, locale, pagePath);
        return ResponseEntity.ok(deps);
    }

    // ─── Remove dependencies ────────────────────────────────────────────────

    /**
     * Remove dependency edges for a deactivated or deleted page.
     *
     * <p>Prevents stale edges from triggering unnecessary rebuilds after a page
     * has been taken offline.
     */
    @Operation(summary = "Remove dependency edges for a page",
               description = "Called by the build worker when a page is deactivated or deleted.")
    @DeleteMapping("/dependencies/{siteId}/{locale}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CONTENT_PUBLISHER')")
    public ResponseEntity<Void> removeDependencies(
            @PathVariable String siteId,
            @PathVariable String locale,
            @RequestParam @NotBlank String pagePath) {

        buildDependencyService.removePageDependencies(siteId, locale, pagePath);
        return ResponseEntity.noContent().build();
    }

    /**
     * Remove all dependency edges for an entire site+locale.
     * Called when starting a full site rebuild or removing a locale.
     */
    @Operation(summary = "Remove all dependency edges for a site+locale")
    @DeleteMapping("/dependencies/{siteId}/{locale}/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> removeSiteLocaleDependencies(
            @PathVariable String siteId,
            @PathVariable String locale) {

        buildDependencyService.removeSiteLocaleDependencies(siteId, locale);
        return ResponseEntity.noContent().build();
    }

    // ─── Request / Response types ───────────────────────────────────────────

    /** Request body for POST /api/build/v1/dependencies */
    public record RecordDependenciesRequest(
            @NotBlank String siteId,
            @NotBlank String locale,
            @NotBlank String pagePath,
            @NotNull  List<DependencyEntry> dependencies
    ) {}

    /** A single dependency entry within a {@link RecordDependenciesRequest}. */
    public record DependencyEntry(
            @NotBlank String type,
            @NotBlank String key
    ) {}
}

