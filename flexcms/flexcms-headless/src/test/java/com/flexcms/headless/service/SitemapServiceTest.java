package com.flexcms.headless.service;

import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.core.model.Site;
import com.flexcms.core.repository.ContentNodeRepository;
import com.flexcms.core.repository.SiteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Unit tests for SitemapService.
 *
 * Covers: XML generation, sitemap index, robots.txt, JSON entries, filtering, priority computation.
 */
@ExtendWith(MockitoExtension.class)
class SitemapServiceTest {

    @Mock
    private ContentNodeRepository nodeRepository;

    @Mock
    private SiteRepository siteRepository;

    @InjectMocks
    private SitemapService sitemapService;

    private ContentNode homePage;
    private ContentNode aboutPage;
    private ContentNode deepPage;

    @BeforeEach
    void setUp() {
        homePage = buildPage("content.corporate.en", "homepage", null);
        aboutPage = buildPage("content.corporate.en.about", "about", Instant.parse("2024-06-15T00:00:00Z"));
        deepPage = buildPage("content.corporate.en.products.widgets", "widgets", null);
    }

    // -------------------------------------------------------------------------
    // buildSitemap
    // -------------------------------------------------------------------------

    @Test
    void buildSitemap_defaultLocale_urlsHaveNoLocalePrefix() {
        when(nodeRepository.findBySiteIdAndStatus("corporate", NodeStatus.PUBLISHED))
                .thenReturn(List.of(homePage, aboutPage));

        String xml = sitemapService.buildSitemap("corporate", "en", "https://example.com", true);

        assertThat(xml).contains("<loc>https://example.com/</loc>");
        assertThat(xml).contains("<loc>https://example.com/about</loc>");
        assertThat(xml).doesNotContain("/en/about");
    }

    @Test
    void buildSitemap_nonDefaultLocale_urlsHaveLocalePrefix() {
        ContentNode frPage = buildPage("content.corporate.fr.about", "about", null);
        frPage.setLocale("fr");
        when(nodeRepository.findBySiteIdAndStatus("corporate", NodeStatus.PUBLISHED))
                .thenReturn(List.of(frPage));

        String xml = sitemapService.buildSitemap("corporate", "fr", "https://example.com", false);

        assertThat(xml).contains("<loc>https://example.com/fr/about</loc>");
    }

    @Test
    void buildSitemap_includesLastmodWhenAvailable() {
        when(nodeRepository.findBySiteIdAndStatus("corporate", NodeStatus.PUBLISHED))
                .thenReturn(List.of(aboutPage));

        String xml = sitemapService.buildSitemap("corporate", "en", "https://example.com", true);

        assertThat(xml).contains("<lastmod>2024-06-15</lastmod>");
    }

    @Test
    void buildSitemap_omitsLastmodWhenNull() {
        when(nodeRepository.findBySiteIdAndStatus("corporate", NodeStatus.PUBLISHED))
                .thenReturn(List.of(homePage));

        String xml = sitemapService.buildSitemap("corporate", "en", "https://example.com", true);

        assertThat(xml).doesNotContain("<lastmod>");
    }

    @Test
    void buildSitemap_containsCorrectXmlDeclarationAndNamespace() {
        when(nodeRepository.findBySiteIdAndStatus("corporate", NodeStatus.PUBLISHED))
                .thenReturn(List.of());

        String xml = sitemapService.buildSitemap("corporate", "en", "https://example.com", true);

        assertThat(xml).startsWith("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        assertThat(xml).contains("xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"");
        assertThat(xml).contains("</urlset>");
    }

    @Test
    void buildSitemap_escapesSpecialCharsInBaseUrl() {
        when(nodeRepository.findBySiteIdAndStatus("corporate", NodeStatus.PUBLISHED))
                .thenReturn(List.of(aboutPage));

        String xml = sitemapService.buildSitemap("corporate", "en", "https://example.com&test", true);

        assertThat(xml).contains("https://example.com&amp;test");
        assertThat(xml).doesNotContain("&test<");
    }

