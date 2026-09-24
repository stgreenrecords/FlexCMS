package com.flexcms.author.controller;

import com.flexcms.author.service.AssetPublicationService;
import com.flexcms.author.service.AssetPublicationService.AssetPublicationResult;
import com.flexcms.core.repository.AssetFolderSummary;
import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.exception.ValidationException;
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
import java.util.List;
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

    @Autowired
    private AssetPublicationService publicationService;

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

    @Operation(summary = "List DAM folders",
            description = "Returns every folder holding at least one active asset, with its direct asset count. "
                    + "Folders are derived from asset paths, so a folder with no assets of its own is implied by "
                    + "its descendants rather than listed.")
    @GetMapping("/folders")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR','CONTENT_REVIEWER','CONTENT_PUBLISHER')")
    public ResponseEntity<Map<String, Object>> listFolders(
            @RequestParam(required = false) String siteId) {
        List<AssetFolderSummary> folders = assetService.listFolders(siteId);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("folders", folders);
        response.put("totalCount", folders.size());
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
        if (q != null && !q.isBlank()) {
            // The underlying query filters by an exact site_id match — there is no
            // cross-site search — so a missing siteId cannot mean "search everywhere".
            // It previously defaulted silently to a hardcoded "corporate" site, so a
            // caller searching any other site got an empty result with no indication
            // anything was wrong. Require it explicitly instead, matching upload()
            // and listFolder() in this same controller.
            if (siteId == null || siteId.isBlank()) {
                throw new ValidationException("siteId is required when searching with 'q'");
            }
            result = assetService.searchAssets(siteId, q, page, size);
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

    @Operation(summary = "Publish asset",
            description = "Replicates the asset to the publish tier, where /dam/renditions/{id} starts serving it. "
                    + "Assets referenced by published content are published automatically; use this for the rest.")
    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_PUBLISHER')")
    public ResponseEntity<AssetPublicationResult> publishAsset(
            @PathVariable UUID id,
            @RequestParam(required = false) String userId) {
        return ResponseEntity.ok(publicationService.publish(id, userId));
    }

    @Operation(summary = "Unpublish asset",
            description = "Withdraws the asset from the publish tier; it stays on author. Its public URL answers 404 "
                    + "on publish afterwards.")
    @PostMapping("/{id}/unpublish")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_PUBLISHER')")
    public ResponseEntity<AssetPublicationResult> unpublishAsset(
            @PathVariable UUID id,
            @RequestParam(required = false) String userId) {
        return ResponseEntity.ok(publicationService.unpublish(id, userId));
    }

    @Operation(summary = "Delete asset", description = "Deletes an asset from the DAM and object storage by its path.")
    @DeleteMapping
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR')")
    public ResponseEntity<Void> deleteAsset(
            @NotBlank(message = "path is required") @RequestParam String path,
            @RequestParam(required = false) String userId) {
        assetService.deleteAsset(path, userId);
        return ResponseEntity.ok().build();
    }
}
