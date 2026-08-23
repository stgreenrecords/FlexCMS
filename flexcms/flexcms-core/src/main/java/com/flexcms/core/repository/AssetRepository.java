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

    /**
     * Keyword search across an asset's name, title, and metadata.
     *
     * <p>There is deliberately no {@code tags} clause. This query used to include
     * {@code OR :query = ANY(tags)}, but neither the {@code assets} table nor the
     * {@link com.flexcms.core.model.Asset} entity has ever had a {@code tags}
     * column, so every call failed with
     * {@code PSQLException: ERROR: column "tags" does not exist} — the endpoint
     * returned HTTP 500 for every keyword. Tags, where they exist, live inside the
     * {@code metadata} JSONB document, which the clause below already searches as
     * text.</p>
     */
    @Query(value = """
            SELECT * FROM assets
            WHERE site_id = :siteId AND status = 'ACTIVE'
              AND (name ILIKE '%' || :query || '%'
                   OR title ILIKE '%' || :query || '%'
                   OR metadata::text ILIKE '%' || :query || '%')
            ORDER BY modified_at DESC
            """, nativeQuery = true)
    Page<Asset> search(@Param("siteId") String siteId,
                       @Param("query") String query,
                       Pageable pageable);

    @Query("SELECT COUNT(a) FROM Asset a WHERE a.siteId = :siteId AND a.status = 'ACTIVE'")
    long countActiveBySite(@Param("siteId") String siteId);
}
