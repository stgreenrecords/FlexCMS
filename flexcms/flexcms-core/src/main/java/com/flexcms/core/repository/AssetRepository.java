package com.flexcms.core.repository;

import com.flexcms.core.model.Asset;
import com.flexcms.core.model.AssetStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
public interface AssetRepository extends JpaRepository<Asset, UUID> {

    Optional<Asset> findByPath(String path);

    /**
     * Assets directly inside one folder of one site.
     *
     * <p>The site predicate is not optional. The previous finder keyed on folder path
     * alone, so two sites that both had, say, {@code /content/dam/heroes} saw each
     * other's assets — the caller passed a {@code siteId} that the query then
     * ignored.</p>
     */
    Page<Asset> findByFolderPathAndSiteIdAndStatus(String folderPath, String siteId,
                                                   AssetStatus status, Pageable pageable);

    /**
     * Every folder that holds at least one active asset, with its direct asset count.
     *
     * <p>{@code siteId} is optional: passing {@code null} groups across all sites,
     * which mirrors the unscoped asset listing the DAM browser uses.</p>
     */
    @Query("""
            SELECT new com.flexcms.core.repository.AssetFolderSummary(a.folderPath, COUNT(a))
            FROM Asset a
            WHERE a.status = :status
              AND a.folderPath IS NOT NULL
              AND a.folderPath <> ''
              AND (:siteId IS NULL OR a.siteId = :siteId)
            GROUP BY a.folderPath
            ORDER BY a.folderPath
            """)
    List<AssetFolderSummary> findFolderSummaries(@Param("siteId") String siteId,
                                                 @Param("status") AssetStatus status);

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

    // ── Publish-tier replication ──────────────────────────────────────────────
    //
    // Replicated assets must keep the author's id, because the id is the public URL
    // (/dam/renditions/{id}). Asset.id is @GeneratedValue, and neither save() nor
    // merge() will insert a row with a caller-chosen id, so the receiver writes rows
    // through these native statements instead. Covered by AssetRepositoryIT.

    /**
     * Remove a row that holds {@code path} under a different id. {@code path} is unique,
     * so an asset deleted and re-uploaded at the same path on author would otherwise
     * collide with its predecessor's row on publish.
     */
    @Modifying
    @Query(value = "DELETE FROM assets WHERE path = :path AND id <> :id", nativeQuery = true)
    int deleteByPathAndIdNot(@Param("path") String path, @Param("id") UUID id);

    /**
     * Insert or update a replicated asset row by id; the row is always {@code ACTIVE}.
     *
     * <p>{@code site_id} references {@code sites}; a site that has not been provisioned on
     * this tier resolves to {@code NULL} rather than failing the whole replication.</p>
     */
    @Modifying
    @Query(value = """
            INSERT INTO assets (id, path, name, title, description, mime_type, file_size,
                                original_filename, storage_key, storage_bucket, width, height,
                                color_space, aspect_ratio, duration, video_codec, audio_codec,
                                frame_rate, metadata, site_id, folder_path, status,
                                created_by, created_at, modified_by, modified_at)
            VALUES (:id, :path, :name, :title, :description, :mimeType, :fileSize,
                    :originalFilename, :storageKey, :storageBucket, :width, :height,
                    :colorSpace, :aspectRatio, :duration, :videoCodec, :audioCodec,
                    :frameRate, CAST(:metadata AS jsonb),
                    (SELECT s.site_id FROM sites s WHERE s.site_id = :siteId),
                    :folderPath, 'ACTIVE', :createdBy, :createdAt, :modifiedBy, :modifiedAt)
            ON CONFLICT (id) DO UPDATE SET
                path = EXCLUDED.path, name = EXCLUDED.name, title = EXCLUDED.title,
                description = EXCLUDED.description, mime_type = EXCLUDED.mime_type,
                file_size = EXCLUDED.file_size, original_filename = EXCLUDED.original_filename,
                storage_key = EXCLUDED.storage_key, storage_bucket = EXCLUDED.storage_bucket,
                width = EXCLUDED.width, height = EXCLUDED.height,
                color_space = EXCLUDED.color_space, aspect_ratio = EXCLUDED.aspect_ratio,
                duration = EXCLUDED.duration, video_codec = EXCLUDED.video_codec,
                audio_codec = EXCLUDED.audio_codec, frame_rate = EXCLUDED.frame_rate,
                metadata = EXCLUDED.metadata, site_id = EXCLUDED.site_id,
                folder_path = EXCLUDED.folder_path, status = 'ACTIVE',
                modified_by = EXCLUDED.modified_by, modified_at = EXCLUDED.modified_at
            """, nativeQuery = true)
    int upsertReplicated(@Param("id") UUID id,
                         @Param("path") String path,
                         @Param("name") String name,
                         @Param("title") String title,
                         @Param("description") String description,
                         @Param("mimeType") String mimeType,
                         @Param("fileSize") Long fileSize,
                         @Param("originalFilename") String originalFilename,
                         @Param("storageKey") String storageKey,
                         @Param("storageBucket") String storageBucket,
                         @Param("width") Integer width,
                         @Param("height") Integer height,
                         @Param("colorSpace") String colorSpace,
                         @Param("aspectRatio") Double aspectRatio,
                         @Param("duration") Double duration,
                         @Param("videoCodec") String videoCodec,
                         @Param("audioCodec") String audioCodec,
                         @Param("frameRate") Integer frameRate,
                         @Param("metadata") String metadataJson,
                         @Param("siteId") String siteId,
                         @Param("folderPath") String folderPath,
                         @Param("createdBy") String createdBy,
                         @Param("createdAt") Instant createdAt,
                         @Param("modifiedBy") String modifiedBy,
                         @Param("modifiedAt") Instant modifiedAt);

    /** Delete a replicated asset by id. The caller removes renditions first; references cascade. */
    @Modifying
    @Query(value = "DELETE FROM assets WHERE id = :id", nativeQuery = true)
    int deleteReplicated(@Param("id") UUID id);
}
