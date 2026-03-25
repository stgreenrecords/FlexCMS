package com.flexcms.pim.importer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.*;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

/**
 * JSON import source — parses a JSON array (or a single object) of product records.
 *
 * <p>Supported input shapes:</p>
 * <ul>
 *   <li><b>Array root:</b> {@code [ {sku:"A", name:"Widget"}, ... ]}</li>
 *   <li><b>Object with records array:</b> {@code { "products": [ ... ] }} —
 *       the first array-valued field is used as the record list.</li>
 *   <li><b>Single object:</b> {@code { "sku": "A", "name": "Widget" }} — treated as one record.</li>
 * </ul>
 *
 * <p>Each record's JSON fields are converted to Java values:
 * JSON strings → {@code String}, JSON numbers → {@code Long} (whole) / {@code Double} (decimal),
 * JSON booleans → {@code Boolean}, nested objects/arrays → JSON string representation.</p>
 */
@Component
public class JsonImportSource implements ProductImportSource {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String getSourceType() {
        return "JSON";
    }

    @Override
    public Stream<Map<String, Object>> parse(InputStream input, ImportConfig config) {
        try {
            JsonNode root = objectMapper.readTree(input);
            List<JsonNode> records = extractRecords(root);
            return records.stream().map(this::nodeToMap);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse JSON input", e);
        }
    }

    @Override
    public Map<String, Object> inferSchema(InputStream input, ImportConfig config) {
        try {
            JsonNode root = objectMapper.readTree(input);
            List<JsonNode> records = extractRecords(root);
            if (records.isEmpty()) return Map.of();

            // Use the first record to infer field types
            JsonNode sample = records.get(0);
            Map<String, Object> properties = new LinkedHashMap<>();
            sample.fields().forEachRemaining(entry -> {
                properties.put(entry.getKey(), Map.of(
                        "type", inferJsonType(entry.getValue()),
                        "label", entry.getKey()
                ));
            });

            return Map.of(
                    "$schema", "http://json-schema.org/draft-07/schema#",
                    "type", "object",
                    "properties", properties
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to infer schema from JSON input", e);
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Extract a list of record nodes from the root JSON node, supporting:
     * - Array root: the array elements
     * - Object root with a top-level array field: that array's elements
     * - Object root without array field: the object itself as a single record
     */
    private List<JsonNode> extractRecords(JsonNode root) {
        if (root.isArray()) {
            List<JsonNode> list = new ArrayList<>();
            root.forEach(list::add);
            return list;
        }

        if (root.isObject()) {
            // Look for a top-level array field
            Iterator<Map.Entry<String, JsonNode>> fields = root.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> entry = fields.next();
                if (entry.getValue().isArray()) {
                    List<JsonNode> list = new ArrayList<>();
                    entry.getValue().forEach(list::add);
                    return list;
                }
            }
            // No array field — treat object itself as a single record
            return List.of(root);
        }

        return List.of();
    }

    private Map<String, Object> nodeToMap(JsonNode node) {
        Map<String, Object> record = new LinkedHashMap<>();
        node.fields().forEachRemaining(entry -> {
            Object value = jsonNodeToValue(entry.getValue());
            if (value != null && !value.toString().isEmpty()) {
                record.put(entry.getKey(), value);
            }
        });
        return record;
    }

    private Object jsonNodeToValue(JsonNode node) {
        if (node == null || node.isNull()) return null;
        if (node.isTextual()) return node.asText();
        if (node.isBoolean()) return node.booleanValue();
        if (node.isIntegralNumber()) return node.longValue();
        if (node.isFloatingPointNumber()) return node.doubleValue();
        if (node.isNumber()) {
            double d = node.doubleValue();
            return (d == Math.floor(d) && !Double.isInfinite(d)) ? (long) d : d;
        }
        // Nested objects/arrays → serialize back to JSON string
        return node.toString();
    }

    private String inferJsonType(JsonNode node) {
        if (node.isBoolean()) return "boolean";
        if (node.isNumber()) return "number";
        return "string";
    }
}
