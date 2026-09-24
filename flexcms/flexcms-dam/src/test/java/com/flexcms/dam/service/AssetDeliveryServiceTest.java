package com.flexcms.dam.service;

import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.model.Asset;
import com.flexcms.core.model.AssetRendition;
import com.flexcms.core.model.AssetStatus;
import com.flexcms.core.repository.AssetRenditionRepository;
import com.flexcms.core.repository.AssetRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AssetDeliveryServiceTest {

    @Mock private AssetRepository assetRepository;
    @Mock private AssetRenditionRepository renditionRepository;
    @Mock private S3Service s3Service;

    @InjectMocks
    private AssetDeliveryService deliveryService;

    private final UUID id = UUID.randomUUID();

    private Asset asset(AssetStatus status) {
        Asset a = new Asset();
        a.setId(id);
        a.setPath("/content/dam/site/logo.png");
        a.setMimeType("image/png");
        a.setFileSize(1234L);
        a.setStorageKey("originals/abc/logo.png");
        a.setStorageBucket("flexcms-assets");
        a.setStatus(status);
        return a;
    }

    private AssetRendition rendition(String key, Instant generatedAt) {
        AssetRendition r = new AssetRendition();
        r.setRenditionKey(key);
        r.setStorageKey("renditions/" + id + "/" + key + ".webp");
        r.setMimeType("image/webp");
        r.setFileSize(99L);
        r.setGeneratedAt(generatedAt);
        return r;
    }

    @Test
    void resolve_original_returnsStorageLocationAndQuotedEtag() {
        when(assetRepository.findById(id)).thenReturn(Optional.of(asset(AssetStatus.ACTIVE)));

        DeliverableAsset d = deliveryService.resolve(id, null);

        assertThat(d.bucket()).isEqualTo("flexcms-assets");
        assertThat(d.storageKey()).isEqualTo("originals/abc/logo.png");
        assertThat(d.mimeType()).isEqualTo("image/png");
        assertThat(d.fileSize()).isEqualTo(1234L);
        assertThat(d.etag()).startsWith("\"").endsWith("\"").hasSize(34);
        verify(renditionRepository, never()).findByAssetIdAndRenditionKey(any(), any());
    }

    @Test
    void resolve_rendition_servesRenditionWithItsOwnTypeAndEtag() {
        when(assetRepository.findById(id)).thenReturn(Optional.of(asset(AssetStatus.ACTIVE)));
        when(renditionRepository.findByAssetIdAndRenditionKey(id, "thumbnail"))
                .thenReturn(Optional.of(rendition("thumbnail", Instant.parse("2026-09-01T00:00:00Z"))));

        DeliverableAsset d = deliveryService.resolve(id, "thumbnail");
        DeliverableAsset original = deliveryService.resolve(id, null);

        assertThat(d.storageKey()).isEqualTo("renditions/" + id + "/thumbnail.webp");
        assertThat(d.mimeType()).isEqualTo("image/webp");
        assertThat(d.etag()).isNotEqualTo(original.etag());
    }

    @Test
    void resolve_regeneratedRendition_changesEtag_evenThoughStorageKeyIsReused() {
        when(assetRepository.findById(id)).thenReturn(Optional.of(asset(AssetStatus.ACTIVE)));
        when(renditionRepository.findByAssetIdAndRenditionKey(id, "thumbnail"))
                .thenReturn(Optional.of(rendition("thumbnail", Instant.parse("2026-09-01T00:00:00Z"))))
                .thenReturn(Optional.of(rendition("thumbnail", Instant.parse("2026-09-02T00:00:00Z"))));

        String first = deliveryService.resolve(id, "thumbnail").etag();
        String second = deliveryService.resolve(id, "thumbnail").etag();

        assertThat(first).isNotEqualTo(second);
    }

    @Test
    void resolve_missingRendition_fallsBackToOriginal() {
        when(assetRepository.findById(id)).thenReturn(Optional.of(asset(AssetStatus.ACTIVE)));
        when(renditionRepository.findByAssetIdAndRenditionKey(id, "hero-desktop")).thenReturn(Optional.empty());

        DeliverableAsset d = deliveryService.resolve(id, "hero-desktop");

        assertThat(d.storageKey()).isEqualTo("originals/abc/logo.png");
        assertThat(d.mimeType()).isEqualTo("image/png");
    }

    @Test
    void resolve_unknownAsset_isNotFound() {
        // On publish this is the unpublished-asset case: the row was never replicated.
        when(assetRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> deliveryService.resolve(id, null)).isInstanceOf(NotFoundException.class);
    }

    @Test
    void resolve_inactiveAsset_isNotFound() {
        when(assetRepository.findById(id)).thenReturn(Optional.of(asset(AssetStatus.PROCESSING)));

        assertThatThrownBy(() -> deliveryService.resolve(id, null)).isInstanceOf(NotFoundException.class);
    }

    @Test
    void resolve_malformedRenditionKey_isNotFound_withoutTouchingTheDatabase() {
        assertThatThrownBy(() -> deliveryService.resolve(id, "..%2Foriginals"))
                .isInstanceOf(NotFoundException.class);

        verify(assetRepository, never()).findById(any());
    }

    @Test
    void resolve_assetWithoutBucket_usesDefaultBucket() {
        Asset a = asset(AssetStatus.ACTIVE);
        a.setStorageBucket(null);
        when(assetRepository.findById(id)).thenReturn(Optional.of(a));
        lenient().when(s3Service.getDefaultBucket()).thenReturn("default-bucket");

        assertThat(deliveryService.resolve(id, null).bucket()).isEqualTo("default-bucket");
    }

    @Test
    void load_readsFromTheResolvedBucketAndKey() {
        DeliverableAsset d = new DeliverableAsset("b", "k", "image/png", 3L, "\"e\"");
        when(s3Service.download("b", "k")).thenReturn(new byte[]{1, 2, 3});

        assertThat(deliveryService.load(d)).containsExactly(1, 2, 3);
    }
}
