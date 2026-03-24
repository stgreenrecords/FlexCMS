package com.flexcms.pim.importer;

import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.*;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

/**
 * CSV import source — parses CSV files into raw product records.
 */
@Component
public class CsvImportSource implements ProductImportSource {

    @Override
    public String getSourceType() {
        return "CSV";
    }

    @Override
    public Stream<Map<String, Object>> parse(InputStream input, ImportConfig config) {
        try {
            CSVReader reader = new CSVReaderBuilder(new InputStreamReader(input))
                    .build();

            String[] headers = reader.readNext();
            if (headers == null) return Stream.empty();

            // Trim headers
            for (int i = 0; i < headers.length; i++) {
                headers[i] = headers[i].trim();
            }

            final String[] finalHeaders = headers;
            Iterator<String[]> iterator = reader.iterator();

            Spliterator<Map<String, Object>> spliterator = Spliterators.spliteratorUnknownSize(
                    new Iterator<>() {
                        @Override
                        public boolean hasNext() { return iterator.hasNext(); }

                        @Override
                        public Map<String, Object> next() {
                            String[] row = iterator.next();
                            Map<String, Object> record = new LinkedHashMap<>();
                            for (int i = 0; i < finalHeaders.length && i < row.length; i++) {
                                String value = row[i] != null ? row[i].trim() : "";
                                if (!value.isEmpty()) {
                                    record.put(finalHeaders[i], value);
                                }
                            }
                            return record;
                        }
                    },
                    Spliterator.ORDERED
            );

            return StreamSupport.stream(spliterator, false);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse CSV", e);
        }
    }

    @Override
    public Map<String, Object> inferSchema(InputStream input, ImportConfig config) {
        try {
            CSVReader reader = new CSVReaderBuilder(new InputStreamReader(input)).build();
            String[] headers = reader.readNext();
            if (headers == null) return Map.of();

            // Build a draft JSON Schema from the header row
            Map<String, Object> properties = new LinkedHashMap<>();
            for (String header : headers) {
                String h = header.trim();
                properties.put(h, Map.of("type", "string", "label", h));
            }

            return Map.of(
                    "$schema", "http://json-schema.org/draft-07/schema#",
                    "type", "object",
                    "properties", properties
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to infer schema from CSV", e);
        }
    }
}

