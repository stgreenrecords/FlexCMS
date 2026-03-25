package com.flexcms.headless.controller;

import com.flexcms.headless.service.SitemapService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST API for sitemap entries — used by headless frontend frameworks
 * that need to enumerate all published pages for static generation or dynamic routing.
 *
 * <p>Returns structured JSON rather than XML; the XML format is served by
 * {@code SitemapController} in {@code flexcms-publish}.</p>
 */
@Tag(name = "Headless Sitemap", description = "Sitemap entries for headless static-site generation")
@RestController
@RequestMapping("/api/content/v1/sitemap")
public class SitemapApiController {

    @Autowired
    private SitemapService sitemapService;

    /**
     * Get all sitemap-eligible pages for a site and locale.
     *
     * @param siteId the site identifier
     * @param locale the content locale (e.g., {@code en}, {@code fr})
     * @return list of sitemap entries with url, title, lastModified, and priority
     */
    @GetMapping("/{siteId}/{locale}")
    public ResponseEntity<List<SitemapService.SitemapEntry>> getSitemapEntries(
            @PathVariable String siteId,
            @PathVariable String locale) {

        List<SitemapService.SitemapEntry> entries = sitemapService.getSitemapEntries(siteId, locale);
        return ResponseEntity.ok(entries);
    }
}
