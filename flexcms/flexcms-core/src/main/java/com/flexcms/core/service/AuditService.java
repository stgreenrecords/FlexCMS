package com.flexcms.core.service;

import com.flexcms.core.model.AuditLogEntry;
import com.flexcms.core.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Service for writing and querying the audit trail.
 *
 * <p>Audit log entries record every significant mutation on content nodes,
 * DAM assets, sites, and users. Each entry captures:
 * <ul>
 *   <li>Who performed the action ({@code userId})</li>
 *   <li>What entity was affected ({@code entityType}, {@code entityId},
 *       {@code entityPath})</li>
 *   <li>What action was taken ({@code action}) — e.g. CREATE, UPDATE,
 *       DELETE, PUBLISH, MOVE, LOCK, UNLOCK, RESTORE</li>
 *   <li>What changed ({@code changes} — JSONB diff, optional)</li>
 *   <li>Client metadata ({@code ipAddress}, {@code userAgent})</li>
 * </ul>
 *
 * <p>Writes use {@link Propagation#REQUIRES_NEW} so an audit entry is always
 * persisted even if the caller's transaction is rolling back.
 */
@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    /** Well-known entity type constants for consistent querying. */
    public static final String ENTITY_CONTENT  = "CONTENT_NODE";
    public static final String ENTITY_ASSET    = "ASSET";
    public static final String ENTITY_SITE     = "SITE";
    public static final String ENTITY_WORKFLOW = "WORKFLOW";

    /** Well-known action constants. */
    public static final String ACTION_CREATE   = "CREATE";
    public static final String ACTION_UPDATE   = "UPDATE";
    public static final String ACTION_DELETE   = "DELETE";
    public static final String ACTION_PUBLISH  = "PUBLISH";
    public static final String ACTION_UNPUBLISH= "UNPUBLISH";
    public static final String ACTION_MOVE     = "MOVE";
    public static final String ACTION_LOCK     = "LOCK";
    public static final String ACTION_UNLOCK   = "UNLOCK";
    public static final String ACTION_RESTORE  = "RESTORE";

    /** Maximum page size accepted from callers. */
    private static final int MAX_PAGE_SIZE = 200;

    @Autowired
    private AuditLogRepository auditLogRepository;

    // ── Write ────────────────────────────────────────────────────────────────

    /**
     * Record an audit event. Runs in its own transaction so the entry is
     * saved even if the parent transaction rolls back.
     *
     * @param entityType  {@link #ENTITY_CONTENT} etc.
     * @param entityId    database PK of the affected entity (may be null)
     * @param entityPath  content path or asset path (may be null)
     * @param action      {@link #ACTION_CREATE} etc.
     * @param userId      authenticated principal ID
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuditLogEntry log(String entityType,
                              UUID entityId,
                              String entityPath,
                              String action,
                              String userId) {
        return log(entityType, entityId, entityPath, action, userId, null, null, null);
    }

    /**
     * Record an audit event with full context.
     *
     * @param changes    JSONB-serialisable map of before/after values (may be null)
     * @param ipAddress  client IP (may be null)
     * @param userAgent  client User-Agent (may be null)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuditLogEntry log(String entityType,
                              UUID entityId,
                              String entityPath,
                              String action,
                              String userId,
                              Map<String, Object> changes,
                              String ipAddress,
                              String userAgent) {
        AuditLogEntry entry = AuditLogEntry.create(entityType, entityId, entityPath, action, userId);
        if (changes   != null) entry.setChanges(changes);
        if (ipAddress != null) entry.setIpAddress(ipAddress);
        if (userAgent != null) entry.setUserAgent(userAgent);

        AuditLogEntry saved = auditLogRepository.save(entry);
        log.debug("Audit: {} {} {} by {}", action, entityType, entityPath, userId);
        return saved;
    }

    // ── Read ─────────────────────────────────────────────────────────────────

    /**
     * Paginated, filtered audit log query. All filter parameters are optional.
     *
     * @param entityType filter by entity type (null = any)
     * @param entityPath filter by exact content path (null = any)
     * @param userId     filter by user (null = any)
     * @param action     filter by action name (null = any)
     * @param from       lower bound on timestamp (null = unbounded)
     * @param to         upper bound on timestamp (null = unbounded)
     * @param page       zero-based page index
     * @param size       page size (capped at {@value #MAX_PAGE_SIZE})
     */
    @Transactional(readOnly = true)
    public Page<AuditLogEntry> query(String entityType,
                                      String entityPath,
                                      String userId,
                                      String action,
                                      Instant from,
                                      Instant to,
                                      int page,
                                      int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, MAX_PAGE_SIZE));
        return auditLogRepository.findWithFilters(
                entityType, entityPath, userId, action, from, to, pageable);
    }

    /**
     * Audit trail for a specific content path, newest first.
     */
    @Transactional(readOnly = true)
    public Page<AuditLogEntry> findByPath(String path, int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, MAX_PAGE_SIZE));
        return auditLogRepository.findByEntityPathOrderByTimestampDesc(path, pageable);
    }

    /**
     * All actions performed by a specific user, newest first.
     */
    @Transactional(readOnly = true)
    public Page<AuditLogEntry> findByUser(String userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, MAX_PAGE_SIZE));
        return auditLogRepository.findByUserIdOrderByTimestampDesc(userId, pageable);
    }

    /**
     * Audit trail for a specific entity (by type + UUID), newest first.
     */
    @Transactional(readOnly = true)
    public Page<AuditLogEntry> findByEntity(String entityType, UUID entityId,
                                             int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, MAX_PAGE_SIZE));
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(
                entityType, entityId, pageable);
    }

    /**
     * Retrieve a single audit entry by its UUID primary key.
     */
    @Transactional(readOnly = true)
    public java.util.Optional<AuditLogEntry> findById(UUID id) {
        return auditLogRepository.findById(id);
    }
}

