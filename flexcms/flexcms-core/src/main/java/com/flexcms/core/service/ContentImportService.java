package com.flexcms.core.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.flexcms.core.model.ContentNode;
import com.flexcms.core.repository.ContentNodeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Imports content packages (JSON or ZIP) produced by {@link ContentExportService}.
 *
 * <h3>Import behaviour</h3>
 * <ul>
 *   <li>If a node with the same path already exists and {@code overwriteExisting=false}, it is skipped.</li>
 *   <li>If {@code overwriteExisting=true}, existing nodes are replaced.</li>
 *   <li>Nodes that fail to import are recorded in {@link ImportResult#errors} without aborting the rest.</li>
 * </ul>
 */
@Service
public class ContentImportService {

    private static final Logger log = LoggerFactory.getLogger(ContentImportService.class);
    private static final String ZIP_ENTRY_NAME = "content.json";

    @Autowired
    private ContentNodeRepository nodeRepository;

    private final ObjectMapper objectMapper;

    public ContentImportService() {
        this.objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule());
    }

    /**
     * Import content from raw JSON bytes.
     *
     * @param jsonBytes       the JSON package bytes (from {@link ContentExportService#exportJson})
     * @param overwriteExisting if {@code true}, overwrite nodes that already exist at the same path
     * @return a summary of the import operation
     */
    @Transactional
    public ImportResult importJson(byte[] jsonBytes, boolean overwriteExisting) {
        ContentExportService.ExportPackage pkg;
        try {
            pkg = objectMapper.readValue(jsonBytes, ContentExportService.ExportPackage.class);
        } catch (IOException e) {
            return ImportResult.failure("Failed to parse JSON: " + e.getMessage());
        }
        return importPackage(pkg, overwriteExisting);
    }

    /**
     * Import content from ZIP archive bytes (produced by {@link ContentExportService#exportZip}).
     *
     * @param zipBytes         the ZIP archive bytes
     * @param overwriteExisting if {@code true}, overwrite nodes that already exist at the same path
     * @return a summary of the import operation
     */
    @Transactional
    public ImportResult importZip(byte[] zipBytes, boolean overwriteExisting) {
        byte[] jsonBytes = extractJsonFromZip(zipBytes);
        if (jsonBytes == null) {
            return ImportResult.failure("ZIP archive does not contain '" + ZIP_ENTRY_NAME + "'");
        }
        return importJson(jsonBytes, overwriteExisting);
    }

    /**
     * Import content from an InputStream of ZIP data.
     *
     * @param inputStream      the ZIP input stream
     * @param overwriteExisting if {@code true}, overwrite nodes that already exist at the same path
     * @return a summary of the import operation
     */
    @Transactional
    public ImportResult importZipStream(InputStream inputStream, boolean overwriteExisting) {
        try {
            byte[] zipBytes = inputStream.readAllBytes();
            return importZip(zipBytes, overwriteExisting);
        } catch (IOException e) {
            return ImportResult.failure("Failed to read input stream: " + e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private ImportResult importPackage(ContentExportService.ExportPackage pkg, boolean overwriteExisting) {
        if (pkg.nodes() == null || pkg.nodes().isEmpty()) {
            return new ImportResult(0, 0, 0, List.of());
        }

        int created = 0;
        int updated = 0;
        int skipped = 0;
        List<String> errors = new ArrayList<>();

        for (ContentNode node : pkg.nodes()) {
            try {
                if (nodeRepository.existsByPath(node.getPath())) {
                    if (overwriteExisting) {
                        ContentNode existing = nodeRepository.findByPath(node.getPath()).get();
                        existing.setName(node.getName());
                        existing.setResourceType(node.getResourceType());
                        existing.setProperties(node.getProperties());
                        existing.setStatus(node.getStatus());
                        existing.setLocale(node.getLocale());
                        existing.setSiteId(node.getSiteId());
                        existing.setParentPath(node.getParentPath());
                        existing.setOrderIndex(node.getOrderIndex());
                        nodeRepository.save(existing);
                        updated++;
                        log.debug("Updated node: {}", node.getPath());
                    } else {
                        skipped++;
                        log.debug("Skipped existing node: {}", node.getPath());
                    }
                } else {
                    // Clear ID — let JPA assign a new one
                    node.setId(null);
                    nodeRepository.save(node);
                    created++;
                    log.debug("Created node: {}", node.getPath());
                }
            } catch (Exception e) {
                String msg = "Failed to import node '" + node.getPath() + "': " + e.getMessage();
                log.warn(msg);
                errors.add(msg);
            }
        }

        log.info("Import complete: created={}, updated={}, skipped={}, errors={}",
                created, updated, skipped, errors.size());
        return new ImportResult(created, updated, skipped, errors);
    }

    private byte[] extractJsonFromZip(byte[] zipBytes) {
        try (ZipInputStream zis = new ZipInputStream(
                new java.io.ByteArrayInputStream(zipBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (ZIP_ENTRY_NAME.equals(entry.getName())) {
                    return zis.readAllBytes();
                }
                zis.closeEntry();
            }
        } catch (IOException e) {
            log.warn("Failed to read ZIP: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Summary of a content import operation.
     *
     * @param created number of nodes created
     * @param updated number of nodes updated (only when {@code overwriteExisting=true})
     * @param skipped number of nodes skipped (already existed and {@code overwriteExisting=false})
     * @param errors  list of per-node error messages
     */
    public record ImportResult(int created, int updated, int skipped, List<String> errors) {

        public boolean hasErrors() {
            return !errors.isEmpty();
        }

        public int total() {
            return created + updated + skipped + errors.size();
        }

        static ImportResult failure(String message) {
            return new ImportResult(0, 0, 0, List.of(message));
        }
    }
}
