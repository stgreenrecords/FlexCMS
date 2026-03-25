package com.flexcms.author.controller;

import com.flexcms.core.service.ContentExportService;
import com.flexcms.core.service.ContentImportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * REST API for importing and exporting content subtrees.
 *
 * <ul>
 *   <li>{@code GET /api/author/content/export?path=...&format=json} — export as JSON</li>
 *   <li>{@code GET /api/author/content/export?path=...&format=zip} — export as ZIP</li>
 *   <li>{@code POST /api/author/content/import} — import from JSON or ZIP file upload</li>
 * </ul>
 */
@Tag(name = "Author Content Import/Export", description = "Export and import content subtrees as JSON or ZIP archives")
@RestController
@RequestMapping("/api/author/content")
public class ContentImportExportController {

    @Autowired
    private ContentExportService exportService;

    @Autowired
    private ContentImportService importService;

    // -------------------------------------------------------------------------
    // Export
    // -------------------------------------------------------------------------

    /**
     * Export a content subtree.
     *
     * @param path   content path in URL format (e.g., {@code /content/corporate/en/about})
     *               or ltree format ({@code content.corporate.en.about})
     * @param format {@code json} (default) or {@code zip}
     * @return the exported content as a downloadable file
     */
    @Operation(summary = "Export content subtree as JSON or ZIP")
    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR','CONTENT_REVIEWER')")
    public ResponseEntity<byte[]> export(
            @NotBlank(message = "path is required") @RequestParam String path,
            @RequestParam(defaultValue = "json") String format) {

        String contentPath = toContentPath(path);
        String filename = deriveFilename(contentPath);

        if ("zip".equalsIgnoreCase(format)) {
            byte[] zipBytes = exportService.exportZip(contentPath);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            ContentDisposition.attachment().filename(filename + ".zip").build().toString())
                    .contentType(MediaType.parseMediaType("application/zip"))
                    .body(zipBytes);
        }

        byte[] jsonBytes = exportService.exportJson(contentPath);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filename + ".json").build().toString())
                .contentType(MediaType.APPLICATION_JSON)
                .body(jsonBytes);
    }

    // -------------------------------------------------------------------------
    // Import
    // -------------------------------------------------------------------------

    /**
     * Import content from an uploaded JSON or ZIP file.
     *
     * <p>The file must be a valid export package produced by the export endpoint.
     * Accepted MIME types: {@code application/json}, {@code application/zip},
     * {@code application/octet-stream} (detected from file extension).</p>
     *
     * @param file              the uploaded file (JSON or ZIP)
     * @param overwriteExisting if {@code true}, overwrite nodes that already exist
     * @return import result summary
     */
    @Operation(summary = "Import content from a JSON or ZIP export package")
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR')")
    public ResponseEntity<ContentImportService.ImportResult> importContent(
            @RequestPart("file") MultipartFile file,
            @RequestParam(defaultValue = "false") boolean overwriteExisting) throws IOException {

        String filename = file.getOriginalFilename();
        ContentImportService.ImportResult result;

        if (filename != null && filename.toLowerCase().endsWith(".zip")) {
            result = importService.importZipStream(file.getInputStream(), overwriteExisting);
        } else {
            result = importService.importJson(file.getBytes(), overwriteExisting);
        }

        return ResponseEntity.ok(result);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private String toContentPath(String path) {
        String p = path.startsWith("/") ? path.substring(1) : path;
        p = p.replace("/", ".");
        return p.startsWith("content.") ? p : "content." + p;
    }

    /**
     * Derive a safe filename from a content path (e.g., {@code content.corporate.en.about} → {@code about}).
     */
    private String deriveFilename(String contentPath) {
        String[] parts = contentPath.split("\\.");
        return parts.length > 0 ? parts[parts.length - 1] : "content-export";
    }
}
