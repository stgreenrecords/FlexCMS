package com.flexcms.dam.service;

import com.flexcms.core.model.Asset;
import com.flexcms.core.model.AssetRendition;
import com.flexcms.core.repository.AssetRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * Generates renditions for uploaded assets based on configured profiles.
 */
@Service
public class RenditionPipelineService {

    private static final Logger log = LoggerFactory.getLogger(RenditionPipelineService.class);

    /** Default image rendition profiles */
    private static final Map<String, RenditionProfile> IMAGE_PROFILES = Map.of(
            "thumbnail", new RenditionProfile(200, 200, "cover", "jpeg", 80),
            "web-small", new RenditionProfile(480, 0, "fit", "jpeg", 85),
            "web-medium", new RenditionProfile(960, 0, "fit", "jpeg", 85),
            "web-large", new RenditionProfile(1440, 0, "fit", "jpeg", 85),
            "hero-desktop", new RenditionProfile(1920, 0, "fit", "jpeg", 90),
            "hero-mobile", new RenditionProfile(768, 0, "fit", "jpeg", 85),
            "og-image", new RenditionProfile(1200, 630, "cover", "jpeg", 90)
    );

    private static final Set<String> AUTO_GENERATE = Set.of("thumbnail", "web-small", "web-medium", "web-large");

    @Autowired
    private ImageProcessingService imageProcessor;

    @Autowired
    private S3Service s3Service;

    @Autowired
    private AssetRepository assetRepository;

    /**
     * Generate all auto-generate renditions for an image asset.
     */
    @Async
    @Transactional
    public void generateRenditions(Asset asset, byte[] originalData) {
        if (!asset.getMimeType().startsWith("image/")) {
            log.debug("Skipping rendition generation for non-image asset: {}", asset.getPath());
            return;
        }

        List<AssetRendition> renditions = new ArrayList<>();

        for (String profileKey : AUTO_GENERATE) {
            RenditionProfile profile = IMAGE_PROFILES.get(profileKey);
            if (profile == null) continue;

            try {
                byte[] renditionData;
                if ("cover".equals(profile.fit())) {
                    renditionData = imageProcessor.cropToFill(originalData,
                            profile.width(), profile.height(), profile.format());
                } else {
                    renditionData = imageProcessor.resize(originalData,
                            profile.width(), profile.height(), profile.format(), profile.quality());
                }

                // Upload to S3
                String renditionKey = "renditions/" + asset.getId() + "/" + profileKey + "." + profile.format();
                String mimeType = "image/" + profile.format();
                s3Service.upload(renditionKey, renditionData, mimeType);

                // Get dimensions
                var dims = imageProcessor.getDimensions(renditionData);

                AssetRendition rendition = new AssetRendition();
                rendition.setAsset(asset);
                rendition.setRenditionKey(profileKey);
                rendition.setStorageKey(renditionKey);
                rendition.setMimeType(mimeType);
                rendition.setFileSize((long) renditionData.length);
                rendition.setFormat(profile.format());
                rendition.setGeneratedAt(Instant.now());
                if (dims != null) {
                    rendition.setWidth(dims.width());
                    rendition.setHeight(dims.height());
                }

                renditions.add(rendition);
                log.debug("Generated rendition: {} for asset {}", profileKey, asset.getPath());
            } catch (Exception e) {
                log.error("Failed to generate rendition '{}' for asset {}: {}",
                        profileKey, asset.getPath(), e.getMessage());
            }
        }

        if (!renditions.isEmpty()) {
            asset.getRenditions().addAll(renditions);
            assetRepository.save(asset);
        }
    }

    /**
     * Generate a specific rendition profile on demand.
     */
    @Transactional
    public AssetRendition generateRendition(Asset asset, String profileKey) {
        RenditionProfile profile = IMAGE_PROFILES.get(profileKey);
        if (profile == null) {
            throw new IllegalArgumentException("Unknown rendition profile: " + profileKey);
        }

        byte[] originalData = s3Service.download(asset.getStorageKey());
        byte[] renditionData;

        if ("cover".equals(profile.fit())) {
            renditionData = imageProcessor.cropToFill(originalData,
                    profile.width(), profile.height(), profile.format());
        } else {
            renditionData = imageProcessor.resize(originalData,
                    profile.width(), profile.height(), profile.format(), profile.quality());
        }

        String renditionKey = "renditions/" + asset.getId() + "/" + profileKey + "." + profile.format();
        s3Service.upload(renditionKey, renditionData, "image/" + profile.format());

        var dims = imageProcessor.getDimensions(renditionData);

        AssetRendition rendition = new AssetRendition();
        rendition.setAsset(asset);
        rendition.setRenditionKey(profileKey);
        rendition.setStorageKey(renditionKey);
        rendition.setMimeType("image/" + profile.format());
        rendition.setFileSize((long) renditionData.length);
        rendition.setFormat(profile.format());
        rendition.setGeneratedAt(Instant.now());
        if (dims != null) {
            rendition.setWidth(dims.width());
            rendition.setHeight(dims.height());
        }

        asset.getRenditions().add(rendition);
        assetRepository.save(asset);

        return rendition;
    }

    /**
     * Get available rendition profiles.
     */
    public Map<String, RenditionProfile> getProfiles() {
        return IMAGE_PROFILES;
    }

    public record RenditionProfile(int width, int height, String fit, String format, int quality) {}
}

