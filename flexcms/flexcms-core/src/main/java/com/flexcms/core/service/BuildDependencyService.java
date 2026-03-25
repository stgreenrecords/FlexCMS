package com.flexcms.core.service;

import com.flexcms.core.model.StaticBuildDependency;
import com.flexcms.core.repository.StaticBuildDependencyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Manages the static-build dependency graph stored in {@code static_build_dependencies}.
 *
 * <p>The dependency graph enables <em>incremental</em> static site compilation:
 * when a shared resource (component, DAM asset, navigation) changes, only the
 * pages that actually reference it are scheduled for recompilation — not the
 * entire site.
 *
 * <h3>Flow</h3>
 * <ol>
 *   <li>Build worker renders page → collects {@link DependencyRecord} list.</li>
 *   <li>Build worker calls {@link #recordPageDependencies} after upload.</li>
 *   <li>On next change event, {@link #findAffectedPages} returns page paths
 *       that depend on the changed resource.</li>
 * </ol>
 */
@Service
public class BuildDependencyService {

    private static final Logger log = LoggerFactory.getLogger(BuildDependencyService.class);

    @Autowired
    private StaticBuildDependencyRepository dependencyRepository;

    // ── Dependency types ─────────────────────────────────────────────────────

    public static final String TYPE_COMPONENT  = "COMPONENT";
    public static final String TYPE_ASSET      = "ASSET";
    public static final String TYPE_NAVIGATION = "NAVIGATION";

    // ── Write operations ─────────────────────────────────────────────────────

    /**
     * Replace all dependency entries for a compiled page with the supplied set.
     *
     * <p>This is an <em>upsert-by-replacement</em> pattern:
     * <ol>
     *   <li>Delete all existing edges for {@code (siteId, locale, pagePath)}.</li>
     *   <li>Insert the fresh set of dependencies reported by the build worker.</li>
     * </ol>
     *
     * @param siteId    the site that owns the page
     * @param locale    locale of the compiled page (e.g. {@code en})
     * @param pagePath  dot-separated content-tree path (e.g. {@code content.corp.en.about})
     * @param deps      dependency records collected during rendering
     */
    @Transactional
    public void recordPageDependencies(String siteId, String locale, String pagePath,
                                       List<DependencyRecord> deps) {
        dependencyRepository.deleteByPagePath(siteId, locale, pagePath);

        List<StaticBuildDependency> entities = deps.stream()
                .map(d -> new StaticBuildDependency(siteId, locale, pagePath,
                                                     d.type(), d.key()))
                .toList();

        dependencyRepository.saveAll(entities);
        log.debug("Recorded {} dependency edges for page '{}' [{}/{}]",
                entities.size(), pagePath, siteId, locale);
    }

    /**
     * Remove all dependency entries for a page.
     *
     * <p>Called when a page is deactivated or deleted so stale edges do not
     * cause spurious rebuilds.
     *
     * @param siteId   site owning the page
     * @param locale   locale of the page
     * @param pagePath content-tree path of the page
     */
    @Transactional
    public void removePageDependencies(String siteId, String locale, String pagePath) {
        dependencyRepository.deleteByPagePath(siteId, locale, pagePath);
        log.debug("Removed dependency edges for deleted page '{}' [{}/{}]",
                pagePath, siteId, locale);
    }

    /**
     * Remove all dependency entries for a site+locale.
     * Use when an entire locale is rebuilt from scratch or removed.
     */
    @Transactional
    public void removeSiteLocaleDependencies(String siteId, String locale) {
        dependencyRepository.deleteBySiteAndLocale(siteId, locale);
        log.info("Removed all dependency edges for site '{}' locale '{}'", siteId, locale);
    }

    // ── Read / query operations ───────────────────────────────────────────────

    /**
     * Find all page paths affected by a change to a specific resource.
     *
     * <p>Used by the build worker's {@code DependencyResolver} to answer:
     * "which pages do I need to recompile because asset X changed?"
     *
     * @param siteId site scope
     * @param locale locale scope
     * @param type   dependency type — one of {@link #TYPE_COMPONENT},
     *               {@link #TYPE_ASSET}, {@link #TYPE_NAVIGATION}
     * @param key    resource key (asset path, component resource type, or {@code nav})
     * @return distinct list of content-tree page paths that depend on the key
     */
    public List<String> findAffectedPages(String siteId, String locale,
                                          String type, String key) {
        List<String> pages = dependencyRepository.findPagePathsByDependency(siteId, locale, type, key);
        log.debug("Found {} pages depending on [{} / {}] in site={} locale={}",
                pages.size(), type, key, siteId, locale);
        return pages;
    }

    /**
     * Find all pages that have any dependency of the given type.
     *
     * <p>Useful for navigation changes — every page with a NAVIGATION dependency
     * must be rebuilt when the site structure changes.
     */
    public List<String> findPagesByDependencyType(String siteId, String locale, String type) {
        return dependencyRepository.findPagePathsByType(siteId, locale, type);
    }

    /**
     * Return all recorded dependency edges for a specific page.
     * Useful for diagnostics and admin tooling.
     */
    public List<DependencyRecord> getDependenciesForPage(String siteId, String locale, String pagePath) {
        return dependencyRepository
                .findBySiteIdAndLocaleAndPagePath(siteId, locale, pagePath)
                .stream()
                .map(d -> new DependencyRecord(d.getDependsOnType(), d.getDependsOnKey()))
                .toList();
    }

    // ── Value types ───────────────────────────────────────────────────────────

    /**
     * A single dependency edge: the type of resource and its key.
     *
     * @param type one of COMPONENT, ASSET, NAVIGATION
     * @param key  the resource identifier
     */
    public record DependencyRecord(String type, String key) {}
}