    @Test
    void buildSitemap_filtersHideFromSitemapPages() {
        ContentNode hiddenPage = buildPage("content.corporate.en.hidden", "hidden", null);
        hiddenPage.getProperties().put("hideFromSitemap", true);

        when(nodeRepository.findBySiteIdAndStatus("corporate", NodeStatus.PUBLISHED))
                .thenReturn(List.of(aboutPage, hiddenPage));

        String xml = sitemapService.buildSitemap("corporate", "en", "https://example.com", true);

        assertThat(xml).contains("about");
        assertThat(xml).doesNotContain("hidden");
    }

    @Test
    void buildSitemap_filtersHideInNavPages() {
        ContentNode navHidden = buildPage("content.corporate.en.secret", "secret", null);
        navHidden.getProperties().put("hideInNav", true);

        when(nodeRepository.findBySiteIdAndStatus("corporate", NodeStatus.PUBLISHED))
                .thenReturn(List.of(aboutPage, navHidden));

        String xml = sitemapService.buildSitemap("corporate", "en", "https://example.com", true);

        assertThat(xml).doesNotContain("secret");
    }

    @Test
    void buildSitemap_filtersNonPageResourceTypes() {
        ContentNode asset = buildPage("content.corporate.en.docs", "docs", null);
        asset.setResourceType("flexcms/document");

        when(nodeRepository.findBySiteIdAndStatus("corporate", NodeStatus.PUBLISHED))
                .thenReturn(List.of(aboutPage, asset));

        String xml = sitemapService.buildSitemap("corporate", "en", "https://example.com", true);

        assertThat(xml).doesNotContain("docs");
    }

    @Test
    void buildSitemap_filtersWrongLocale() {
        ContentNode frPage = buildPage("content.corporate.fr.about", "about", null);
        frPage.setLocale("fr");

        when(nodeRepository.findBySiteIdAndStatus("corporate", NodeStatus.PUBLISHED))
                .thenReturn(List.of(aboutPage, frPage));

        String xml = sitemapService.buildSitemap("corporate", "en", "https://example.com", true);

        // frPage locale doesn't match "en", should only get one URL
        assertThat(xml.split("<url>").length - 1).isEqualTo(1);
    }

    // -------------------------------------------------------------------------
    // Priority computation
    // -------------------------------------------------------------------------

    @Test
    void buildSitemap_homepageHasPriority1() {
        when(nodeRepository.findBySiteIdAndStatus("corporate", NodeStatus.PUBLISHED))
                .thenReturn(List.of(homePage));

        String xml = sitemapService.buildSitemap("corporate", "en", "https://example.com", true);

        assertThat(xml).contains("<priority>1.0</priority>");
    }

    @Test
    void buildSitemap_topLevelPageHasPriority08() {
        when(nodeRepository.findBySiteIdAndStatus("corporate", NodeStatus.PUBLISHED))
                .thenReturn(List.of(aboutPage));

        String xml = sitemapService.buildSitemap("corporate", "en", "https://example.com", true);

        assertThat(xml).contains("<priority>0.8</priority>");
    }

    @Test
    void buildSitemap_deepPageHasPriority06() {
        when(nodeRepository.findBySiteIdAndStatus("corporate", NodeStatus.PUBLISHED))
                .thenReturn(List.of(deepPage));

        String xml = sitemapService.buildSitemap("corporate", "en", "https://example.com", true);

        assertThat(xml).contains("<priority>0.6</priority>");
    }

    // -------------------------------------------------------------------------
    // buildSitemapIndex
    // -------------------------------------------------------------------------

    @Test
    void buildSitemapIndex_containsLocaleUrls() {
        String xml = sitemapService.buildSitemapIndex("corporate", List.of("en", "fr", "de"), "https://example.com");

        assertThat(xml).contains("https://example.com/en/sitemap.xml");
        assertThat(xml).contains("https://example.com/fr/sitemap.xml");
        assertThat(xml).contains("https://example.com/de/sitemap.xml");
    }

    @Test
    void buildSitemapIndex_emptyLocales_returnsEmptySitemapindex() {
        String xml = sitemapService.buildSitemapIndex("corporate", List.of(), "https://example.com");

        assertThat(xml).contains("<sitemapindex");
        assertThat(xml).doesNotContain("<sitemap>");
    }

    // -------------------------------------------------------------------------
    // buildRobots
    // -------------------------------------------------------------------------

