package com.flexcms.dam.service;

import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.model.Asset;
import com.flexcms.core.model.AssetRendition;
import com.flexcms.core.model.AssetStatus;
import com.flexcms.core.repository.AssetRenditionRepository;
import com.flexcms.core.repository.AssetRepository;
import com.flexcms.core.util.AssetUrls;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

/**
 * Resolves the public asset URLs ({@code /dam/renditions/{id}[/{renditionKey}]}) to a
 * binary in object storage.
 *
 * <p>Runs on both tiers. On author it serves every active asset (draft previews need
 * unpublished ones); on publish the {@code assets} table holds only what replication put
 * there, so an asset that was never published — or was withdrawn — has no row and is a
 * 404 even though its binary sits in the shared bucket. That is the whole author/publish
 * boundary for assets; see {@code DEC-ECMS-002}.</p>
 */
@Service
public class AssetDeliveryService {

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private AssetRenditionRepository renditionRepository;

    @Autowired
    private S3Service s3Service;

    /**
     * Resolve an asset, or one of its renditions, for delivery.
     *
     * <p>A rendition that was never generated (unsupported format, pipeline failure,
     * profile added later) falls back to the original rather than 404, so a URL built by
     * {@link AssetUrls#rendition} always resolves for an active asset.</p>
     *
     * @param renditionKey rendition to serve, or {@code null} for the original
     * @throws NotFoundException when the asset does not exist on this tier, is not
     *                           active, or the rendition key is malformed
     */
    @Transactional(readOnly = true)
    public DeliverableAsset resolve(UUID assetId, String renditionKey) {
        if (renditionKey != null && !AssetUrls.isValidRenditionKey(renditionKey)) {
            throw new NotFoundException("Asset rendition not found: " + assetId + "/" + renditionKey);
        }
        Asset asset = assetRepository.findById(assetId)
                .filter(a -> a.getStatus() == AssetStatus.ACTIVE)
                .orElseThrow(() -> NotFoundException.forId("Asset", assetId));

        String bucket = asset.getStorageBucket() != null ? asset.getStorageBucket() : s3Service.getDefaultBucket();

        Optional<AssetRendition> rendition = renditionKey == null
                ? Optional.empty()
                : renditionRepository.findByAssetIdAndRenditionKey(assetId, renditionKey);
        if (rendition.isPresent()) {
            AssetRendition r = rendition.get();
            String mimeType = r.getMimeType() != null ? r.getMimeType() : asset.getMimeType();
            // Rendition keys are deterministic (renditions/{id}/{profile}.{format}), so a
            // regenerated rendition reuses its key; the generation time tells them apart.
            return new DeliverableAsset(bucket, r.getStorageKey(), mimeType, r.getFileSize(),
                    etag(r.getStorageKey(), r.getFileSize(), String.valueOf(r.getGeneratedAt())));
        }
        // Original storage keys embed a random UUID per upload, so the key alone changes
        // whenever the binary does.
        return new DeliverableAsset(bucket, asset.getStorageKey(), asset.getMimeType(), asset.getFileSize(),
                etag(asset.getStorageKey(), asset.getFileSize(), ""));
    }

    /** Read the resolved binary from object storage. */
    public byte[] load(DeliverableAsset asset) {
        return s3Service.download(asset.bucket(), asset.storageKey());
    }

    private static String etag(String storageKey, Long fileSize, String version) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest((storageKey + "|" + fileSize + "|" + version)
                    .getBytes(StandardCharsets.UTF_8));
            return "\"" + HexFormat.of().formatHex(hash, 0, 16) + "\"";
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is required by every Java platform", e);
        }
    }
}
