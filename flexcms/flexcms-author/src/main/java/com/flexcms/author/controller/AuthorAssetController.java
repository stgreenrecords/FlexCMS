package com.flexcms.author.controller;

import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.model.Asset;
import com.flexcms.dam.service.AssetIngestService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * Author-side REST API for DAM asset management.
 */
@RestController
@RequestMapping("/api/author/assets")
public class AuthorAssetController {

    @Autowired
    private AssetIngestService assetService;

    /**
     * Upload a new asset.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Asset> uploadAsset(
            @RequestParam("file") MultipartFile file,
            @RequestParam String path,
            @RequestParam String siteId,
            @RequestParam String userId) throws IOException {
        Asset asset = assetService.ingest(path, file.getOriginalFilename(),
                file.getBytes(), siteId, userId);
        return ResponseEntity.ok(asset);
    }

    /**
     * Get asset details.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Asset> getAsset(@PathVariable UUID id) {
        return ResponseEntity.ok(
                assetService.getAssetById(id)
                        .orElseThrow(() -> NotFoundException.forId("Asset", id))
        );
    }

    /**
     * List assets in a folder.
     */
    @GetMapping("/folder")
    public ResponseEntity<List<Asset>> listFolder(
            @RequestParam String folderPath,
            @RequestParam String siteId) {
        return ResponseEntity.ok(assetService.listFolder(folderPath, siteId));
    }

    /**
     * Delete an asset.
     */
    @DeleteMapping
    public ResponseEntity<Void> deleteAsset(@RequestParam String path) {
        assetService.deleteAsset(path);
        return ResponseEntity.ok().build();
    }
}

