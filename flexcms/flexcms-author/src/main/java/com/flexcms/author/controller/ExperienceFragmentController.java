package com.flexcms.author.controller;

import com.flexcms.author.service.ExperienceFragmentService;
import com.flexcms.core.model.ContentNode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Author-side REST API for managing Experience Fragments.
 *
 * <p>All endpoints require at minimum {@code CONTENT_AUTHOR} role.
 * Delete operations require {@code ADMIN} or {@code CONTENT_AUTHOR}.
 *
 * <p>Base URL: {@code /api/author/xf}
 */
@Tag(name = "Experience Fragments", description = "Create, manage, and delete Experience Fragments and their variations")
@ConditionalOnProperty(name = "flexcms.runmode", havingValue = "author", matchIfMissing = true)
@RestController
@RequestMapping("/api/author/xf")
public class ExperienceFragmentController {

    @Autowired
    private ExperienceFragmentService xfService;

    // =========================================================================
    // Experience Fragment CRUD
    // =========================================================================

    /**
     * Create a new Experience Fragment.
     *
     * <p>Example request body:
     * <pre>
     * {
     *   "siteId":      "wknd",
     *   "locale":      "en",
     *   "category":    "site",
     *   "name":        "header",
     *   "title":       "Site Header",
     *   "description": "Global site header with navigation",
     *   "userId":      "admin"
     * }
     * </pre>
     */
    @Operation(summary = "Create a new Experience Fragment")
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR')")
    public ResponseEntity<ContentNode> createExperienceFragment(
            @Valid @RequestBody CreateXfRequest request) {

        ContentNode xf = xfService.createExperienceFragment(
                request.siteId(), request.locale(),
                request.category(), request.name(),
                request.title(), request.description(),
                request.userId());
        return ResponseEntity.ok(xf);
    }

    /**
     * List all Experience Fragments for a site/locale.
     */
    @Operation(summary = "List Experience Fragments for a site and locale")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR','CONTENT_REVIEWER','CONTENT_PUBLISHER')")
    public ResponseEntity<List<Map<String, Object>>> listExperienceFragments(
            @RequestParam @NotBlank String siteId,
            @RequestParam @NotBlank String locale) {

        return ResponseEntity.ok(xfService.listExperienceFragments(siteId, locale));
    }

    /**
     * Get an Experience Fragment by its dot-path (returns folder node + variation list).
     */
    @Operation(summary = "Get an Experience Fragment with its variations")
    @GetMapping("/{*xfPath}")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR','CONTENT_REVIEWER','CONTENT_PUBLISHER')")
    public ResponseEntity<Map<String, Object>> getExperienceFragment(
            @PathVariable String xfPath) {

        // Normalise: strip leading slash that Spring may inject
        String path = xfPath.startsWith("/") ? xfPath.substring(1).replace('/', '.') : xfPath;

        ContentNode folder = xfService.getExperienceFragment(path)
                .orElseThrow(() -> new com.flexcms.core.exception.NotFoundException(
                        "Experience Fragment not found: " + path));

        List<ContentNode> variations = xfService.listVariations(path);

        return ResponseEntity.ok(Map.of(
                "xf",         folder,
                "variations", variations
        ));
    }

    /**
     * Delete an entire Experience Fragment and all its variations.
     */
    @Operation(summary = "Delete an Experience Fragment and all its variations")
    @DeleteMapping("/{*xfPath}")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR')")
    public ResponseEntity<Void> deleteExperienceFragment(
            @PathVariable String xfPath,
            @RequestParam @NotBlank String userId) {

        String path = xfPath.startsWith("/") ? xfPath.substring(1).replace('/', '.') : xfPath;
        xfService.deleteExperienceFragment(path, userId);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // Variation CRUD
    // =========================================================================

    /**
     * Add a variation to an existing Experience Fragment.
     *
     * <p>Example request body:
     * <pre>
     * {
     *   "variationType": "master",
     *   "title":         "Master Variation",
     *   "userId":        "admin"
     * }
     * </pre>
     */
    @Operation(summary = "Add a variation to an Experience Fragment")
    @PostMapping("/variations")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR')")
    public ResponseEntity<ContentNode> addVariation(
            @RequestParam @NotBlank String path,
            @Valid @RequestBody AddVariationRequest request) {

        String normPath = path.startsWith("/") ? path.substring(1).replace('/', '.') : path;
        ContentNode variation = xfService.addVariation(normPath, request.variationType(),
                request.title(), request.userId());
        return ResponseEntity.ok(variation);
    }

    /**
     * List variations of an Experience Fragment.
     */
    @Operation(summary = "List all variations of an Experience Fragment")
    @GetMapping("/variations")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR','CONTENT_REVIEWER','CONTENT_PUBLISHER')")
    public ResponseEntity<List<ContentNode>> listVariations(@RequestParam @NotBlank String path) {
        String normPath = path.startsWith("/") ? path.substring(1).replace('/', '.') : path;
        return ResponseEntity.ok(xfService.listVariations(normPath));
    }

    /**
     * Delete a specific variation of an Experience Fragment.
     */
    @Operation(summary = "Delete a specific variation")
    @DeleteMapping("/variation/{variationType}")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR')")
    public ResponseEntity<Void> deleteVariation(
            @RequestParam @NotBlank String path,
            @PathVariable String variationType,
            @RequestParam @NotBlank String userId) {

        String normPath = path.startsWith("/") ? path.substring(1).replace('/', '.') : path;
        xfService.deleteVariation(normPath, variationType, userId);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // Request records
    // =========================================================================

    public record CreateXfRequest(
            @NotBlank String siteId,
            @NotBlank String locale,
            String category,           // optional grouping (e.g. "site", "adventures")
            @NotBlank String name,
            @NotBlank String title,
            String description,
            @NotBlank String userId
    ) {}

    public record AddVariationRequest(
            @NotBlank String variationType,  // e.g. "master", "mobile", "email"
            String title,
            @NotBlank String userId
    ) {}
}

