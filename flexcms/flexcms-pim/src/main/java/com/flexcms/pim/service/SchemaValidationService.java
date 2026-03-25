package com.flexcms.pim.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.networknt.schema.JsonSchema;
import com.networknt.schema.JsonSchemaFactory;
import com.networknt.schema.SpecVersion;
import com.networknt.schema.ValidationMessage;
import com.flexcms.pim.model.ProductSchema;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Validates product attribute maps against their ProductSchema's JSON Schema definition.
 *
 * <p>Uses networknt/json-schema-validator (draft-07 compatible).
 * The schema stored in {@link ProductSchema#getSchemaDef()} must be a valid JSON Schema draft-07 object.</p>
 *
 * <h3>Usage:</h3>
 * <pre>{@code
 * List<String> errors = schemaValidationService.validate(product.getSchema(), product.getAttributes());
 * if (!errors.isEmpty()) throw new IllegalArgumentException("Validation failed: " + errors);
 * }</pre>
 */
@Service
public class SchemaValidationService {

    @Autowired
    private ObjectMapper objectMapper;

    private final JsonSchemaFactory factory = JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V7);

    /**
     * Validate {@code attributes} against the JSON Schema stored in {@code productSchema.schemaDef}.
     *
     * @param productSchema the schema containing the JSON Schema definition
     * @param attributes    the product attributes map to validate
     * @return list of human-readable validation error messages; empty if valid
     */
    public List<String> validate(ProductSchema productSchema, Map<String, Object> attributes) {
        if (productSchema == null || productSchema.getSchemaDef() == null) {
            return List.of(); // No schema — nothing to validate
        }
        if (attributes == null) {
            attributes = Map.of();
        }

        try {
            JsonNode schemaNode = objectMapper.convertValue(productSchema.getSchemaDef(), JsonNode.class);
            JsonNode dataNode   = objectMapper.convertValue(attributes, JsonNode.class);

            JsonSchema jsonSchema = factory.getSchema(schemaNode);
            Set<ValidationMessage> messages = jsonSchema.validate(dataNode);

            return messages.stream()
                    .map(ValidationMessage::getMessage)
                    .sorted()
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return List.of("Schema validation failed: " + e.getMessage());
        }
    }

    /**
     * Throw {@link IllegalArgumentException} if validation fails.
     * Convenience wrapper for service layer use.
     */
    public void validateOrThrow(ProductSchema productSchema, Map<String, Object> attributes) {
        List<String> errors = validate(productSchema, attributes);
        if (!errors.isEmpty()) {
            throw new IllegalArgumentException(
                    "Product attributes failed schema validation: " + String.join("; ", errors)
            );
        }
    }
}
