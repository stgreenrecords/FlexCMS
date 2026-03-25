package com.flexcms.core.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.model.ContentNode;
import com.flexcms.core.repository.ContentNodeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Exports content subtrees as JSON packages or ZIP archives.
 *
 * <h3>Export package format</h3>
 * <pre>
 * {
 *   "version": "1.0",
 *   "exportedAt": "2024-06-15T10:00:00Z",
 *   "rootPath": "content.corporate.en.about",
 *   "nodes": [ ... ]
 * }
 * </pre>
 *
 * <p>ZIP format wraps the same JSON as {@code content.json} inside a zip archive.
 * This allows future extensions (asset binaries, etc.) without breaking the format.</p>
 */
@Service
public class ContentExportService {

    private static final Logger log = LoggerFactory.getLogger(ContentExportService.class);

    private static final String PACKAGE_VERSION = "1.0";
    private static final String ZIP_ENTRY_NAME = "content.json";

    @Autowired
    private ContentNodeRepository nodeRepository;

    private final ObjectMapper objectMapper;

    public ContentExportService() {
        this.objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    /**
     * Build an export package for the subtree rooted at {@code rootPath}.
     *
     * @param rootPath the content path of the subtree root (ltree format)
     * @return the export package
     */
    @Transactional(readOnly = true)
    public ExportPackage buildPackage(String rootPath) {
        ContentNode root = nodeRepository.findByPath(rootPath)
                .orElseThrow(() -> NotFoundException.forPath(rootPath));

        List<ContentNode> descendants = nodeRepository.findDescendants(rootPath);

        List<ContentNode> all = new ArrayList<>();
        all.add(root);
        all.addAll(descendants);

        log.debug("Exporting subtree root={}, total nodes={}", rootPath, all.size());

        return new ExportPackage(PACKAGE_VERSION, Instant.now(), rootPath, all);
    }

    /**
     * Export a subtree as JSON bytes.
     *
     * @param rootPath the content path of the subtree root
     * @return UTF-8 encoded JSON bytes
     */
    @Transactional(readOnly = true)
    public byte[] exportJson(String rootPath) {
        ExportPackage pkg = buildPackage(rootPath);
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(pkg);
        } catch (IOException e) {
            throw new ExportException("Failed to serialize content to JSON: " + e.getMessage(), e);
        }
    }

    /**
     * Export a subtree as ZIP bytes (containing {@code content.json}).
     *
     * @param rootPath the content path of the subtree root
     * @return ZIP archive bytes
     */
    @Transactional(readOnly = true)
    public byte[] exportZip(String rootPath) {
        byte[] jsonBytes = exportJson(rootPath);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            ZipEntry entry = new ZipEntry(ZIP_ENTRY_NAME);
            entry.setSize(jsonBytes.length);
            zos.putNextEntry(entry);
            zos.write(jsonBytes);
            zos.closeEntry();
        } catch (IOException e) {
            throw new ExportException("Failed to create ZIP archive: " + e.getMessage(), e);
        }
        return baos.toByteArray();
    }

    /** Structured export package serialized to JSON. */
    public record ExportPackage(
            String version,
            Instant exportedAt,
            String rootPath,
            List<ContentNode> nodes
    ) {}

    /** Thrown when export serialization fails. */
    public static class ExportException extends RuntimeException {
        public ExportException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
