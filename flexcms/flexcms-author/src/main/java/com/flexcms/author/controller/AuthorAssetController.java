package com.flexcms.author.controller;

import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.model.Asset;
import com.flexcms.dam.service.AssetIngestService;
import com.flexcms.dam.service.S3Service;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Author-side REST API for DAM asset management.
 */
@Tag(name = "Author Assets", description = "DAM asset upload, retrieval, folder listing, and deletion")
@ConditionalOnProperty(name = "flexcms.runmode", havingValue = "author", matchIfMissing = true)
@Validated
@RestController
@RequestMapping("/api/author/assets")
public class AuthorAssetController {

    @Autowired
    private AssetIngestService assetService;

    @Autowired
    private S3Service s3Service;

    @Operation(summary = "Upload asset", description = "Uploads a new asset binary and registers it in the DAM.")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR')")
    public ResponseEntity<Asset> uploadAsset(
            @RequestParam("file") MultipartFile file,
            @NotBlank(message = "path is required") @RequestParam String path,
            @NotBlank(message = "siteId is required") @RequestParam String siteId,
            @NotBlank(message = "userId is required") @RequestParam String userId) throws IOException {
        Asset asset = assetService.ingest(path, file.getOriginalFilename(),
                file.getBytes(), siteId, userId);
        return ResponseEntity.ok(asset);
    }

    @Operation(summary = "Get asset details", description = "Returns asset metadata by ID.")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR','CONTENT_REVIEWER','CONTENT_PUBLISHER')")
    public ResponseEntity<Asset> getAsset(@PathVariable UUID id) {
        return ResponseEntity.ok(
                assetService.getAssetById(id)
                        .orElseThrow(() -> NotFoundException.forId("Asset", id))
        );
    }

    @Operation(summary = "Stream asset content", description = "Streams the raw binary content of an asset from object storage.")
    @GetMapping("/{id}/content")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR','CONTENT_REVIEWER','CONTENT_PUBLISHER')")
    public ResponseEntity<byte[]> streamAssetContent(@PathVariable UUID id) {
        Asset asset = assetService.getAssetById(id)
                .orElseThrow(() -> NotFoundException.forId("Asset", id));
        byte[] data = s3Service.download(asset.getStorageKey());
        String mimeType = asset.getMimeType() != null ? asset.getMimeType() : "application/octet-stream";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, mimeType)
                .header(HttpHeaders.CACHE_CONTROL, "max-age=3600")
                .body(data);
    }

    @Operation(summary = "List assets in folder", description = "Returns paginated assets in a DAM folder.")
    @GetMapping("/folder")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR','CONTENT_REVIEWER','CONTENT_PUBLISHER')")
    public ResponseEntity<Map<String, Object>> listFolder(
            @NotBlank(message = "folderPath is required") @RequestParam String folderPath,
            @NotBlank(message = "siteId is required") @RequestParam String siteId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Page<Asset> result = assetService.listFolder(folderPath, siteId, page, size);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("items", result.getContent());
        response.put("totalCount", result.getTotalElements());
        response.put("page", result.getNumber());
        response.put("size", result.getSize());
        response.put("hasNextPage", result.hasNext());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "List all assets", description = "Returns paginated assets with optional keyword search.")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR','CONTENT_REVIEWER','CONTENT_PUBLISHER')")
    public ResponseEntity<Map<String, Object>> listAll(
            @RequestParam(required = false, defaultValue = "") String q,
            @RequestParam(required = false) String siteId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Page<Asset> result;
        String effectiveSite = (siteId != null && !siteId.isBlank()) ? siteId : "corporate";
        if (q != null && !q.isBlank()) {
            result = assetService.searchAssets(effectiveSite, q, page, size);
        } else {
            result = assetService.listAll(page, size);
        }
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("items", result.getContent());
        response.put("totalCount", result.getTotalElements());
        response.put("page", result.getNumber());
        response.put("size", result.getSize());
        response.put("hasNextPage", result.hasNext());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Delete asset", description = "Deletes an asset from the DAM and object storage by its path.")
    @DeleteMapping
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR')")
    public ResponseEntity<Void> deleteAsset(
            @NotBlank(message = "path is required") @RequestParam String path) {
        assetService.deleteAsset(path);
        return ResponseEntity.ok().build();
    }
}
