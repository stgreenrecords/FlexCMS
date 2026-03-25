package com.flexcms.publish.controller;

import com.flexcms.core.model.Site;
import com.flexcms.core.repository.SiteRepository;
import com.flexcms.multisite.model.SiteContext;
import com.flexcms.multisite.service.SiteResolver;
import com.flexcms.headless.service.SitemapService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Serves sitemap.xml, sitemap-index.xml, and robots.txt for the publish tier.
 *
 * <p>The site and locale are resolved from the incoming request's domain/host header
 * via {@link SiteResolver}. The public base URL is derived from the request scheme and host.</p>
 */
@RestController
public class SitemapController {

    @Autowired
    private SitemapService sitemapService;

    @Autowired
    private SiteResolver siteResolver;

    @Autowired
    private SiteRepository siteRepository;

    /**
     * Serve sitemap.xml for the default locale (no locale prefix in URLs).
     */
    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> getSitemap(HttpServletRequest request) {
        SiteContext ctx = siteResolver.resolve(request);
        if (ctx == null) {
            return ResponseEntity.notFound().build();
        }

        Site site = siteRepository.findById(ctx.getSiteId()).orElse(null);
        if (site == null) {
            return ResponseEntity.notFound().build();
        }

        boolean isDefaultLocale = ctx.getLocale().equals(site.getDefaultLocale());
        String baseUrl = buildBaseUrl(request);
        String xml = sitemapService.buildSitemap(ctx.getSiteId(), ctx.getLocale(), baseUrl, isDefaultLocale);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_XML)
                .body(xml);
    }

    /**
     * Serve sitemap-index.xml listing per-locale sitemaps.
     */
    @GetMapping(value = "/sitemap-index.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> getSitemapIndex(HttpServletRequest request) {
        SiteContext ctx = siteResolver.resolve(request);
        if (ctx == null) {
            return ResponseEntity.notFound().build();
        }

        Site site = siteRepository.findById(ctx.getSiteId()).orElse(null);
        if (site == null) {
            return ResponseEntity.notFound().build();
        }

        List<String> locales = site.getSupportedLocales();
        String baseUrl = buildBaseUrl(request);
        String xml = sitemapService.buildSitemapIndex(ctx.getSiteId(), locales, baseUrl);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_XML)
                .body(xml);
    }

    /**
     * Serve robots.txt with default disallow rules and optional site-level overrides.
     */
    @GetMapping(value = "/robots.txt", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> getRobots(HttpServletRequest request) {
        SiteContext ctx = siteResolver.resolve(request);
        if (ctx == null) {
            // Return a permissive default when no site context is found
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_PLAIN)
                    .body("User-agent: *\nAllow: /\n");
        }

        String baseUrl = buildBaseUrl(request);
        String robots = sitemapService.buildRobots(ctx.getSiteId(), baseUrl);
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .body(robots);
    }

    private String buildBaseUrl(HttpServletRequest request) {
        String scheme = request.getScheme();
        String host = request.getServerName();
        int port = request.getServerPort();

        if (("http".equals(scheme) && port == 80) || ("https".equals(scheme) && port == 443)) {
            return scheme + "://" + host;
        }
        return scheme + "://" + host + ":" + port;
    }
}
