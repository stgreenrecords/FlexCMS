package com.flexcms.dam.service;

import com.flexcms.core.exception.ValidationException;
import com.flexcms.core.model.Asset;
import com.flexcms.core.model.AssetRendition;
import com.flexcms.core.model.AssetStatus;
import com.flexcms.core.repository.AssetFolderSummary;
import com.flexcms.core.repository.AssetRepository;
import org.apache.tika.Tika;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.*;

/**
 * Main DAM service for asset ingestion, retrieval, and lifecycle management.
 */
@Service
public class AssetIngestService {

    private static final Logger log = LoggerFactory.getLogger(AssetIngestService.class);

    private static final Tika tika = new Tika();

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private S3Service s3Service;

    @Autowired
    private ImageProcessingService imageProcessor;

    @Autowired
    private RenditionPipelineService renditionPipeline;

    /** 100 MB, matching the cap the admin upload dialog advertises. */
    private static final long DEFAULT_MAX_UPLOAD_BYTES = 100L * 1024 * 1024;

    /**
     * Largest accepted upload, in bytes. Defaults to the 100 MB the admin upload
     * dialog advertises, so the API and the UI agree instead of the UI being the
     * only thing enforcing a limit.
     *
     * <p>The field is initialised in code as well as annotated: {@code @Value} is
     * only applied when Spring builds the bean, so a service constructed directly —
     * a plain unit test, or any manual wiring — would otherwise leave this primitive
     * at 0 and reject every upload as "too large".</p>
     */
    @Value("${flexcms.dam.max-upload-bytes:104857600}")
    private long maxUploadBytes = DEFAULT_MAX_UPLOAD_BYTES;

    /**
     * Content types refused outright, matched against the type Tika detects from
     * the bytes rather than anything the client declares.
     *
     * This is a denylist, not an allow-list, on purpose: the DAM legitimately holds
     * fonts and stylesheets as well as images, video, and documents (REB-07 imported
     * 22 fonts and 15 stylesheets), so an allow-list copied from the admin dialog's
     * `accept` attribute would reject assets the platform is meant to store.
     * Whether the DAM should move to a positive allow-list is an `sa` policy
     * decision — see df/artifacts/REB-21/devops/blockers.md R21-1.
     */
    private static final Set<String> REFUSED_MIME_TYPES = Set.of(
            "application/x-msdownload",
            "application/x-dosexec",
            "application/vnd.microsoft.portable-executable",
            "application/x-executable",
            "application/x-elf",
            "application/x-mach-binary",
            "application/x-sharedlib",
            "application/x-msi",
            "application/x-bat",
            "application/x-sh",
            "text/x-shellscript"
    );

    /**
     * Ingest a new asset: upload original, detect metadata, generate renditions.
     */
    @Transactional
    public Asset ingest(String path, String filename, byte[] data, String siteId, String userId) {
        // Detect MIME type from the bytes themselves; a client-declared type is not
        // trusted for the refusal check below.
        String mimeType = tika.detect(data, filename);

        validateUpload(filename, data, mimeType);

        // Generate storage key
        String storageKey = "originals/" + UUID.randomUUID() + "/" + filename;

        // Upload original to S3
        s3Service.upload(storageKey, data, mimeType);

        // Create asset entity
        Asset asset = new Asset();
        asset.setPath(path);
        asset.setName(filename);
        asset.setOriginalFilename(filename);
        asset.setMimeType(mimeType);
        asset.setFileSize((long) data.length);
        asset.setStorageKey(storageKey);
        asset.setStorageBucket(s3Service.getDefaultBucket());
        asset.setSiteId(siteId);
        asset.setFolderPath(path.substring(0, path.lastIndexOf('/')));
        asset.setCreatedBy(userId);
        asset.setModifiedBy(userId);
        asset.setStatus(AssetStatus.PROCESSING);

        // Extract image dimensions if applicable
        if (mimeType.startsWith("image/")) {
            var dims = imageProcessor.getDimensions(data);
            if (dims != null) {
                asset.setWidth(dims.width());
                asset.setHeight(dims.height());
                asset.setAspectRatio(dims.aspectRatio());
            }
        }

        asset = assetRepository.save(asset);

        // Generate renditions asynchronously
        renditionPipeline.generateRenditions(asset, data);

        // Mark as active
        asset.setStatus(AssetStatus.ACTIVE);
        asset = assetRepository.save(asset);

        log.info("Ingested asset: {} ({}, {} bytes)", path, mimeType, data.length);
        return asset;
    }

