package com.flexcms.core.model;

import jakarta.persistence.*;
import java.util.UUID;

/**
 * Represents a single dependency edge in the static-build dependency graph.
 *
 * <p>Maps to the {@code static_build_dependencies} table (created in V8 migration).
 * Each row records that a compiled page ({@code pagePath}) depends on a specific
 * resource ({@code dependsOnType} / {@code dependsOnKey}).
 *
 * <p>Dependency types:
 * <ul>
 *   <li>{@code COMPONENT} — page uses a specific component resource type
 *       (e.g. {@code flexcms/shared-header}). Changes to shared components
 *       trigger a rebuild of every page that uses them.</li>
 *   <li>{@code ASSET} — page references a DAM asset by path
 *       (e.g. {@code /dam/images/banner.jpg}). An asset update causes only
 *       the pages that reference it to be rebuilt.</li>
 *   <li>{@code NAVIGATION} — page depends on the navigation tree. Any
 *       structural change (add/move/delete page) triggers a rebuild.</li>
 * </ul>
 */
@Entity
@Table(
    name = "static_build_dependencies",
    uniqueConstraints = @UniqueConstraint(
        columnNames = {"site_id", "locale", "page_path", "depends_on_type", "depends_on_key"}
    )
)
public class StaticBuildDependency {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Site that owns the compiled page. */
    @Column(name = "site_id", nullable = false, length = 64)
    private String siteId;

    /** Locale of the compiled page (e.g. {@code en}, {@code de}). */
    @Column(name = "locale", nullable = false, length = 10)
    private String locale;

    /** Content-tree path of the compiled page (dot-separated). */
    @Column(name = "page_path", nullable = false, length = 2048)
    private String pagePath;

    /** Category of the dependency — one of COMPONENT, ASSET, NAVIGATION. */
    @Column(name = "depends_on_type", nullable = false, length = 20)
    private String dependsOnType;

    /**
     * The resource key for this dependency.
     * <ul>
     *   <li>COMPONENT → resource type string, e.g. {@code flexcms/shared-header}</li>
     *   <li>ASSET → DAM path, e.g. {@code /dam/images/logo.svg}</li>
     *   <li>NAVIGATION → constant {@code nav}</li>
     * </ul>
     */
    @Column(name = "depends_on_key", nullable = false, length = 2048)
    private String dependsOnKey;

    public StaticBuildDependency() {}

    public StaticBuildDependency(String siteId, String locale, String pagePath,
                                  String dependsOnType, String dependsOnKey) {
        this.siteId = siteId;
        this.locale = locale;
        this.pagePath = pagePath;
        this.dependsOnType = dependsOnType;
        this.dependsOnKey = dependsOnKey;
    }

    // ── Getters & Setters ────────────────────────────────────────────────────

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getSiteId() { return siteId; }
    public void setSiteId(String siteId) { this.siteId = siteId; }

    public String getLocale() { return locale; }
    public void setLocale(String locale) { this.locale = locale; }

    public String getPagePath() { return pagePath; }
    public void setPagePath(String pagePath) { this.pagePath = pagePath; }

    public String getDependsOnType() { return dependsOnType; }
    public void setDependsOnType(String dependsOnType) { this.dependsOnType = dependsOnType; }

    public String getDependsOnKey() { return dependsOnKey; }
    public void setDependsOnKey(String dependsOnKey) { this.dependsOnKey = dependsOnKey; }
}

