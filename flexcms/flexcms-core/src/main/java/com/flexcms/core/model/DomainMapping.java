package com.flexcms.core.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "domain_mappings")
public class DomainMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String domain;

    @Column(name = "site_id", nullable = false)
    private String siteId;

    private String locale;

    @Column(name = "path_prefix")
    private String pathPrefix;

    @Column(name = "is_primary")
    private boolean primary;

    @Column(name = "https_required")
    private boolean httpsRequired = true;

    @Column(name = "created_at")
    private Instant createdAt;

    public DomainMapping() {}

    public DomainMapping(String domain, String siteId) {
        this.domain = domain;
        this.siteId = siteId;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }

    public String getSiteId() { return siteId; }
    public void setSiteId(String siteId) { this.siteId = siteId; }

    public String getLocale() { return locale; }
    public void setLocale(String locale) { this.locale = locale; }

    public String getPathPrefix() { return pathPrefix; }
    public void setPathPrefix(String pathPrefix) { this.pathPrefix = pathPrefix; }

    public boolean isPrimary() { return primary; }
    public void setPrimary(boolean primary) { this.primary = primary; }

    public boolean isHttpsRequired() { return httpsRequired; }
    public void setHttpsRequired(boolean httpsRequired) { this.httpsRequired = httpsRequired; }

    public Instant getCreatedAt() { return createdAt; }

    @PrePersist
    protected void onCreate() { createdAt = Instant.now(); }
}
