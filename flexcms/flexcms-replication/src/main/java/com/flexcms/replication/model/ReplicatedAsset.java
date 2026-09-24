package com.flexcms.replication.model;

import com.flexcms.core.model.Asset;
import com.flexcms.core.model.AssetRendition;

import java.io.Serializable;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Asset metadata carried inside an asset {@link ReplicationEvent}.
 *
 * <p>Content activation fetches tree nodes back from author ({@code AuthorNodeClient});
 * assets travel with their payload instead, so the publish tier never calls author to
 * serve an image. Binaries are not copied: both tiers read the same bucket, and this row
 * is what makes the binary reachable on publish ({@code DEC-ECMS-002}).</p>
 */
public record ReplicatedAsset(
        UUID id,
        String path,
        String name,
        String title,
        String description,
        String mimeType,
        Long fileSize,
        String originalFilename,
        String storageKey,
        String storageBucket,
        Integer width,
        Integer height,
        String colorSpace,
        Double aspectRatio,
        Double duration,
        String videoCodec,
        String audioCodec,
        Integer frameRate,
        Map<String, Object> metadata,
        String siteId,
        String folderPath,
        String createdBy,
        Instant createdAt,
        String modifiedBy,
        Instant modifiedAt,
        List<ReplicatedRendition> renditions) implements Serializable {

    public static ReplicatedAsset from(Asset asset, List<AssetRendition> renditions) {
        return new ReplicatedAsset(
                asset.getId(), asset.getPath(), asset.getName(), asset.getTitle(), asset.getDescription(),
                asset.getMimeType(), asset.getFileSize(), asset.getOriginalFilename(),
                asset.getStorageKey(), asset.getStorageBucket(), asset.getWidth(), asset.getHeight(),
                asset.getColorSpace(), asset.getAspectRatio(), asset.getDuration(),
                asset.getVideoCodec(), asset.getAudioCodec(), asset.getFrameRate(),
                // Not Map.copyOf: extracted metadata may legitimately hold null values.
                asset.getMetadata() != null ? new LinkedHashMap<>(asset.getMetadata()) : new LinkedHashMap<>(),
                asset.getSiteId(), asset.getFolderPath(),
                asset.getCreatedBy(), asset.getCreatedAt(), asset.getModifiedBy(), asset.getModifiedAt(),
                renditions.stream().map(ReplicatedRendition::from).toList());
    }

    /** One rendition row of a replicated asset. */
    public record ReplicatedRendition(
            UUID id,
            String renditionKey,
            String storageKey,
            String mimeType,
            Long fileSize,
            Integer width,
            Integer height,
            String format,
            Instant generatedAt) implements Serializable {

        public static ReplicatedRendition from(AssetRendition r) {
            return new ReplicatedRendition(r.getId(), r.getRenditionKey(), r.getStorageKey(), r.getMimeType(),
                    r.getFileSize(), r.getWidth(), r.getHeight(), r.getFormat(), r.getGeneratedAt());
        }
    }
}
