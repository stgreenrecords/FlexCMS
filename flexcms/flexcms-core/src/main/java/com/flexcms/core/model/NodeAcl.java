package com.flexcms.core.model;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * An Access Control Entry (ACE) for a single content node.
 *
 * <p>Maps to the {@code node_acls} table created in V5 migration.
 *
 * <p><b>Principal format:</b>
 * <ul>
 *   <li>{@code user:{userId}} — a specific authenticated user</li>
 *   <li>{@code role:{ROLE_NAME}} — all users that carry the given Spring Security role
 *       (e.g. {@code role:CONTENT_AUTHOR})</li>
 * </ul>
 *
 * <p><b>Evaluation order:</b>
 * <ol>
 *   <li>ADMIN role always bypasses all ACL checks.</li>
 *   <li>Explicit DENY (allow=false) on the closest ancestor wins over any ALLOW.</li>
 *   <li>Explicit ALLOW on the closest ancestor grants access.</li>
 *   <li>No matching entry → access denied (safe default).</li>
 * </ol>
 */
@Entity
@Table(name = "node_acls")
public class NodeAcl {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Content node path (ltree dot-separated, e.g. {@code content.corporate.en.homepage}). */
    @Column(name = "node_path", nullable = false)
    private String nodePath;

    /**
     * Principal this entry applies to. Format: {@code user:{id}} or {@code role:{name}}.
     * The special value {@code everyone} matches all authenticated users.
     */
    @Column(name = "principal", nullable = false)
    private String principal;

    /**
     * Permissions covered by this entry, stored as a PostgreSQL text array.
     * Values correspond to {@link NodePermission} names.
     */
    @Column(name = "permissions", columnDefinition = "text[]", nullable = false)
    @Convert(converter = com.flexcms.core.converter.StringListConverter.class)
    private List<String> permissions;

    /** {@code true} = grant; {@code false} = deny. */
    @Column(name = "allow")
    private boolean allow = true;

    /**
     * When {@code true}, this entry is inherited by all descendant nodes
     * unless a closer entry overrides it.
     */
    @Column(name = "inherit")
    private boolean inherit = true;

    @Column(name = "created_at")
    private Instant createdAt;

    public NodeAcl() {}

    public NodeAcl(String nodePath, String principal, List<String> permissions,
                   boolean allow, boolean inherit) {
        this.nodePath = nodePath;
        this.principal = principal;
        this.permissions = permissions;
        this.allow = allow;
        this.inherit = inherit;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    // --- Getters & Setters ---

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getNodePath() { return nodePath; }
    public void setNodePath(String nodePath) { this.nodePath = nodePath; }

    public String getPrincipal() { return principal; }
    public void setPrincipal(String principal) { this.principal = principal; }

    public List<String> getPermissions() { return permissions; }
    public void setPermissions(List<String> permissions) { this.permissions = permissions; }

    public boolean isAllow() { return allow; }
    public void setAllow(boolean allow) { this.allow = allow; }

    public boolean isInherit() { return inherit; }
    public void setInherit(boolean inherit) { this.inherit = inherit; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
