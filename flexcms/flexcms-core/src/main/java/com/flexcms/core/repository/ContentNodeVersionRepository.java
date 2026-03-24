package com.flexcms.core.repository;

import com.flexcms.core.model.ContentNodeVersion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContentNodeVersionRepository extends JpaRepository<ContentNodeVersion, UUID> {

    Page<ContentNodeVersion> findByNodeIdOrderByVersionNumberDesc(UUID nodeId, Pageable pageable);

    Optional<ContentNodeVersion> findByNodeIdAndVersionNumber(UUID nodeId, Long versionNumber);
}
