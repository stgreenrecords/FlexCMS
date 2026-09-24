package com.flexcms.core.repository;

import com.flexcms.core.model.AssetRendition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AssetRenditionRepository extends JpaRepository<AssetRendition, UUID> {

    @Query("SELECT r FROM AssetRendition r WHERE r.asset.id = :assetId ORDER BY r.renditionKey")
    List<AssetRendition> findByAssetId(@Param("assetId") UUID assetId);

    @Query("SELECT r FROM AssetRendition r WHERE r.asset.id = :assetId AND r.renditionKey = :renditionKey")
    Optional<AssetRendition> findByAssetIdAndRenditionKey(@Param("assetId") UUID assetId,
                                                         @Param("renditionKey") String renditionKey);

    /** Remove every rendition of a replicated asset before its current set is written. */
    @Modifying
    @Query(value = "DELETE FROM asset_renditions WHERE asset_id = :assetId", nativeQuery = true)
    int deleteReplicatedByAssetId(@Param("assetId") UUID assetId);

    /**
     * Remove the renditions of a row that holds {@code path} under a different id; the
     * companion of {@link AssetRepository#deleteByPathAndIdNot}. Explicit rather than left
     * to {@code ON DELETE CASCADE}, so the replication writer does not depend on how the
     * schema was created.
     */
    @Modifying
    @Query(value = """
            DELETE FROM asset_renditions
            WHERE asset_id IN (SELECT a.id FROM assets a WHERE a.path = :path AND a.id <> :id)
            """, nativeQuery = true)
    int deleteReplicatedByAssetPathAndIdNot(@Param("path") String path, @Param("id") UUID id);

    /**
     * Insert a replicated rendition row. Native for the same reason as
     * {@link AssetRepository#upsertReplicated}: the parent row was written natively and
     * is not in the persistence context.
     */
    @Modifying
    @Query(value = """
            INSERT INTO asset_renditions (id, asset_id, rendition_key, storage_key, mime_type,
                                          file_size, width, height, format, generated_at)
            VALUES (:id, :assetId, :renditionKey, :storageKey, :mimeType,
                    :fileSize, :width, :height, :format, :generatedAt)
            """, nativeQuery = true)
    int insertReplicated(@Param("id") UUID id,
                         @Param("assetId") UUID assetId,
                         @Param("renditionKey") String renditionKey,
                         @Param("storageKey") String storageKey,
                         @Param("mimeType") String mimeType,
                         @Param("fileSize") Long fileSize,
                         @Param("width") Integer width,
                         @Param("height") Integer height,
                         @Param("format") String format,
                         @Param("generatedAt") Instant generatedAt);
}
