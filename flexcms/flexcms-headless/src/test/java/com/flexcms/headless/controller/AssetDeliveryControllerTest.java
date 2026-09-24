package com.flexcms.headless.controller;

import com.flexcms.core.exception.NotFoundException;
import com.flexcms.dam.service.AssetDeliveryService;
import com.flexcms.dam.service.DeliverableAsset;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AssetDeliveryControllerTest {

    @Mock
    private AssetDeliveryService deliveryService;

    @InjectMocks
    private AssetDeliveryController controller;

    private final UUID id = UUID.randomUUID();
    private final DeliverableAsset png =
            new DeliverableAsset("flexcms-assets", "originals/x/logo.png", "image/png", 3L, "\"abc123\"");

    @Test
    void original_streamsBytes_withCacheHeaders() {
        // ECMS-03-TC03/TC04: 200 with a CDN-friendly Cache-Control and a validator.
        when(deliveryService.resolve(id, null)).thenReturn(png);
        when(deliveryService.load(png)).thenReturn(new byte[]{1, 2, 3});

        ResponseEntity<byte[]> res = controller.original(id, null);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).containsExactly(1, 2, 3);
        HttpHeaders h = res.getHeaders();
        assertThat(h.getFirst(HttpHeaders.CONTENT_TYPE)).isEqualTo("image/png");
        assertThat(h.getFirst(HttpHeaders.CACHE_CONTROL)).isEqualTo("public, max-age=86400");
        assertThat(h.getETag()).isEqualTo("\"abc123\"");
        assertThat(h.getContentLength()).isEqualTo(3L);
        assertThat(h.getFirst("X-Content-Type-Options")).isEqualTo("nosniff");
        assertThat(h.getFirst("Content-Security-Policy")).contains("sandbox");
    }

    @Test
    void rendition_passesKeyToService() {
        when(deliveryService.resolve(id, "thumbnail")).thenReturn(png);
        when(deliveryService.load(png)).thenReturn(new byte[]{9});

        ResponseEntity<byte[]> res = controller.rendition(id, "thumbnail", null);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).containsExactly(9);
    }

    @Test
    void matchingIfNoneMatch_answers304_withoutReadingObjectStore() {
        when(deliveryService.resolve(id, null)).thenReturn(png);

        ResponseEntity<byte[]> res = controller.original(id, "\"abc123\"");

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NOT_MODIFIED);
        assertThat(res.getBody()).isNull();
        assertThat(res.getHeaders().getETag()).isEqualTo("\"abc123\"");
        verify(deliveryService, never()).load(any());
    }

    @Test
    void staleIfNoneMatch_streamsFreshBytes() {
        when(deliveryService.resolve(id, null)).thenReturn(png);
        when(deliveryService.load(png)).thenReturn(new byte[]{1});

        assertThat(controller.original(id, "\"old\"").getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void unknownAsset_propagatesNotFound_forRfc7807Mapping() {
        when(deliveryService.resolve(id, null)).thenThrow(NotFoundException.forId("Asset", id));

        assertThatThrownBy(() -> controller.original(id, null)).isInstanceOf(NotFoundException.class);
    }

    @Test
    void matches_handlesListsWildcardAndWeakValidators() {
        assertThat(AssetDeliveryController.matches("\"a\", \"abc123\"", "\"abc123\"")).isTrue();
        assertThat(AssetDeliveryController.matches("W/\"abc123\"", "\"abc123\"")).isTrue();
        assertThat(AssetDeliveryController.matches("*", "\"abc123\"")).isTrue();
        assertThat(AssetDeliveryController.matches("\"zzz\"", "\"abc123\"")).isFalse();
        assertThat(AssetDeliveryController.matches(null, "\"abc123\"")).isFalse();
        assertThat(AssetDeliveryController.matches(" ", "\"abc123\"")).isFalse();
    }

    @Test
    void missingMimeType_defaultsToOctetStream() {
        DeliverableAsset untyped = new DeliverableAsset("b", "k", null, 1L, "\"e\"");
        when(deliveryService.resolve(id, null)).thenReturn(untyped);
        when(deliveryService.load(untyped)).thenReturn(new byte[]{0});

        assertThat(controller.original(id, null).getHeaders().getFirst(HttpHeaders.CONTENT_TYPE))
                .isEqualTo("application/octet-stream");
    }
}
