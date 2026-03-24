package com.flexcms.i18n.model;

import com.flexcms.core.converter.JsonbConverter;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "i18n_dictionaries",
       uniqueConstraints = @UniqueConstraint(columnNames = {"site_id", "locale", "key"}))
public class I18nDictionary {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "site_id")
    private String siteId;

    @Column(nullable = false)
    private String locale;

    @Column(name = "key", nullable = false, length = 512)
    private String key;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String value;

    private String context;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public I18nDictionary() {}

    public I18nDictionary(String siteId, String locale, String key, String value) {
        this.siteId = siteId;
        this.locale = locale;
        this.key = key;
        this.value = value;
    }

    // Getters and setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getSiteId() { return siteId; }
    public void setSiteId(String siteId) { this.siteId = siteId; }

    public String getLocale() { return locale; }
    public void setLocale(String locale) { this.locale = locale; }

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }

    public String getContext() { return context; }
    public void setContext(String context) { this.context = context; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    @PrePersist
    protected void onCreate() { createdAt = Instant.now(); updatedAt = Instant.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = Instant.now(); }
}

