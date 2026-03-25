package com.flexcms.author.controller;

import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.model.Asset;
import com.flexcms.dam.service.AssetIngestService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Author-side REST API for DAM asset management.
 */
@Tag(name = "Author Assets", description = "DAM asset upload, retrieval, folder listing, and deletion")
@Validated
@RestController
@RequestMapping("/api/author/assets")
public class AuthorAssetController {

    @Autowired
    private AssetIngestService assetService;

    /** Upload a new asset. */
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

    /** Get asset details. */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR','CONTENT_REVIEWER','CONTENT_PUBLISHER')")
    public ResponseEntity<Asset> getAsset(@PathVariable UUID id) {
        return ResponseEntity.ok(
                assetService.getAssetById(id)
                        .orElseThrow(() -> NotFoundException.forId("Asset", id))
        );
    }

    /** List assets in a folder with pagination. */
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

    /** Delete an asset. */
    @DeleteMapping
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR')")
    public ResponseEntity<Void> deleteAsset(
            @NotBlank(message = "path is required") @RequestParam String path) {
        assetService.deleteAsset(path);
        return ResponseEntity.ok().build();
    }
}
