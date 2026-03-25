package com.flexcms.core.repository;

import com.flexcms.core.model.AuditLogEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLogEntry, UUID> {

    Page<AuditLogEntry> findByEntityPathOrderByTimestampDesc(String entityPath, Pageable pageable);

    Page<AuditLogEntry> findByUserIdOrderByTimestampDesc(String userId, Pageable pageable);

    Page<AuditLogEntry> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, UUID entityId, Pageable pageable);

    Page<AuditLogEntry> findByActionOrderByTimestampDesc(String action, Pageable pageable);

    Page<AuditLogEntry> findByTimestampBetweenOrderByTimestampDesc(Instant from, Instant to, Pageable pageable);

    /**
     * Combined filter — all parameters are optional (pass null to skip).
     */
    @Query("""
           SELECT a FROM AuditLogEntry a
           WHERE (:entityType IS NULL OR a.entityType = :entityType)
             AND (:entityPath IS NULL OR a.entityPath = :entityPath)
             AND (:userId     IS NULL OR a.userId     = :userId)
             AND (:action     IS NULL OR a.action     = :action)
             AND (:from       IS NULL OR a.timestamp >= :from)
             AND (:to         IS NULL OR a.timestamp <= :to)
           ORDER BY a.timestamp DESC
           """)
    Page<AuditLogEntry> findWithFilters(
            @Param("entityType") String entityType,
            @Param("entityPath") String entityPath,
            @Param("userId")     String userId,
            @Param("action")     String action,
            @Param("from")       Instant from,
            @Param("to")         Instant to,
            Pageable pageable
    );
}
