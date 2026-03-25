package com.flexcms.dam.service;

import com.flexcms.core.model.Asset;
import com.flexcms.core.model.AssetStatus;
import com.flexcms.core.repository.AssetRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssetIngestServiceTest {

    @Mock private AssetRepository assetRepository;
    @Mock private S3Service s3Service;
    @Mock private ImageProcessingService imageProcessor;
    @Mock private RenditionPipelineService renditionPipeline;

    @InjectMocks
    private AssetIngestService assetIngestService;

    // ── Fixture helpers ───────────────────────────────────────────────────────

    private Asset savedAsset(String path, String mimeType) {
        Asset a = new Asset();
        a.setId(UUID.randomUUID());
        a.setPath(path);
        a.setName("logo.png");
        a.setMimeType(mimeType);
        a.setStorageKey("originals/uuid/logo.png");
        a.setStatus(AssetStatus.ACTIVE);
        return a;
    }

    // ── ingest ─────────────────────────────────────────────────────────────────

    @Test
    void ingest_uploadsToS3AndSavesAsset() {
        byte[] data = new byte[]{1, 2, 3};
        Asset saved = savedAsset("/content/dam/logo.png", "image/png");
        when(s3Service.getDefaultBucket()).thenReturn("flexcms-assets");
        when(assetRepository.save(any())).thenReturn(saved);

        Asset result = assetIngestService.ingest("/content/dam/logo.png", "logo.png",
                data, "corporate", "alice");

        verify(s3Service).upload(anyString(), eq(data), anyString());
        verify(assetRepository, atLeastOnce()).save(any(Asset.class));
        assertThat(result).isNotNull();
    }

    @Test
    void ingest_setsCorrectFields() {
        byte[] data = "fake-image-data".getBytes();
        when(s3Service.getDefaultBucket()).thenReturn("flexcms-assets");

        ArgumentCaptor<Asset> captor = ArgumentCaptor.forClass(Asset.class);
        when(assetRepository.save(captor.capture())).thenAnswer(inv -> inv.getArgument(0));

        assetIngestService.ingest("/content/dam/hero.jpg", "hero.jpg", data, "corporate", "alice");

        Asset captured = captor.getAllValues().get(0);
        assertThat(captured.getPath()).isEqualTo("/content/dam/hero.jpg");
        assertThat(captured.getName()).isEqualTo("hero.jpg");
        assertThat(captured.getOriginalFilename()).isEqualTo("hero.jpg");
        assertThat(captured.getFileSize()).isEqualTo(data.length);
        assertThat(captured.getSiteId()).isEqualTo("corporate");
        assertThat(captured.getCreatedBy()).isEqualTo("alice");
        assertThat(captured.getStorageBucket()).isEqualTo("flexcms-assets");
        assertThat(captured.getFolderPath()).isEqualTo("/content/dam");
    }

    @Test
    void ingest_nonImageAsset_doesNotCallImageProcessor() {
        byte[] data = "fake-pdf-data".getBytes();
        when(s3Service.getDefaultBucket()).thenReturn("flexcms-assets");
        when(assetRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // Tika detects fake bytes as application/octet-stream — not image/
        assetIngestService.ingest("/dam/photo.png", "photo.png", data, "corp", "alice");

        // getDimensions should NOT be called since MIME is not image/*
        verify(imageProcessor, never()).getDimensions(any());
    }

    @Test
    void ingest_triggersRenditionPipeline() {
        byte[] data = new byte[]{1, 2, 3};
        when(s3Service.getDefaultBucket()).thenReturn("flexcms-assets");
        when(assetRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        assetIngestService.ingest("/dam/file.pdf", "file.pdf", data, "corp", "alice");

        verify(renditionPipeline).generateRenditions(any(Asset.class), eq(data));
    }

    @Test
    void ingest_setsStatusActive() {
        byte[] data = new byte[]{1, 2, 3};
        when(s3Service.getDefaultBucket()).thenReturn("flexcms-assets");

        ArgumentCaptor<Asset> captor = ArgumentCaptor.forClass(Asset.class);
        when(assetRepository.save(captor.capture())).thenAnswer(inv -> inv.getArgument(0));

        assetIngestService.ingest("/dam/doc.pdf", "doc.pdf", data, "corp", "alice");

        // Second save should have ACTIVE status
        Asset lastSaved = captor.getAllValues().get(captor.getAllValues().size() - 1);
        assertThat(lastSaved.getStatus()).isEqualTo(AssetStatus.ACTIVE);
    }

    // ── getAsset / getAssetById ────────────────────────────────────────────────

    @Test
    void getAsset_found_returnsAsset() {
        Asset a = savedAsset("/dam/logo.png", "image/png");
        when(assetRepository.findByPath("/dam/logo.png")).thenReturn(Optional.of(a));

        assertThat(assetIngestService.getAsset("/dam/logo.png")).contains(a);
    }

    @Test
    void getAsset_notFound_returnsEmpty() {
        when(assetRepository.findByPath("/dam/missing.png")).thenReturn(Optional.empty());
        assertThat(assetIngestService.getAsset("/dam/missing.png")).isEmpty();
    }

    @Test
    void getAssetById_found_returnsAsset() {
        UUID id = UUID.randomUUID();
        Asset a = savedAsset("/dam/logo.png", "image/png");
        when(assetRepository.findById(id)).thenReturn(Optional.of(a));

        assertThat(assetIngestService.getAssetById(id)).contains(a);
    }

    // ── getRenditionUrl ───────────────────────────────────────────────────────

    @Test
    void getRenditionUrl_assetNotFound_returnsNull() {
        when(assetRepository.findByPath("/dam/missing.png")).thenReturn(Optional.empty());

        assertThat(assetIngestService.getRenditionUrl("/dam/missing.png", "thumbnail")).isNull();
    }

    @Test
    void getRenditionUrl_noRendition_returnsOriginalKey() {
        Asset a = savedAsset("/dam/logo.png", "image/png");
        when(assetRepository.findByPath("/dam/logo.png")).thenReturn(Optional.of(a));

        // No renditions → falls back to storageKey
        String url = assetIngestService.getRenditionUrl("/dam/logo.png", "thumbnail");
        assertThat(url).isEqualTo(a.getStorageKey());
    }

    // ── deleteAsset ───────────────────────────────────────────────────────────

    @Test
    void deleteAsset_notFound_doesNothing() {
        when(assetRepository.findByPath("/dam/missing.png")).thenReturn(Optional.empty());

        assetIngestService.deleteAsset("/dam/missing.png");

        verify(assetRepository, never()).delete(any());
        verify(s3Service, never()).delete(any());
    }

    @Test
    void deleteAsset_deletesFromS3AndRepository() {
        Asset a = savedAsset("/dam/logo.png", "image/png");
        when(assetRepository.findByPath("/dam/logo.png")).thenReturn(Optional.of(a));

        assetIngestService.deleteAsset("/dam/logo.png");

        verify(s3Service).delete(a.getStorageKey());
        verify(assetRepository).delete(a);
    }

    // ── listFolder ─────────────────────────────────────────────────────────────

    @Test
    void listFolder_returnsAssetsFromRepository() {
        Asset a = savedAsset("/dam/images/logo.png", "image/png");
        Page<Asset> page = new PageImpl<>(List.of(a));
        when(assetRepository.findByFolderPathAndStatus(
                eq("/dam/images"), eq(AssetStatus.ACTIVE), any(Pageable.class)))
                .thenReturn(page);

        Page<Asset> result = assetIngestService.listFolder("/dam/images", "corporate", 0, 50);

        assertThat(result.getContent()).hasSize(1).containsExactly(a);
    }

    // ── searchAssets ──────────────────────────────────────────────────────────

    @Test
    void searchAssets_delegatesToRepository() {
        Asset a = savedAsset("/dam/logo.png", "image/png");
        Page<Asset> page = new PageImpl<>(List.of(a));
        when(assetRepository.search(eq("corporate"), eq("logo"), any(Pageable.class)))
                .thenReturn(page);

        Page<Asset> result = assetIngestService.searchAssets("corporate", "logo", 0, 50);

        assertThat(result.getContent()).containsExactly(a);
    }
}
