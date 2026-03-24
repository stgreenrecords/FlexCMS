package com.flexcms.core.repository;

import com.flexcms.core.model.Asset;
import com.flexcms.core.model.AssetStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AssetRepository extends JpaRepository<Asset, UUID> {

    Optional<Asset> findByPath(String path);

    Page<Asset> findByFolderPathAndStatus(String folderPath, AssetStatus status, Pageable pageable);

    Page<Asset> findBySiteIdAndStatus(String siteId, AssetStatus status, Pageable pageable);

    @Query(value = """
            SELECT * FROM assets
            WHERE site_id = :siteId AND status = 'ACTIVE'
              AND (name ILIKE '%' || :query || '%'
                   OR title ILIKE '%' || :query || '%'
                   OR :query = ANY(tags)
                   OR metadata::text ILIKE '%' || :query || '%')
            ORDER BY modified_at DESC
            """, nativeQuery = true)
    Page<Asset> search(@Param("siteId") String siteId,
                       @Param("query") String query,
                       Pageable pageable);

    @Query("SELECT COUNT(a) FROM Asset a WHERE a.siteId = :siteId AND a.status = 'ACTIVE'")
    long countActiveBySite(@Param("siteId") String siteId);
}
