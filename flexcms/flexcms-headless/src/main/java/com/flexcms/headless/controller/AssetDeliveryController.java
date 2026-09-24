package com.flexcms.headless.controller;

import com.flexcms.dam.service.AssetDeliveryService;
import com.flexcms.dam.service.DeliverableAsset;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Public delivery of DAM asset binaries on both tiers.
 *
 * <p>This is the URL content references ({@code AssetUrls}). Before it existed the only
 * asset URL was the author-only, role-guarded streaming endpoint, so every image on a
 * published page was broken ({@code R-REB-21-003}). {@code SecurityConfig} has permitted
 * {@code GET /dam/renditions/**} all along and {@code PublishPageController} excludes
 * {@code /dam/**} from its catch-all; nothing answered it.</p>
 *
 * <p>Responses are cacheable for a day and carry an {@code ETag}; replacing or withdrawing
 * an asset on publish purges these URLs from the CDN (see
 * {@code AssetCdnPurgeListener} in {@code flexcms-publish}).</p>
 */
@Tag(name = "Asset Delivery", description = "Public, cacheable delivery of DAM asset binaries and renditions")
@RestController
public class AssetDeliveryController {

    static final String CACHE_CONTROL = "public, max-age=86400";

    /**
     * Uploaded files are served from the API origin, and the DAM accepts SVG, which can
     * carry script. The sandbox keeps a directly opened asset from running anything; it
     * has no effect when the asset is used as an image, font, or stylesheet.
     */
    static final String CONTENT_SECURITY_POLICY = "default-src 'none'; img-src 'self' data:; "
            + "style-src 'unsafe-inline'; sandbox";

    @Autowired
    private AssetDeliveryService deliveryService;

    @Operation(summary = "Get asset original",
            description = "Streams the original binary of an asset available on this tier. "
                    + "404 when the asset does not exist here or is not active.")
    @GetMapping("/dam/renditions/{assetId}")
    public ResponseEntity<byte[]> original(
            @PathVariable UUID assetId,
            @RequestHeader(value = HttpHeaders.IF_NONE_MATCH, required = false) String ifNoneMatch) {
        return serve(deliveryService.resolve(assetId, null), ifNoneMatch);
    }

    @Operation(summary = "Get asset rendition",
            description = "Streams a rendition of an asset; falls back to the original when the rendition "
                    + "was never generated.")
    @GetMapping("/dam/renditions/{assetId}/{renditionKey}")
    public ResponseEntity<byte[]> rendition(
            @PathVariable UUID assetId,
            @PathVariable String renditionKey,
            @RequestHeader(value = HttpHeaders.IF_NONE_MATCH, required = false) String ifNoneMatch) {
        return serve(deliveryService.resolve(assetId, renditionKey), ifNoneMatch);
    }

    private ResponseEntity<byte[]> serve(DeliverableAsset asset, String ifNoneMatch) {
        if (matches(ifNoneMatch, asset.etag())) {
            // Answer before reading the object store: a revalidation costs one DB lookup.
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED)
                    .header(HttpHeaders.ETAG, asset.etag())
                    .header(HttpHeaders.CACHE_CONTROL, CACHE_CONTROL)
                    .build();
        }
        byte[] data = deliveryService.load(asset);
        String mimeType = asset.mimeType() != null ? asset.mimeType() : "application/octet-stream";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, mimeType)
                .header(HttpHeaders.CACHE_CONTROL, CACHE_CONTROL)
                .header(HttpHeaders.ETAG, asset.etag())
                .header("X-Content-Type-Options", "nosniff")
                .header("Content-Security-Policy", CONTENT_SECURITY_POLICY)
                .contentLength(data.length)
                .body(data);
    }

    /** RFC 9110 weak comparison: {@code *}, a list, and {@code W/} prefixes are all accepted. */
    static boolean matches(String ifNoneMatch, String etag) {
        if (ifNoneMatch == null || ifNoneMatch.isBlank()) {
            return false;
        }
        for (String candidate : ifNoneMatch.split(",")) {
            String tag = candidate.trim();
            if (tag.equals("*")) {
                return true;
            }
            if (tag.startsWith("W/")) {
                tag = tag.substring(2);
            }
            if (tag.equals(etag)) {
                return true;
            }
        }
        return false;
    }
}
