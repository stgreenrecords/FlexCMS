package com.flexcms.author.controller;

import com.flexcms.core.model.DomainMapping;
import com.flexcms.core.model.Site;
import com.flexcms.i18n.service.TranslationService;
import com.flexcms.multisite.service.SiteManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Author-side REST API for site administration.
 * All site-management operations require at minimum ADMIN role.
 */
@Tag(name = "Admin Sites", description = "Site administration — create sites, manage domains and language copies (ADMIN only)")
@ConditionalOnProperty(name = "flexcms.runmode", havingValue = "author", matchIfMissing = true)
@RestController
@RequestMapping("/api/admin/sites")
public class SiteAdminController {

    @Autowired
    private SiteManagementService siteService;

    @Autowired
    private TranslationService translationService;

    @Operation(summary = "Create site", description = "Creates a new site with its root content tree and locale structure.")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Site> createSite(@Valid @RequestBody CreateSiteRequest request) {
        Site site = siteService.createSite(
                request.siteId(), request.title(), request.defaultLocale(),
                request.supportedLocales(), request.userId());
        return ResponseEntity.ok(site);
    }

    @Operation(summary = "List sites", description = "Returns all registered sites.")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR','CONTENT_REVIEWER','CONTENT_PUBLISHER')")
    public ResponseEntity<List<Site>> listSites() {
        return ResponseEntity.ok(siteService.listSites());
    }

    @Operation(summary = "Get site summary", description = "Returns a summary for a specific site including page count and locale info.")
    @GetMapping("/{siteId}")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR','CONTENT_REVIEWER','CONTENT_PUBLISHER')")
    public ResponseEntity<Map<String, Object>> getSiteSummary(@PathVariable String siteId) {
        return ResponseEntity.ok(siteService.getSiteSummary(siteId));
    }

    @Operation(summary = "Add domain", description = "Adds a domain mapping to a site.")
    @PostMapping("/{siteId}/domains")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DomainMapping> addDomain(
            @PathVariable String siteId,
            @Valid @RequestBody AddDomainRequest request) {
        return ResponseEntity.ok(siteService.addDomain(siteId, request.domain(), request.primary()));
    }

    @Operation(summary = "Add language", description = "Adds a language to a site by creating a language copy from an existing locale.")
    @PostMapping("/{siteId}/languages/{locale}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TranslationService.LanguageCopyResult> addLanguage(
            @PathVariable String siteId,
            @PathVariable String locale,
            @RequestParam(defaultValue = "en") String sourceLocale) {
        String sourcePath = "content." + siteId + "." + sourceLocale;
        var result = translationService.createLanguageCopy(sourcePath, sourceLocale, locale);
        return ResponseEntity.ok(result);
    }

    public record CreateSiteRequest(
            @NotBlank(message = "siteId is required") String siteId,
            @NotBlank(message = "title is required") String title,
            @NotBlank(message = "defaultLocale is required") String defaultLocale,
            @NotEmpty(message = "at least one supportedLocale is required") List<String> supportedLocales,
            @NotBlank(message = "userId is required") String userId) {}

    public record AddDomainRequest(
            @NotBlank(message = "domain is required") String domain,
            boolean primary) {}
}
