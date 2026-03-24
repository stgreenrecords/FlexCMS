package com.flexcms.multisite.service;

import com.flexcms.core.model.DomainMapping;
import com.flexcms.core.model.Site;
import com.flexcms.core.repository.DomainMappingRepository;
import com.flexcms.core.repository.SiteRepository;
import com.flexcms.multisite.model.SiteContext;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Locale;

/**
 * Resolves the site and locale context from an incoming HTTP request
 * based on domain mappings and URL path.
 */
@Service
public class SiteResolver {

    @Autowired
    private SiteRepository siteRepository;

    @Autowired
    private DomainMappingRepository domainMappingRepo;

    /**
     * Resolve site context from request domain and path.
     */
    @Cacheable(value = "site-resolution", key = "#request.serverName + ':' + #request.requestURI")
    public SiteContext resolve(HttpServletRequest request) {
        String host = request.getServerName();
        String path = request.getRequestURI();

        // 1. Find domain mapping
        DomainMapping mapping = domainMappingRepo.findByDomain(host)
                .orElse(null);

        if (mapping == null) {
            // Fallback: try to resolve from X-FlexCMS-Site header
            String siteHeader = request.getHeader("X-FlexCMS-Site");
            if (siteHeader != null) {
                return resolveFromSiteId(siteHeader, path, request);
            }
            return null;
        }

        // 2. Load site
        Site site = siteRepository.findById(mapping.getSiteId()).orElse(null);
        if (site == null) return null;

        // 3. Resolve locale
        String locale = resolveLocale(mapping, site, path, request);

        // 4. Build context
        return SiteContext.builder()
                .siteId(site.getSiteId())
                .locale(locale)
                .domain(host)
                .contentRoot(site.getContentRoot() + "/" + locale)
                .damRoot(site.getDamRoot())
                .configRoot(site.getConfigRoot())
                .build();
    }

    /**
     * Resolve from explicit site ID (for API calls).
     */
    public SiteContext resolveFromSiteId(String siteId, String path, HttpServletRequest request) {
        Site site = siteRepository.findById(siteId).orElse(null);
        if (site == null) return null;

        String locale = site.getDefaultLocale();

        // Try path-based locale resolution
        if (site.getSupportedLocales() != null) {
            for (String loc : site.getSupportedLocales()) {
                if (path.startsWith("/" + loc + "/") || path.equals("/" + loc)) {
                    locale = loc;
                    break;
                }
            }
        }

        // Try header override
        String localeHeader = request.getHeader("X-FlexCMS-Locale");
        if (localeHeader != null && site.getSupportedLocales() != null
                && site.getSupportedLocales().contains(localeHeader)) {
            locale = localeHeader;
        }

        return SiteContext.builder()
                .siteId(siteId)
                .locale(locale)
                .domain(request.getServerName())
                .contentRoot(site.getContentRoot() + "/" + locale)
                .damRoot(site.getDamRoot())
                .configRoot(site.getConfigRoot())
                .build();
    }

    private String resolveLocale(DomainMapping mapping, Site site, String path, HttpServletRequest request) {
        // Strategy 1: Domain-level locale
        if (mapping.getLocale() != null) {
            return mapping.getLocale();
        }

        // Strategy 2: Path prefix
        if (site.getSupportedLocales() != null) {
            for (String locale : site.getSupportedLocales()) {
                String prefix = mapping.getPathPrefix() != null ? mapping.getPathPrefix() : "";
                if (path.startsWith(prefix + "/" + locale + "/") || path.equals(prefix + "/" + locale)) {
                    return locale;
                }
            }
        }

        // Strategy 3: Accept-Language header
        String acceptLang = request.getHeader("Accept-Language");
        if (acceptLang != null && site.getSupportedLocales() != null) {
            try {
                var ranges = Locale.LanguageRange.parse(acceptLang);
                for (var range : ranges) {
                    String lang = range.getRange().length() >= 2
                            ? range.getRange().substring(0, 2) : range.getRange();
                    if (site.getSupportedLocales().contains(lang)) {
                        return lang;
                    }
                }
            } catch (Exception ignored) {}
        }

        // Fallback: site default
        return site.getDefaultLocale();
    }
}

