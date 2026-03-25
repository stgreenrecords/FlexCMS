package com.flexcms.author.controller;

import com.flexcms.core.model.AuditLogEntry;
import com.flexcms.core.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

/**
 * REST API for the content audit trail.
 *
 * <p>All endpoints require at least CONTENT_REVIEWER role.
 * These are read-only — audit entries cannot be modified or deleted via API.</p>
 *
 * <p>Base path: {@code /api/author/audit}</p>
 */
@Tag(name = "Audit Trail", description = "Browse and filter the immutable content audit log")
@RestController
@RequestMapping("/api/author/audit")
@PreAuthorize("hasAnyRole('ADMIN', 'CONTENT_AUTHOR', 'CONTENT_REVIEWER', 'CONTENT_PUBLISHER')")
public class AuditLogController {

    @Autowired
    private AuditService auditService;

    // ── Combined filter ───────────────────────────────────────────────────────

    /**
     * Paginated audit log with optional filters. Results are always sorted newest-first.
     *
     * <p>All query parameters are optional — omit to return all entries.</p>
     *
     * <p>Example: {@code GET /api/author/audit?entityType=CONTENT_NODE&action=PUBLISH&page=0&size=50}</p>
     */
    @Operation(
        summary     = "Query audit log",
        description = "Returns paginated audit entries filtered by entity type, path, user, action, and/or date range."
    )
    @GetMapping
    public ResponseEntity<Page<AuditLogEntry>> query(
            @Parameter(description = "Entity type (CONTENT_NODE, ASSET, SITE, WORKFLOW)")
            @RequestParam(required = false) String entityType,

            @Parameter(description = "Exact content/asset path, e.g. content.site1.en.home")
            @RequestParam(required = false) String entityPath,

            @Parameter(description = "User ID who performed the action")
            @RequestParam(required = false) String userId,

            @Parameter(description = "Action name (CREATE, UPDATE, DELETE, PUBLISH, UNPUBLISH, MOVE, LOCK, UNLOCK, RESTORE)")
            @RequestParam(required = false) String action,

            @Parameter(description = "Earliest timestamp (ISO-8601), inclusive")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,

            @Parameter(description = "Latest timestamp (ISO-8601), inclusive")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,

            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return ResponseEntity.ok(auditService.query(entityType, entityPath, userId, action, from, to, page, size));
    }

    // ── Convenience shortcuts ─────────────────────────────────────────────────

    /**
     * Full audit trail for a specific content or asset path, newest first.
     *
     * <p>Example: {@code GET /api/author/audit/path/content.site1.en.home}</p>
     */
    @Operation(summary = "Audit trail by content path")
    @GetMapping("/path/{*path}")
    public ResponseEntity<Page<AuditLogEntry>> byPath(
            @PathVariable String path,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return ResponseEntity.ok(auditService.findByPath(path, page, size));
    }

    /**
     * All audit entries for a specific user, newest first.
     *
     * <p>Example: {@code GET /api/author/audit/user/alice@example.com}</p>
     */
    @Operation(summary = "Audit trail by user ID")
    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<AuditLogEntry>> byUser(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return ResponseEntity.ok(auditService.findByUser(userId, page, size));
    }

    /**
     * Audit trail for a specific entity by its type and UUID primary key.
     *
     * <p>Example: {@code GET /api/author/audit/entity/CONTENT_NODE/3f7e1234-...}</p>
     */
    @Operation(summary = "Audit trail by entity type and ID")
    @GetMapping("/entity/{entityType}/{entityId}")
    public ResponseEntity<Page<AuditLogEntry>> byEntity(
            @PathVariable String entityType,
            @PathVariable UUID entityId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return ResponseEntity.ok(auditService.findByEntity(entityType, entityId, page, size));
    }

    /**
     * Retrieve a single audit entry by its UUID.
     */
    @Operation(summary = "Get a single audit entry by ID")
    @GetMapping("/{id}")
    public ResponseEntity<AuditLogEntry> getById(@PathVariable UUID id) {
        return auditService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}

