package com.flexcms.pim.importer;

import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for JsonImportSource.
 */
class JsonImportSourceTest {

    private final JsonImportSource source = new JsonImportSource();
    private final ImportConfig config = new ImportConfig();

    // -------------------------------------------------------------------------
    // getSourceType
    // -------------------------------------------------------------------------

    @Test
    void getSourceType_returnsJSON() {
        assertThat(source.getSourceType()).isEqualTo("JSON");
    }

    // -------------------------------------------------------------------------
    // parse — array root
    // -------------------------------------------------------------------------

    @Test
    void parse_arrayRoot_returnsAllRecords() {
        String json = """
                [
                  {"sku": "SKU-001", "name": "Widget A", "price": 9.99},
                  {"sku": "SKU-002", "name": "Widget B", "price": 19.99}
                ]
                """;

        List<Map<String, Object>> records = parse(json);

        assertThat(records).hasSize(2);
        assertThat(records.get(0)).containsEntry("sku", "SKU-001");
        assertThat(records.get(0)).containsEntry("name", "Widget A");
        assertThat(records.get(0)).containsEntry("price", 9.99);
        assertThat(records.get(1)).containsEntry("sku", "SKU-002");
    }

    @Test
    void parse_emptyArray_returnsEmptyStream() {
        assertThat(parse("[]")).isEmpty();
    }

    @Test
    void parse_integerNumbers_returnedAsLong() {
        String json = """
                [{"sku": "SKU-001", "stock": 100}]
                """;

        Map<String, Object> record = parse(json).get(0);

        assertThat(record.get("stock")).isInstanceOf(Long.class).isEqualTo(100L);
    }

    @Test
    void parse_booleanField_returnedAsBoolean() {
        String json = """
                [{"sku": "SKU-001", "active": true}]
                """;

        Map<String, Object> record = parse(json).get(0);

        assertThat(record.get("active")).isEqualTo(Boolean.TRUE);
    }

    @Test
    void parse_nullFields_omittedFromRecord() {
        String json = """
                [{"sku": "SKU-001", "desc": null}]
                """;

        Map<String, Object> record = parse(json).get(0);

        assertThat(record).containsKey("sku");
        assertThat(record).doesNotContainKey("desc");
    }

    @Test
    void parse_nestedObject_serializedToJsonString() {
        String json = """
                [{"sku": "SKU-001", "meta": {"color": "red"}}]
                """;

        Map<String, Object> record = parse(json).get(0);

        assertThat(record.get("meta")).asString().contains("color");
    }

    // -------------------------------------------------------------------------
    // parse — wrapper object with array field
    // -------------------------------------------------------------------------

    @Test
    void parse_wrapperObjectWithProductsArray_extractsRecords() {
        String json = """
                {
                  "total": 2,
                  "products": [
                    {"sku": "SKU-001"},
                    {"sku": "SKU-002"}
                  ]
                }
                """;

        List<Map<String, Object>> records = parse(json);

        assertThat(records).hasSize(2);
        assertThat(records.get(0)).containsEntry("sku", "SKU-001");
    }

    @Test
    void parse_wrapperWithItemsArray_extractsRecords() {
        String json = """
                {"items": [{"sku": "A"}, {"sku": "B"}, {"sku": "C"}]}
                """;

        assertThat(parse(json)).hasSize(3);
    }

    // -------------------------------------------------------------------------
    // parse — single object
    // -------------------------------------------------------------------------

    @Test
    void parse_singleObject_returnedAsSingleRecord() {
        String json = """
                {"sku": "SKU-001", "name": "Widget"}
                """;

        List<Map<String, Object>> records = parse(json);

        assertThat(records).hasSize(1);
        assertThat(records.get(0)).containsEntry("sku", "SKU-001");
    }

    // -------------------------------------------------------------------------
    // parse — error handling
    // -------------------------------------------------------------------------

    @Test
    void parse_invalidJson_throwsRuntimeException() {
        assertThatThrownBy(() -> source.parse(stream("not json at all"), config).count())
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Failed to parse JSON input");
    }

    // -------------------------------------------------------------------------
    // inferSchema
    // -------------------------------------------------------------------------

    @Test
    void inferSchema_buildsSchemaFromFirstRecord() {
        String json = """
                [{"sku": "SKU-001", "price": 9.99, "active": true}]
                """;

        Map<String, Object> schema = source.inferSchema(stream(json), config);

        assertThat(schema).containsKey("properties");
        @SuppressWarnings("unchecked")
        Map<String, Object> props = (Map<String, Object>) schema.get("properties");

        assertThat(props).containsKey("sku");
        assertThat(props).containsKey("price");
        assertThat(props).containsKey("active");

        @SuppressWarnings("unchecked")
        Map<String, Object> priceProp = (Map<String, Object>) props.get("price");
        assertThat(priceProp.get("type")).isEqualTo("number");

        @SuppressWarnings("unchecked")
        Map<String, Object> activeProp = (Map<String, Object>) props.get("active");
        assertThat(activeProp.get("type")).isEqualTo("boolean");
    }

    @Test
    void inferSchema_emptyArray_returnsEmptyMap() {
        Map<String, Object> schema = source.inferSchema(stream("[]"), config);

        assertThat(schema).isEmpty();
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private List<Map<String, Object>> parse(String json) {
        return source.parse(stream(json), config).collect(Collectors.toList());
    }

    private ByteArrayInputStream stream(String json) {
        return new ByteArrayInputStream(json.getBytes(StandardCharsets.UTF_8));
    }
}
