package com.flexcms.author.controller;

import com.flexcms.core.model.DomainMapping;
import com.flexcms.core.model.Site;
import com.flexcms.i18n.service.TranslationService;
import com.flexcms.multisite.service.SiteManagementService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Author-side REST API for site administration.
 */
@RestController
@RequestMapping("/api/admin/sites")
public class SiteAdminController {

    @Autowired
    private SiteManagementService siteService;

    @Autowired
    private TranslationService translationService;

    /**
     * Create a new site.
     */
    @PostMapping
    public ResponseEntity<Site> createSite(@Valid @RequestBody CreateSiteRequest request) {
        Site site = siteService.createSite(
                request.siteId(), request.title(), request.defaultLocale(),
                request.supportedLocales(), request.userId());
        return ResponseEntity.ok(site);
    }

    /**
     * List all sites.
     */
    @GetMapping
    public ResponseEntity<List<Site>> listSites() {
        return ResponseEntity.ok(siteService.listSites());
    }

    /**
     * Get a summary of a specific site.
     */
    @GetMapping("/{siteId}")
    public ResponseEntity<Map<String, Object>> getSiteSummary(@PathVariable String siteId) {
        return ResponseEntity.ok(siteService.getSiteSummary(siteId));
    }

    /**
     * Add a domain to a site.
     */
    @PostMapping("/{siteId}/domains")
    public ResponseEntity<DomainMapping> addDomain(
            @PathVariable String siteId,
            @Valid @RequestBody AddDomainRequest request) {
        return ResponseEntity.ok(siteService.addDomain(siteId, request.domain(), request.primary()));
    }

    /**
     * Add a language to a site by copying from an existing locale.
     */
    @PostMapping("/{siteId}/languages/{locale}")
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
