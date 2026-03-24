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

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * Author-side REST API for DAM asset management.
 */
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

    /** List assets in a folder. */
    @GetMapping("/folder")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR','CONTENT_REVIEWER','CONTENT_PUBLISHER')")
    public ResponseEntity<List<Asset>> listFolder(
            @NotBlank(message = "folderPath is required") @RequestParam String folderPath,
            @NotBlank(message = "siteId is required") @RequestParam String siteId) {
        return ResponseEntity.ok(assetService.listFolder(folderPath, siteId));
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
