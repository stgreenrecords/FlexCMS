package com.flexcms.core.model;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Tracks a live-copy relationship between a source (blueprint) content path
 * and a target content path.
 *
 * <p>A live copy is a content node (or subtree) that is synchronized with its
 * source. When the source changes, a rollout operation propagates the changes
 * to all live copies. The relationship can be detached to break the link.</p>
 *
 * <h3>Key rules</h3>
 * <ul>
 *   <li>A target path can have at most one source (UNIQUE constraint on target_path).</li>
 *   <li>A source path can have many live copies (one-to-many).</li>
 *   <li>When {@code deep=true} the entire subtree of the source is synchronized.
 *       When {@code deep=false} only the root node's properties are synchronized.</li>
 *   <li>Properties listed in {@code excludedProps} are never overwritten during rollout.</li>
 * </ul>
 */
@Entity
@Table(name = "live_copy_relationships")
public class LiveCopyRelationship {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Content path of the blueprint (source). */
    @Column(name = "source_path", nullable = false)
    private String sourcePath;

    /** Content path of the live copy (target). Must be unique. */
    @Column(name = "target_path", nullable = false, unique = true)
    private String targetPath;

    /** When {@code true} the full subtree is synchronized during rollout. */
    @Column(name = "deep", nullable = false)
    private boolean deep = true;

    /**
     * Comma-separated property keys that are excluded from rollout
     * (i.e., locally overridden in the live copy and not overwritten).
     */
    @Column(name = "excluded_props")
    private String excludedProps;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at")
    private Instant createdAt;

    public LiveCopyRelationship() {}

    public LiveCopyRelationship(String sourcePath, String targetPath, boolean deep, String createdBy) {
        this.sourcePath = sourcePath;
        this.targetPath = targetPath;
        this.deep = deep;
        this.createdBy = createdBy;
        this.createdAt = Instant.now();
    }

    /** Parse {@code excludedProps} CSV into a list. */
    public List<String> getExcludedPropsList() {
        if (excludedProps == null || excludedProps.isBlank()) return List.of();
        List<String> result = new ArrayList<>();
        for (String s : excludedProps.split(",")) {
            String trimmed = s.trim();
            if (!trimmed.isEmpty()) result.add(trimmed);
        }
        return result;
    }

    public UUID getId() { return id; }

    public String getSourcePath() { return sourcePath; }
    public void setSourcePath(String sourcePath) { this.sourcePath = sourcePath; }

    public String getTargetPath() { return targetPath; }
    public void setTargetPath(String targetPath) { this.targetPath = targetPath; }

    public boolean isDeep() { return deep; }
    public void setDeep(boolean deep) { this.deep = deep; }

    public String getExcludedProps() { return excludedProps; }
    public void setExcludedProps(String excludedProps) { this.excludedProps = excludedProps; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
