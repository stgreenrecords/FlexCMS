package com.flexcms.core.repository;

import com.flexcms.core.model.StaticBuildDependency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for {@link StaticBuildDependency}.
 *
 * <p>Backed by the {@code static_build_dependencies} table (V8 migration).
 * Queries here power the incremental static-build dependency graph used by the
 * build worker to determine which pages must be recompiled when a shared resource
 * (component, asset, or navigation) changes.
 */
@Repository
public interface StaticBuildDependencyRepository extends JpaRepository<StaticBuildDependency, UUID> {

    /**
     * Return all dependency edges for a single compiled page.
     * Used to diff the previous vs. new dependency set after a re-render.
     */
    List<StaticBuildDependency> findBySiteIdAndLocaleAndPagePath(
            String siteId, String locale, String pagePath);

    /**
     * Return every page path that depends on a specific resource key.
     *
     * <p>Example: given {@code type=ASSET, key=/dam/images/logo.svg}, returns
     * all page paths that referenced that asset in their last render.
     */
    @Query("""
            SELECT DISTINCT d.pagePath
              FROM StaticBuildDependency d
             WHERE d.siteId       = :siteId
               AND d.locale       = :locale
               AND d.dependsOnType = :type
               AND d.dependsOnKey  = :key
            """)
    List<String> findPagePathsByDependency(
            @Param("siteId") String siteId,
            @Param("locale") String locale,
            @Param("type")   String type,
            @Param("key")    String key);

    /**
     * Return every page path that has at least one dependency of the given type.
     * Useful for navigation changes that affect all pages.
     */
    @Query("""
            SELECT DISTINCT d.pagePath
              FROM StaticBuildDependency d
             WHERE d.siteId        = :siteId
               AND d.locale        = :locale
               AND d.dependsOnType = :type
            """)
    List<String> findPagePathsByType(
            @Param("siteId") String siteId,
            @Param("locale") String locale,
            @Param("type")   String type);

    /**
     * Delete all dependency edges for a page.
     * Called before re-recording the fresh dependency set after a re-render,
     * and also on DEACTIVATE / DELETE events.
     */
    @Modifying
    @Query("""
            DELETE FROM StaticBuildDependency d
             WHERE d.siteId   = :siteId
               AND d.locale   = :locale
               AND d.pagePath = :pagePath
            """)
    void deleteByPagePath(
            @Param("siteId")   String siteId,
            @Param("locale")   String locale,
            @Param("pagePath") String pagePath);

    /**
     * Delete all dependency edges for a site+locale combination.
     * Used when an entire locale is removed or rebuilt from scratch.
     */
    @Modifying
    @Query("""
            DELETE FROM StaticBuildDependency d
             WHERE d.siteId = :siteId
               AND d.locale = :locale
            """)
    void deleteBySiteAndLocale(
            @Param("siteId") String siteId,
            @Param("locale") String locale);
}

