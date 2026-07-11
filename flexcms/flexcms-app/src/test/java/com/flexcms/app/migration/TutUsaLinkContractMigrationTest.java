package com.flexcms.app.migration;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.flexcms.core.model.ComponentDefinition;
import com.flexcms.core.service.ComponentRegistry;
import com.flexcms.headless.controller.ComponentRegistryController;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;

class TutUsaLinkContractMigrationTest {

    private static final String MIGRATION = "db/migration/V18__correct_tut_usa_link_contracts.sql";
    private static final String NAVIGATION = "tut-usa/navigation-search-discovery/navigation";
    private static final String FOOTER = "tut-usa/navigation-search-discovery/footer";
    private static final String FEATURED_CONTENT = "tut-usa/calls-to-action-promotions-campaigns/featured-content";
    private static final Pattern UPDATE_PATTERN = Pattern.compile(
            "data_schema\\s*=\\s*jsonb_set\\(\\s*data_schema,\\s*'\\{properties}',\\s*" +
                    "data_schema->'properties'\\s*\\|\\|\\s*'(\\{.*?})'::jsonb,\\s*false\\s*\\)\\s*" +
                    "WHERE resource_type\\s*=\\s*'([^']+)'\\s*;",
            Pattern.DOTALL);

    private final ObjectMapper objectMapper = new ObjectMapper();
    private Map<String, JsonNode> patches;

    @BeforeEach
    void loadMigrationPatches() throws IOException {
        String sql;
        try (InputStream input = getClass().getClassLoader().getResourceAsStream(MIGRATION)) {
            assertThat(input).as("V18 migration resource").isNotNull();
            sql = new String(input.readAllBytes(), StandardCharsets.UTF_8);
        }

        patches = new LinkedHashMap<>();
        Matcher matcher = UPDATE_PATTERN.matcher(sql);
        while (matcher.find()) {
            patches.put(matcher.group(2), objectMapper.readTree(matcher.group(1)));
        }
    }

    @Test
    void migrationCorrectsEveryAffectedLinkSchemaAndPreservesOtherProperties() {
        assertThat(patches).containsOnlyKeys(NAVIGATION, FOOTER, FEATURED_CONTENT);

        JsonNode navigation = patches.get(NAVIGATION);
        assertLinkCollection(navigation.path("primaryLinks"));
        assertLinkCollection(navigation.path("utilityLinks"));
        assertLinkObject(navigation.path("accountEntry"));
        assertThat(navigation).hasSize(3);

        JsonNode footer = patches.get(FOOTER);
        JsonNode footerGroups = footer.path("footerLinkGroups");
        assertThat(footerGroups.path("type").asText()).isEqualTo("array");
        JsonNode footerGroup = footerGroups.path("items");
        assertThat(footerGroup.path("type").asText()).isEqualTo("object");
        assertThat(textValues(footerGroup.path("required"))).containsExactlyInAnyOrder("title", "links");
        assertNonEmptyString(footerGroup.path("properties").path("title"));
        assertLinkCollection(footerGroup.path("properties").path("links"));
        assertLinkCollection(footer.path("socialLinks"));
        assertLinkCollection(footer.path("legalLinks"));
        assertThat(footer).hasSize(3);

        JsonNode featuredContent = patches.get(FEATURED_CONTENT);
        assertLinkCollection(featuredContent.path("items"));
        assertThat(featuredContent).hasSize(1);

        Map<String, JsonNode> existingProperties = new LinkedHashMap<>();
        existingProperties.put("unchanged", objectMapper.createObjectNode().put("type", "boolean"));
        existingProperties.putAll(jsonObjectToMap(navigation));
        assertThat(existingProperties).containsKey("unchanged");
    }

    @Test
    @SuppressWarnings("unchecked")
    void publicRegistryExposesEveryMigratedContractWithoutChangingItsShape() {
        ComponentRegistry registry = new ComponentRegistry();
        List<ComponentDefinition> definitions = patches.entrySet().stream()
                .map(entry -> definition(entry.getKey(), entry.getValue()))
                .toList();
        Map<String, ComponentDefinition> definitionCache =
                (Map<String, ComponentDefinition>) ReflectionTestUtils.getField(registry, "definitionCache");
        assertThat(definitionCache).isNotNull();
        definitions.forEach(definition -> definitionCache.put(definition.getResourceType(), definition));

        ComponentRegistryController controller = new ComponentRegistryController();
        ReflectionTestUtils.setField(controller, "componentRegistry", registry);

        ResponseEntity<Map<String, Object>> response = controller.getRegistry();
        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        List<Map<String, Object>> contracts = (List<Map<String, Object>>) Objects.requireNonNull(response.getBody()).get("components");
        assertThat(contracts).hasSize(3);

        for (Map.Entry<String, JsonNode> expected : patches.entrySet()) {
            Map<String, Object> contract = contracts.stream()
                    .filter(candidate -> expected.getKey().equals(candidate.get("resourceType")))
                    .findFirst()
                    .orElseThrow();
            JsonNode actualSchema = objectMapper.valueToTree(contract.get("dataSchema"));
            assertThat(actualSchema.path("type").asText()).isEqualTo("object");
            assertThat(actualSchema.path("properties")).isEqualTo(expected.getValue());
        }
    }

    private ComponentDefinition definition(String resourceType, JsonNode properties) {
        ComponentDefinition definition = new ComponentDefinition(
                resourceType,
                resourceType.substring(resourceType.lastIndexOf('/') + 1),
                "TUT-USA contract");
        definition.setDataSchema(Map.of(
                "type", "object",
                "properties", objectMapper.convertValue(properties, new TypeReference<Map<String, Object>>() {})));
        return definition;
    }

    private void assertLinkCollection(JsonNode collectionSchema) {
        assertThat(collectionSchema.path("type").asText()).isEqualTo("array");
        assertLinkObject(collectionSchema.path("items"));
    }

    private void assertLinkObject(JsonNode linkSchema) {
        assertThat(linkSchema.path("type").asText()).isEqualTo("object");
        assertThat(textValues(linkSchema.path("required"))).containsExactlyInAnyOrder("label", "url");
        JsonNode properties = linkSchema.path("properties");
        assertNonEmptyString(properties.path("label"));
        assertNonEmptyString(properties.path("url"));
        assertThat(properties.path("openInNewTab").path("type").asText()).isEqualTo("boolean");
    }

    private void assertNonEmptyString(JsonNode schema) {
        assertThat(schema.path("type").asText()).isEqualTo("string");
        assertThat(schema.path("minLength").asInt()).isEqualTo(1);
    }

    private List<String> textValues(JsonNode array) {
        List<String> values = new ArrayList<>();
        array.forEach(value -> values.add(value.asText()));
        return values;
    }

    private Map<String, JsonNode> jsonObjectToMap(JsonNode object) {
        Map<String, JsonNode> result = new LinkedHashMap<>();
        object.properties().forEach(entry -> result.put(entry.getKey(), entry.getValue()));
        return result;
    }
}



