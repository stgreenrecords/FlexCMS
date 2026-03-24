package com.flexcms.author.controller;

import com.flexcms.core.model.DomainMapping;
import com.flexcms.core.model.Site;
import com.flexcms.i18n.service.TranslationService;
import com.flexcms.multisite.service.SiteManagementService;
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
    public ResponseEntity<Site> createSite(@RequestBody CreateSiteRequest request) {
        Site site = siteService.createSite(
                request.siteId(), request.title(), request.defaultLocale(),
                request.supportedLocales(), request.userId());
        return ResponseEntity.ok(site);
    }

    /**
     * List all sites with summary info.
     */
    @GetMapping
    public ResponseEntity<List<Site>> listSites() {
        return ResponseEntity.ok(siteService.listSites());
    }

    /**
     * Get site summary with page count and domains.
     */
    @GetMapping("/{siteId}")
    public ResponseEntity<Map<String, Object>> getSiteSummary(@PathVariable String siteId) {
        return ResponseEntity.ok(siteService.getSiteSummary(siteId));
    }

    /**
     * Add a domain mapping to a site.
     */
    @PostMapping("/{siteId}/domains")
    public ResponseEntity<DomainMapping> addDomain(
            @PathVariable String siteId,
            @RequestBody AddDomainRequest request) {
        return ResponseEntity.ok(siteService.addDomain(siteId, request.domain(), request.primary()));
    }

    /**
     * Add a new language to a site (creates full language copy).
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

    public record CreateSiteRequest(String siteId, String title, String defaultLocale,
                                     List<String> supportedLocales, String userId) {}
    public record AddDomainRequest(String domain, boolean primary) {}
}

