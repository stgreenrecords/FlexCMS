package com.flexcms.core.repository;

import com.flexcms.core.model.ReplicationLogEntry;
import com.flexcms.core.model.ReplicationLogEntry.ReplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ReplicationLogRepository extends JpaRepository<ReplicationLogEntry, UUID> {

    Page<ReplicationLogEntry> findByStatusOrderByInitiatedAtDesc(ReplicationStatus status, Pageable pageable);

    long countByStatus(ReplicationStatus status);

    Page<ReplicationLogEntry> findAllByOrderByInitiatedAtDesc(Pageable pageable);
}
