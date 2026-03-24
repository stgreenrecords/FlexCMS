package com.flexcms.i18n.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "language_copies")
public class LanguageCopy {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "source_path", nullable = false)
    private String sourcePath;

    @Column(name = "target_path", nullable = false)
    private String targetPath;

    @Column(name = "source_locale", nullable = false)
    private String sourceLocale;

    @Column(name = "target_locale", nullable = false)
    private String targetLocale;

    @Column(name = "sync_status")
    @Enumerated(EnumType.STRING)
    private SyncStatus syncStatus = SyncStatus.IN_SYNC;

    @Column(name = "last_synced_at")
    private Instant lastSyncedAt;

    @Column(name = "created_at")
    private Instant createdAt;

    public LanguageCopy() {}

    public enum SyncStatus { IN_SYNC, OUTDATED, TRANSLATING }

    // Getters and setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getSourcePath() { return sourcePath; }
    public void setSourcePath(String sourcePath) { this.sourcePath = sourcePath; }

    public String getTargetPath() { return targetPath; }
    public void setTargetPath(String targetPath) { this.targetPath = targetPath; }

    public String getSourceLocale() { return sourceLocale; }
    public void setSourceLocale(String sourceLocale) { this.sourceLocale = sourceLocale; }

    public String getTargetLocale() { return targetLocale; }
    public void setTargetLocale(String targetLocale) { this.targetLocale = targetLocale; }

    public SyncStatus getSyncStatus() { return syncStatus; }
    public void setSyncStatus(SyncStatus syncStatus) { this.syncStatus = syncStatus; }

    public Instant getLastSyncedAt() { return lastSyncedAt; }
    public void setLastSyncedAt(Instant lastSyncedAt) { this.lastSyncedAt = lastSyncedAt; }

    public Instant getCreatedAt() { return createdAt; }

    @PrePersist
    protected void onCreate() { createdAt = Instant.now(); }
}

