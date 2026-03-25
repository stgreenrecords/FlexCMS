package com.flexcms.headless.service;

import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.core.model.Site;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.core.repository.SiteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Generates XML sitemaps and robots.txt content for a FlexCMS site.
 *
 * <h3>Sitemap URL conventions</h3>
 * <ul>
 *   <li>{@code /sitemap.xml} — sitemap for the default locale (no locale prefix in URLs)</li>
 *   <li>{@code /sitemap-index.xml} — index listing per-locale sitemaps</li>
 *   <li>{@code /{locale}/sitemap.xml} — sitemap for a specific locale</li>
 * </ul>
 *
 * <h3>Content exclusion rules</h3>
 * Pages are excluded from the sitemap if:
 * <ul>
 *   <li>Status is not {@link NodeStatus#PUBLISHED}</li>
 *   <li>Resource type is not {@code flexcms/page}</li>
 *   <li>Property {@code hideInNav} is {@code true}</li>
 *   <li>Property {@code hideFromSitemap} is {@code true}</li>
 * </ul>
 */
@Service
public class SitemapService {

    private static final Logger log = LoggerFactory.getLogger(SitemapService.class);

    private static final String PAGE_RESOURCE_TYPE = "flexcms/page";
    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd").withZone(ZoneOffset.UTC);

    @Autowired
    private ContentNodeRepository nodeRepository;

    @Autowired
    private SiteRepository siteRepository;

    // -------------------------------------------------------------------------
    // Sitemap XML
    // -------------------------------------------------------------------------

    /**
     * Build a standard XML sitemap for a site/locale.
     *
     * @param siteId          the site identifier
     * @param locale          the content locale
     * @param baseUrl         public base URL, e.g., {@code https://example.com}
     * @param isDefaultLocale whether this locale's URLs omit the locale prefix
     * @return sitemap XML string (UTF-8)
     */
    @Transactional(readOnly = true)
    public String buildSitemap(String siteId, String locale, String baseUrl, boolean isDefaultLocale) {
        List<ContentNode> pages = collectSitemapPages(siteId, locale);
        String contentPrefix = "content." + siteId + "." + locale + ".";
        String localePrefix = isDefaultLocale ? "" : locale + "/";

        StringBuilder xml = new StringBuilder(pages.size() * 200);
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"\n");
        xml.append("        xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\n");
        xml.append("        xsi:schemaLocation=\"http://www.sitemaps.org/schemas/sitemap/0.9 ");
        xml.append("http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd\">\n");

        for (ContentNode page : pages) {
            String urlPath = contentPathToUrlPath(page.getPath(), contentPrefix, localePrefix);
            String loc = urlPath.isEmpty() ? baseUrl + "/" : baseUrl + "/" + urlPath;

            xml.append("  <url>\n");
            xml.append("    <loc>").append(escapeXml(loc)).append("</loc>\n");
            if (page.getModifiedAt() != null) {
                xml.append("    <lastmod>").append(DATE_FORMATTER.format(page.getModifiedAt())).append("</lastmod>\n");
            }
            xml.append("    <changefreq>weekly</changefreq>\n");
            xml.append("    <priority>").append(computePriority(urlPath)).append("</priority>\n");
            xml.append("  </url>\n");
        }

        xml.append("</urlset>");
        log.debug("Generated sitemap for site={}, locale={}: {} URLs", siteId, locale, pages.size());
        return xml.toString();
    }

    /**
     * Build a sitemap index that lists per-locale sitemaps.
     *
     * @param siteId   the site identifier
     * @param locales  list of supported locale codes
     * @param baseUrl  public base URL
     * @return sitemap index XML string
     */
    public String buildSitemapIndex(String siteId, List<String> locales, String baseUrl) {
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<sitemapindex xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        for (String locale : locales) {
            xml.append("  <sitemap>\n");
            xml.append("    <loc>").append(escapeXml(baseUrl + "/" + locale + "/sitemap.xml")).append("</loc>\n");
            xml.append("  </sitemap>\n");
        }

        xml.append("</sitemapindex>");
        return xml.toString();
    }

    // -------------------------------------------------------------------------
    // Robots.txt
    // -------------------------------------------------------------------------

    /**
     * Build a robots.txt file for a site.
     *
     * <p>Default rules disallow internal APIs and allow everything else.
     * Custom disallow paths can be added via the site's {@code settings.robotsDisallow} list.</p>
     *
     * @param siteId  the site identifier
     * @param baseUrl public base URL (used for Sitemap reference)
     * @return robots.txt content
     */
    @Transactional(readOnly = true)
    public String buildRobots(String siteId, String baseUrl) {
        Optional<Site> siteOpt = siteRepository.findById(siteId);
        List<String> extraDisallow = new ArrayList<>();

        if (siteOpt.isPresent()) {
            Site site = siteOpt.get();
            if (site.getSettings() != null) {
                Object disallowRaw = site.getSettings().get("robotsDisallow");
                if (disallowRaw instanceof List<?> list) {
                    list.forEach(p -> {
                        if (p instanceof String s && !s.isBlank()) extraDisallow.add(s);
                    });
                }
            }
        }

        StringBuilder sb = new StringBuilder();
        sb.append("User-agent: *\n");
        sb.append("Allow: /\n");
        // Disallow backend API paths — never crawled
        sb.append("Disallow: /api/\n");
        sb.append("Disallow: /actuator/\n");
        sb.append("Disallow: /graphql\n");
        sb.append("Disallow: /dam/upload\n");

        for (String path : extraDisallow) {
            sb.append("Disallow: ").append(path).append("\n");
        }

        sb.append("\n");
        sb.append("Sitemap: ").append(baseUrl).append("/sitemap.xml\n");

        return sb.toString();
    }

    // -------------------------------------------------------------------------
    // JSON sitemap entries (used by SitemapApiController)
    // -------------------------------------------------------------------------

    /**
     * Collect sitemap-eligible pages as structured entries for JSON API consumers.
     *
     * @param siteId the site identifier
     * @param locale the content locale
     * @return list of sitemap entries
     */
    @Transactional(readOnly = true)
    public List<SitemapEntry> getSitemapEntries(String siteId, String locale) {
        List<ContentNode> pages = collectSitemapPages(siteId, locale);
        String contentPrefix = "content." + siteId + "." + locale + ".";

        return pages.stream().map(page -> {
            String urlPath = contentPathToUrlPath(page.getPath(), contentPrefix, "");
            String title = (String) page.getProperties().getOrDefault("jcr:title", page.getName());
            return new SitemapEntry(
                    urlPath.isEmpty() ? "/" : "/" + urlPath,
                    title,
                    page.getModifiedAt() != null ? page.getModifiedAt().toString() : null,
                    computePriority(urlPath)
            );
        }).toList();
    }

    /** A single sitemap entry for JSON API consumers. */
    public record SitemapEntry(String url, String title, String lastModified, String priority) {}

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private List<ContentNode> collectSitemapPages(String siteId, String locale) {
        return nodeRepository.findBySiteIdAndStatus(siteId, NodeStatus.PUBLISHED).stream()
                .filter(n -> locale.equals(n.getLocale()))
                .filter(n -> PAGE_RESOURCE_TYPE.equals(n.getResourceType()))
                .filter(n -> !Boolean.TRUE.equals(n.getProperties().get("hideInNav")))
                .filter(n -> !Boolean.TRUE.equals(n.getProperties().get("hideFromSitemap")))
                .toList();
    }

    /**
     * Convert a FlexCMS content path to a URL path segment (no leading slash).
     *
     * <pre>
     * content.corporate.en.about       → about          (isDefaultLocale=true)
     * content.corporate.en.about       → en/about       (isDefaultLocale=false)
     * content.corporate.en (homepage)  → ""             (root)
     * </pre>
     */
    private String contentPathToUrlPath(String contentPath, String contentPrefix, String localePrefix) {
        if (contentPath.startsWith(contentPrefix)) {
            String remainder = contentPath.substring(contentPrefix.length()).replace(".", "/");
            return localePrefix + remainder;
        }
        return "";
    }

    /**
     * Compute sitemap priority based on URL depth.
     * Homepage = 1.0, top-level = 0.8, deeper = 0.6.
     */
    private String computePriority(String urlPath) {
        if (urlPath.isBlank()) return "1.0";
        long depth = urlPath.chars().filter(c -> c == '/').count() + 1;
        if (depth == 1) return "0.8";
        if (depth == 2) return "0.6";
        return "0.5";
    }

    /** Escape special characters in XML attribute/element values. */
    private String escapeXml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