    @Test
    void buildRobots_containsDefaultDisallowPaths() {
        when(siteRepository.findById("corporate")).thenReturn(Optional.empty());

        String robots = sitemapService.buildRobots("corporate", "https://example.com");

        assertThat(robots).contains("Disallow: /api/");
        assertThat(robots).contains("Disallow: /actuator/");
        assertThat(robots).contains("Disallow: /graphql");
        assertThat(robots).contains("Disallow: /dam/upload");
    }

    @Test
    void buildRobots_containsSitemapReference() {
        when(siteRepository.findById("corporate")).thenReturn(Optional.empty());

        String robots = sitemapService.buildRobots("corporate", "https://example.com");

        assertThat(robots).contains("Sitemap: https://example.com/sitemap.xml");
    }

    @Test
    void buildRobots_includesCustomDisallowPaths() {
        Site site = new Site("corporate", "Corporate");
        site.setSettings(Map.of("robotsDisallow", List.of("/private/", "/staging/")));
        when(siteRepository.findById("corporate")).thenReturn(Optional.of(site));

        String robots = sitemapService.buildRobots("corporate", "https://example.com");

        assertThat(robots).contains("Disallow: /private/");
        assertThat(robots).contains("Disallow: /staging/");
    }

    @Test
    void buildRobots_ignoresBlankCustomDisallowEntries() {
        Site site = new Site("corporate", "Corporate");
        site.setSettings(Map.of("robotsDisallow", List.of("  ", "/valid/")));
        when(siteRepository.findById("corporate")).thenReturn(Optional.of(site));

        String robots = sitemapService.buildRobots("corporate", "https://example.com");

        // Blank entry should be skipped; the line count for "Disallow: " should be exact
        assertThat(robots).contains("Disallow: /valid/");
        assertThat(robots).doesNotContain("Disallow:  ");
    }

    // -------------------------------------------------------------------------
    // getSitemapEntries
    // -------------------------------------------------------------------------

    @Test
    void getSitemapEntries_returnsStructuredEntries() {
        when(nodeRepository.findBySiteIdAndStatus("corporate", NodeStatus.PUBLISHED))
                .thenReturn(List.of(aboutPage));

        List<SitemapService.SitemapEntry> entries = sitemapService.getSitemapEntries("corporate", "en");

        assertThat(entries).hasSize(1);
        SitemapService.SitemapEntry entry = entries.get(0);
        assertThat(entry.url()).isEqualTo("/about");
        assertThat(entry.priority()).isEqualTo("0.8");
        assertThat(entry.lastModified()).isNotNull();
    }

    @Test
    void getSitemapEntries_homepageUrlIsSlash() {
        when(nodeRepository.findBySiteIdAndStatus("corporate", NodeStatus.PUBLISHED))
                .thenReturn(List.of(homePage));

        List<SitemapService.SitemapEntry> entries = sitemapService.getSitemapEntries("corporate", "en");

        assertThat(entries).hasSize(1);
        assertThat(entries.get(0).url()).isEqualTo("/");
    }

    @Test
    void getSitemapEntries_usesTitleFromProperties() {
        aboutPage.getProperties().put("jcr:title", "About Us");
        when(nodeRepository.findBySiteIdAndStatus("corporate", NodeStatus.PUBLISHED))
                .thenReturn(List.of(aboutPage));

        List<SitemapService.SitemapEntry> entries = sitemapService.getSitemapEntries("corporate", "en");

        assertThat(entries.get(0).title()).isEqualTo("About Us");
    }

    @Test
    void getSitemapEntries_fallsBackToNodeNameWhenNoTitle() {
        when(nodeRepository.findBySiteIdAndStatus("corporate", NodeStatus.PUBLISHED))
                .thenReturn(List.of(aboutPage));

        List<SitemapService.SitemapEntry> entries = sitemapService.getSitemapEntries("corporate", "en");

        // No jcr:title set, should fall back to node name
        assertThat(entries.get(0).title()).isEqualTo("about");
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private ContentNode buildPage(String path, String name, Instant modifiedAt) {
        ContentNode node = new ContentNode();
        node.setPath(path);
        node.setName(name);
        node.setLocale("en");
        node.setResourceType("flexcms/page");
        node.setStatus(NodeStatus.PUBLISHED);
        node.setProperties(new HashMap<>());
        if (modifiedAt != null) node.setModifiedAt(modifiedAt);
        return node;
    }
}
