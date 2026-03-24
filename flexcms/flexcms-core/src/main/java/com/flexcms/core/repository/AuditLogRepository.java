package com.flexcms.core.repository;

import com.flexcms.core.model.AuditLogEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLogEntry, UUID> {

    Page<AuditLogEntry> findByEntityPathOrderByTimestampDesc(String entityPath, Pageable pageable);

    Page<AuditLogEntry> findByUserIdOrderByTimestampDesc(String userId, Pageable pageable);

    Page<AuditLogEntry> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, UUID entityId, Pageable pageable);
}
