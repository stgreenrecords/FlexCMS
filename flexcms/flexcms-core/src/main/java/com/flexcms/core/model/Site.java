package com.flexcms.core.model;

import com.flexcms.core.converter.JsonbConverter;
import jakarta.persistence.*;
import org.hibernate.annotations.ColumnTransformer;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "sites")
public class Site {

    @Id
    @Column(name = "site_id")
    private String siteId;

    private String title;
    private String description;

    @Column(name = "content_root", nullable = false)
    private String contentRoot;

    @Column(name = "dam_root", nullable = false)
    private String damRoot;

    @Column(name = "config_root", nullable = false)
    private String configRoot;

    @Column(name = "default_locale")
    private String defaultLocale = "en";

    @Column(name = "supported_locales")
    private String supportedLocalesRaw = "en";

    @Column(name = "allowed_templates")
    private String allowedTemplatesRaw;

    @Column(name = "settings", columnDefinition = "jsonb")
    @ColumnTransformer(write = "?::jsonb")
    @Convert(converter = JsonbConverter.class)
    private Map<String, Object> settings;

    private boolean active = true;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @OneToMany(mappedBy = "siteId", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<DomainMapping> domains = new ArrayList<>();

    public Site() {}

    public Site(String siteId, String title) {
        this.siteId = siteId;
        this.title = title;
        this.contentRoot = "/content/" + siteId;
        this.damRoot = "/dam/" + siteId;
        this.configRoot = "/conf/" + siteId;
    }

    public List<String> getSupportedLocales() {
        if (supportedLocalesRaw == null || supportedLocalesRaw.isBlank()) return List.of("en");
        return List.of(supportedLocalesRaw.split(","));
    }

    public void setSupportedLocales(List<String> locales) {
        this.supportedLocalesRaw = String.join(",", locales);
    }

    public List<String> getAllowedTemplates() {
        if (allowedTemplatesRaw == null || allowedTemplatesRaw.isBlank()) return List.of();
        return List.of(allowedTemplatesRaw.split(","));
    }

    public void setAllowedTemplates(List<String> templates) {
        this.allowedTemplatesRaw = String.join(",", templates);
    }

    // Getters and setters
    public String getSiteId() { return siteId; }
    public void setSiteId(String siteId) { this.siteId = siteId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getContentRoot() { return contentRoot; }
    public void setContentRoot(String contentRoot) { this.contentRoot = contentRoot; }

    public String getDamRoot() { return damRoot; }
    public void setDamRoot(String damRoot) { this.damRoot = damRoot; }

    public String getConfigRoot() { return configRoot; }
    public void setConfigRoot(String configRoot) { this.configRoot = configRoot; }

    public String getDefaultLocale() { return defaultLocale; }
    public void setDefaultLocale(String defaultLocale) { this.defaultLocale = defaultLocale; }

    public Map<String, Object> getSettings() { return settings; }
    public void setSettings(Map<String, Object> settings) { this.settings = settings; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public List<DomainMapping> getDomains() { return domains; }
    public void setDomains(List<DomainMapping> domains) { this.domains = domains; }

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