    /**
     * Rejects uploads that must never become assets.
     *
     * Checks, in order: the file has content, it is within the configured size cap,
     * and its **detected** content type is not an executable. Detection runs on the
     * bytes, so renaming `payload.exe` to `photo.png` does not get past it.
     *
     * @throws ValidationException mapped to HTTP 422 by GlobalExceptionHandler
     */
    private void validateUpload(String filename, byte[] data, String mimeType) {
        if (data == null || data.length == 0) {
            throw new ValidationException("Asset upload is empty", List.of(
                    ValidationException.FieldError.of("file",
                            "File is empty; an asset must contain at least one byte")));
        }

        if (data.length > maxUploadBytes) {
            throw new ValidationException("Asset upload is too large", List.of(
                    ValidationException.FieldError.of("file",
                            "File is " + data.length + " bytes, which exceeds the "
                                    + maxUploadBytes + " byte limit")));
        }

        String detected = mimeType == null ? "" : mimeType.toLowerCase(Locale.ROOT);
        if (REFUSED_MIME_TYPES.contains(detected)) {
            log.warn("Refused asset upload '{}': detected executable content type {}", filename, detected);
            throw new ValidationException("Asset content type is not allowed", List.of(
                    ValidationException.FieldError.of("file",
                            "Detected content type " + detected + " is not allowed in the DAM")));
        }
    }

    /**
     * Get an asset by path.
     */
    public Optional<Asset> getAsset(String path) {
        return assetRepository.findByPath(path);
    }

    /**
     * Get an asset by ID.
     */
    public Optional<Asset> getAssetById(UUID id) {
        return assetRepository.findById(id);
    }

    /**
     * Get rendition URL for an asset.
     */
    public String getRenditionUrl(String assetPath, String renditionKey) {
        return assetRepository.findByPath(assetPath)
                .map(asset -> asset.getRenditionUrl(renditionKey))
                .orElse(null);
    }

    /**
     * Delete an asset and all its renditions from storage and DB.
     */
    @Transactional
    public void deleteAsset(String path) {
        assetRepository.findByPath(path).ifPresent(asset -> {
            // Delete renditions from S3
            for (AssetRendition rendition : asset.getRenditions()) {
                try { s3Service.delete(rendition.getStorageKey()); } catch (Exception e) {
                    log.warn("Failed to delete rendition from S3: {}", rendition.getStorageKey());
                }
            }
            // Delete original from S3
            try { s3Service.delete(asset.getStorageKey()); } catch (Exception e) {
                log.warn("Failed to delete original from S3: {}", asset.getStorageKey());
            }
            assetRepository.delete(asset);
            log.info("Deleted asset: {}", path);
        });
    }

    /**
     * List assets in a folder with pagination.
     *
     * @param folderPath folder path to list
     * @param siteId     site identifier
     * @param page       zero-based page number
     * @param size       page size (capped at 200)
     * @return paginated result
     */
    public Page<Asset> listFolder(String folderPath, String siteId, int page, int size) {
        return assetRepository.findByFolderPathAndSiteIdAndStatus(folderPath, siteId, AssetStatus.ACTIVE,
                PageRequest.of(page, Math.min(size, 200)));
    }

    /**
     * Every folder of a site that holds at least one active asset.
     *
     * <p>Folders are derived from asset paths rather than stored, so this returns only
     * folders with assets directly in them. A caller building a tree reconstructs the
     * intermediate folders from the path segments — {@code /content/dam/a/b} implies
     * {@code /content/dam/a} even when nothing sits directly in it.</p>
     *
     * @param siteId site identifier, or {@code null} to group across all sites
     * @return folder paths with direct asset counts, ordered by path
     */
    public List<AssetFolderSummary> listFolders(String siteId) {
        String effectiveSite = (siteId == null || siteId.isBlank()) ? null : siteId;
        return assetRepository.findFolderSummaries(effectiveSite, AssetStatus.ACTIVE);
    }

    /**
     * List all assets with pagination.
     *
     * @param page zero-based page number
     * @param size page size (capped at 200)
     * @return paginated result
     */
    public Page<Asset> listAll(int page, int size) {
        return assetRepository.findAll(PageRequest.of(page, Math.min(size, 200)));
    }

    /**
     * Search assets by query with pagination.
     *
     * @param siteId site identifier
     * @param query  search query
     * @param page   zero-based page number
     * @param size   page size (capped at 200)
     * @return paginated result
     */
    public Page<Asset> searchAssets(String siteId, String query, int page, int size) {
        return assetRepository.search(siteId, query,
                PageRequest.of(page, Math.min(size, 200)));
    }
}

