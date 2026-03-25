package com.flexcms.pim.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.flexcms.pim.model.ProductSchema;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

class SchemaValidationServiceTest {

    private SchemaValidationService service;

    @BeforeEach
    void setUp() {
        SchemaValidationService svc = new SchemaValidationService();
        // Inject ObjectMapper directly (no Spring context needed)
        try {
            var f = SchemaValidationService.class.getDeclaredField("objectMapper");
            f.setAccessible(true);
            f.set(svc, new ObjectMapper());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        service = svc;
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private ProductSchema schemaWith(Map<String, Object> schemaDef) {
        ProductSchema s = new ProductSchema();
        s.setSchemaDef(schemaDef);
        return s;
    }

    /** JSON Schema that requires 'name' (string) and 'price' (number ≥ 0) */
    private Map<String, Object> requiredStringPriceSchema() {
        return Map.of(
                "$schema", "http://json-schema.org/draft-07/schema#",
                "type", "object",
                "required", List.of("name", "price"),
                "properties", Map.of(
                        "name",  Map.of("type", "string"),
                        "price", Map.of("type", "number", "minimum", 0)
                )
        );
    }

    // -------------------------------------------------------------------------
    // validate()
    // -------------------------------------------------------------------------

    @Test
    void validate_returnsEmpty_whenAttributesMatchSchema() {
        ProductSchema schema = schemaWith(requiredStringPriceSchema());
        Map<String, Object> attrs = Map.of("name", "Widget Pro", "price", 29.99);

        List<String> errors = service.validate(schema, attrs);

        assertThat(errors).isEmpty();
    }

    @Test
    void validate_returnsErrors_whenRequiredFieldMissing() {
        ProductSchema schema = schemaWith(requiredStringPriceSchema());
        Map<String, Object> attrs = Map.of("name", "Widget Pro"); // missing 'price'

        List<String> errors = service.validate(schema, attrs);

        assertThat(errors).isNotEmpty();
        assertThat(errors).anyMatch(e -> e.contains("price"));
    }

    @Test
    void validate_returnsErrors_whenTypeIsWrong() {
        ProductSchema schema = schemaWith(requiredStringPriceSchema());
        Map<String, Object> attrs = Map.of("name", 42, "price", 9.99); // 'name' should be string

        List<String> errors = service.validate(schema, attrs);

        assertThat(errors).isNotEmpty();
        assertThat(errors).anyMatch(e -> e.contains("name"));
    }

    @Test
    void validate_returnsErrors_whenMinimumViolated() {
        ProductSchema schema = schemaWith(requiredStringPriceSchema());
        Map<String, Object> attrs = Map.of("name", "Widget", "price", -5); // price < 0

        List<String> errors = service.validate(schema, attrs);

        assertThat(errors).isNotEmpty();
        assertThat(errors).anyMatch(e -> e.contains("price"));
    }

    @Test
    void validate_returnsEmpty_whenSchemaIsNull() {
        List<String> errors = service.validate(null, Map.of("name", "test"));
        assertThat(errors).isEmpty();
    }

    @Test
    void validate_returnsEmpty_whenSchemaDefIsNull() {
        ProductSchema schema = new ProductSchema();
        schema.setSchemaDef(null);
        List<String> errors = service.validate(schema, Map.of("name", "test"));
        assertThat(errors).isEmpty();
    }

    @Test
    void validate_handlesNullAttributes_asEmptyObject() {
        ProductSchema schema = schemaWith(requiredStringPriceSchema());
        // Null attributes → treated as empty map → missing 'name' and 'price'
        List<String> errors = service.validate(schema, null);
        assertThat(errors).hasSizeGreaterThanOrEqualTo(2);
    }

    @Test
    void validate_allowsAdditionalProperties_byDefault() {
        ProductSchema schema = schemaWith(requiredStringPriceSchema());
        // Extra field 'color' not in schema — allowed by default (no additionalProperties: false)
        Map<String, Object> attrs = Map.of("name", "Widget", "price", 5.0, "color", "red");
        assertThat(service.validate(schema, attrs)).isEmpty();
    }

    // -------------------------------------------------------------------------
    // validateOrThrow()
    // -------------------------------------------------------------------------

    @Test
    void validateOrThrow_doesNotThrow_whenValid() {
        ProductSchema schema = schemaWith(requiredStringPriceSchema());
        Map<String, Object> attrs = Map.of("name", "Widget", "price", 10.0);

        assertThatCode(() -> service.validateOrThrow(schema, attrs)).doesNotThrowAnyException();
    }

    @Test
    void validateOrThrow_throwsIllegalArgument_whenInvalid() {
        ProductSchema schema = schemaWith(requiredStringPriceSchema());
        Map<String, Object> attrs = Map.of("name", "Widget"); // missing 'price'

        assertThatThrownBy(() -> service.validateOrThrow(schema, attrs))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("schema validation");
    }

    @Test
    void validateOrThrow_includesFieldNameInMessage() {
        ProductSchema schema = schemaWith(requiredStringPriceSchema());
        Map<String, Object> attrs = Map.of(); // both required fields missing

        assertThatThrownBy(() -> service.validateOrThrow(schema, attrs))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContainingAll("price", "name");
    }
}
