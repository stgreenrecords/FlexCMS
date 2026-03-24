package com.flexcms.dam.service;

import com.flexcms.core.model.Asset;
import com.flexcms.core.model.AssetRendition;
import com.flexcms.core.model.AssetStatus;
import com.flexcms.core.repository.AssetRepository;
import org.apache.tika.Tika;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    /**
     * Ingest a new asset: upload original, detect metadata, generate renditions.
     */
    @Transactional
    public Asset ingest(String path, String filename, byte[] data, String siteId, String userId) {
        // Detect MIME type
        String mimeType = tika.detect(data, filename);

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
     * List assets in a folder.
     */
    public List<Asset> listFolder(String folderPath, String siteId) {
        return assetRepository.findByFolderPathAndStatus(folderPath, AssetStatus.ACTIVE,
                org.springframework.data.domain.Pageable.unpaged()).getContent();
    }

    /**
     * Search assets by query.
     */
    public List<Asset> searchAssets(String siteId, String query) {
        return assetRepository.search(siteId, query,
                org.springframework.data.domain.Pageable.unpaged()).getContent();
    }
}

