package com.flexcms.pim.importer;

import java.io.InputStream;
import java.util.Map;
import java.util.stream.Stream;

/**
 * SPI for product import sources.
 *
 * <p>Implement this interface to support importing products from new formats
 * (CSV, Excel, JSON, external API, ERP feed, etc.). Register as a Spring bean
 * and the ImportService will auto-discover it.</p>
 */
public interface ProductImportSource {

    /** Source type identifier (e.g., "CSV", "EXCEL", "JSON", "API") */
    String getSourceType();

    /**
     * Parse the input stream into a stream of raw product records.
     * Each record is a flat key→value map from the source format.
     * Field mapping (source keys → schema attributes) is applied later by ImportService.
     */
    Stream<Map<String, Object>> parse(InputStream input, ImportConfig config);

    /**
     * (Optional) Auto-detect the schema from the source.
     * Returns a draft schema definition inferred from headers / sample data.
     */
    default Map<String, Object> inferSchema(InputStream input, ImportConfig config) {
        return Map.of();
    }
}

