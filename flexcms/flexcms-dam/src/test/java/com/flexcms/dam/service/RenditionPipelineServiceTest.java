package com.flexcms.dam.service;

import com.flexcms.core.model.Asset;
import com.flexcms.core.model.AssetRendition;
import com.flexcms.core.model.AssetStatus;
import com.flexcms.core.repository.AssetRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RenditionPipelineServiceTest {

    @Mock private ImageProcessingService imageProcessor;
    @Mock private S3Service s3Service;
    @Mock private AssetRepository assetRepository;

    @InjectMocks
    private RenditionPipelineService renditionPipelineService;

    // ── Fixture helpers ───────────────────────────────────────────────────────

    private Asset imageAsset() {
        Asset a = new Asset();
        a.setId(UUID.randomUUID());
        a.setPath("/dam/photo.jpg");
        a.setMimeType("image/jpeg");
        a.setStorageKey("originals/uuid/photo.jpg");
        a.setStatus(AssetStatus.ACTIVE);
        a.setRenditions(new ArrayList<>());
        return a;
    }

    private Asset nonImageAsset() {
        Asset a = new Asset();
        a.setId(UUID.randomUUID());
        a.setPath("/dam/doc.pdf");
        a.setMimeType("application/pdf");
        a.setStorageKey("originals/uuid/doc.pdf");
        a.setRenditions(new ArrayList<>());
        return a;
    }

    // ── generateRenditions (async, called for images) ─────────────────────────

    @Test
    void generateRenditions_nonImage_skipsProcessing() {
        Asset pdf = nonImageAsset();
        byte[] data = "fake-pdf".getBytes();

        renditionPipelineService.generateRenditions(pdf, data);

        verify(imageProcessor, never()).resize(any(), anyInt(), anyInt(), anyString(), anyInt());
        verify(imageProcessor, never()).cropToFill(any(), anyInt(), anyInt(), anyString());
        verify(s3Service, never()).upload(anyString(), any(), anyString());
    }

    @Test
    void generateRenditions_image_generatesAndUploadsRenditions() {
        Asset asset = imageAsset();
        byte[] data = "fake-image".getBytes();
        byte[] resized = "resized".getBytes();
        byte[] cropped = "cropped".getBytes();
        ImageProcessingService.ImageDimensions dims =
                new ImageProcessingService.ImageDimensions(480, 270);

        // "thumbnail" uses cropToFill, others use resize
        when(imageProcessor.cropToFill(any(), anyInt(), anyInt(), anyString())).thenReturn(cropped);
        when(imageProcessor.resize(any(), anyInt(), anyInt(), anyString(), anyInt())).thenReturn(resized);
        when(imageProcessor.getDimensions(any())).thenReturn(dims);

        renditionPipelineService.generateRenditions(asset, data);

        // Should upload renditions (4 auto-generate profiles)
        verify(s3Service, atLeast(1)).upload(anyString(), any(), anyString());
        // Should save the asset with renditions
        verify(assetRepository).save(asset);
        assertThat(asset.getRenditions()).isNotEmpty();
    }

    @Test
    void generateRenditions_image_renditionKeysUsedAsS3KeyPrefix() {
        Asset asset = imageAsset();
        byte[] data = "fake-image".getBytes();
        byte[] processed = "processed".getBytes();

        when(imageProcessor.cropToFill(any(), anyInt(), anyInt(), anyString())).thenReturn(processed);
        when(imageProcessor.resize(any(), anyInt(), anyInt(), anyString(), anyInt())).thenReturn(processed);
        when(imageProcessor.getDimensions(any())).thenReturn(
                new ImageProcessingService.ImageDimensions(960, 540));

        renditionPipelineService.generateRenditions(asset, data);

        // Each rendition storage key should contain the asset ID and profile name
        for (AssetRendition rendition : asset.getRenditions()) {
            assertThat(rendition.getStorageKey())
                    .startsWith("renditions/" + asset.getId() + "/");
            assertThat(rendition.getRenditionKey()).isNotBlank();
            assertThat(rendition.getFormat()).isNotBlank();
        }
    }

    @Test
    void generateRenditions_processingError_continuesWithOtherProfiles() {
        Asset asset = imageAsset();
        byte[] data = "fake-image".getBytes();
        byte[] processed = "processed".getBytes();

        // Simulate that resize throws for some calls but not all
        when(imageProcessor.cropToFill(any(), anyInt(), anyInt(), anyString()))
                .thenThrow(new RuntimeException("processing error"));
        when(imageProcessor.resize(any(), anyInt(), anyInt(), anyString(), anyInt()))
                .thenReturn(processed);
        when(imageProcessor.getDimensions(any())).thenReturn(
                new ImageProcessingService.ImageDimensions(480, 270));

        // Should not throw — errors are caught per-profile
        renditionPipelineService.generateRenditions(asset, data);

        // Some renditions should still be created (the non-cover ones)
        assertThat(asset.getRenditions()).isNotEmpty();
    }

    // ── generateRendition (on-demand) ─────────────────────────────────────────

    @Test
    void generateRendition_unknownProfile_throws() {
        Asset asset = imageAsset();

        assertThatThrownBy(() -> renditionPipelineService.generateRendition(asset, "unknown-profile"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unknown rendition profile: unknown-profile");
    }

    @Test
    void generateRendition_thumbnail_usesCropToFill() {
        Asset asset = imageAsset();
        byte[] original = "original".getBytes();
        byte[] cropped = "cropped".getBytes();

        when(s3Service.download(asset.getStorageKey())).thenReturn(original);
        when(imageProcessor.cropToFill(eq(original), eq(200), eq(200), eq("jpeg"))).thenReturn(cropped);
        when(imageProcessor.getDimensions(cropped)).thenReturn(
                new ImageProcessingService.ImageDimensions(200, 200));

        AssetRendition result = renditionPipelineService.generateRendition(asset, "thumbnail");

        assertThat(result.getRenditionKey()).isEqualTo("thumbnail");
        assertThat(result.getFormat()).isEqualTo("jpeg");
        assertThat(result.getWidth()).isEqualTo(200);
        assertThat(result.getHeight()).isEqualTo(200);
        assertThat(result.getMimeType()).isEqualTo("image/jpeg");
        verify(assetRepository).save(asset);
    }

    @Test
    void generateRendition_webSmall_usesResize() {
        Asset asset = imageAsset();
        byte[] original = "original".getBytes();
        byte[] resized = "resized".getBytes();

        when(s3Service.download(asset.getStorageKey())).thenReturn(original);
        when(imageProcessor.resize(eq(original), eq(480), eq(0), eq("jpeg"), eq(85)))
                .thenReturn(resized);
        when(imageProcessor.getDimensions(resized)).thenReturn(
                new ImageProcessingService.ImageDimensions(480, 270));

        AssetRendition result = renditionPipelineService.generateRendition(asset, "web-small");

        assertThat(result.getRenditionKey()).isEqualTo("web-small");
        assertThat(result.getWidth()).isEqualTo(480);
        assertThat(result.getHeight()).isEqualTo(270);
        verify(s3Service).upload(
                contains("web-small"), eq(resized), eq("image/jpeg"));
    }

    @Test
    void generateRendition_addsRenditionToAssetAndSaves() {
        Asset asset = imageAsset();
        byte[] original = "original".getBytes();
        byte[] resized = "resized".getBytes();

        when(s3Service.download(asset.getStorageKey())).thenReturn(original);
        when(imageProcessor.resize(any(), anyInt(), anyInt(), anyString(), anyInt())).thenReturn(resized);
        when(imageProcessor.getDimensions(resized)).thenReturn(null);

        renditionPipelineService.generateRendition(asset, "web-medium");

        assertThat(asset.getRenditions()).hasSize(1);
        verify(assetRepository).save(asset);
    }

    // ── getProfiles ───────────────────────────────────────────────────────────

    @Test
    void getProfiles_returnsAllDefinedProfiles() {
        var profiles = renditionPipelineService.getProfiles();
        assertThat(profiles).containsKeys(
                "thumbnail", "web-small", "web-medium", "web-large",
                "hero-desktop", "hero-mobile", "og-image");
    }
}
