package com.flexcms.pim.service;

import com.flexcms.pim.importer.ImportConfig;
import com.flexcms.pim.importer.ImportResult;
import com.flexcms.pim.importer.ProductImportSource;
import com.flexcms.pim.model.*;
import com.flexcms.pim.repository.FieldMappingProfileRepository;
import com.flexcms.pim.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.InputStream;
import java.util.*;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ImportServiceTest {

    @Mock private ProductService productService;
    @Mock private ProductRepository productRepository;
    @Mock private FieldMappingProfileRepository profileRepository;

    @InjectMocks
    private ImportService importService;

    private final UUID catalogId = UUID.randomUUID();

    // A stub import source that returns whatever we configure it to return
    private ProductImportSource stubSource(String type, List<Map<String, Object>> records) {
        return new ProductImportSource() {
            @Override public String getSourceType() { return type; }
            @Override public Stream<Map<String, Object>> parse(InputStream input, ImportConfig config) {
                return records.stream();
            }
        };
    }

    // A stub that also overrides inferSchema
    private ProductImportSource stubSourceWithSchema(String type, Map<String, Object> schema) {
        return new ProductImportSource() {
            @Override public String getSourceType() { return type; }
            @Override public Stream<Map<String, Object>> parse(InputStream input, ImportConfig config) {
                return Stream.empty();
            }
            @Override public Map<String, Object> inferSchema(InputStream input, ImportConfig config) {
                return schema;
            }
        };
    }

    @BeforeEach
    void setUp() {
        // Inject our stub source into the importSources list
        ReflectionTestUtils.setField(importService, "importSources",
                List.of(stubSource("CSV", List.of(
                        Map.of("sku", "SKU-001", "name", "Widget", "color", "red"),
                        Map.of("sku", "SKU-002", "name", "Gadget", "color", "blue")
                ))));
    }

    private ImportConfig config() {
        ImportConfig c = new ImportConfig();
        c.setSourceType("CSV");
        c.setCatalogId(catalogId);
        c.setUserId("importer");
        c.setUpdateExisting(true);
        return c;
    }

    // ── Basic create ───────────────────────────────────────────────────────────

    @Test
    void importProducts_createsNewProducts() {
        when(productRepository.existsBySku(anyString())).thenReturn(false);

        ImportResult result = importService.importProducts(InputStream.nullInputStream(), config());

        assertThat(result.getCreated()).isEqualTo(2);
        assertThat(result.getUpdated()).isEqualTo(0);
        assertThat(result.getFailed()).isEqualTo(0);
        verify(productService, times(2)).create(anyString(), anyString(), eq(catalogId), anyMap(), eq("importer"));
    }

    // ── Update existing ────────────────────────────────────────────────────────

    @Test
    void importProducts_updatesExistingProducts() {
        when(productRepository.existsBySku("SKU-001")).thenReturn(true);
        when(productRepository.existsBySku("SKU-002")).thenReturn(false);

        ImportResult result = importService.importProducts(InputStream.nullInputStream(), config());

        assertThat(result.getCreated()).isEqualTo(1);
        assertThat(result.getUpdated()).isEqualTo(1);
        verify(productService).update(eq("SKU-001"), anyMap(), eq("importer"));
        verify(productService).create(eq("SKU-002"), anyString(), any(), anyMap(), any());
    }

    @Test
    void importProducts_skipsExistingWhenUpdateExistingFalse() {
        when(productRepository.existsBySku(anyString())).thenReturn(true);

        ImportConfig c = config();
        c.setUpdateExisting(false);

        ImportResult result = importService.importProducts(InputStream.nullInputStream(), c);

        assertThat(result.getSkipped()).isEqualTo(2);
        verifyNoInteractions(productService);
    }

    // ── Field mapping ──────────────────────────────────────────────────────────

    @Test
    void importProducts_appliesFieldMappings() {
        ReflectionTestUtils.setField(importService, "importSources",
                List.of(stubSource("CSV", List.of(
                        Map.of("product_sku", "SKU-003", "product_name", "Thing", "col", "green")
                ))));
        when(productRepository.existsBySku("SKU-003")).thenReturn(false);

        ImportConfig c = config();
        c.setSkuField("product_sku");
        c.setNameField("product_name");
        c.setFieldMappings(Map.of("col", "color"));

        importService.importProducts(InputStream.nullInputStream(), c);

        verify(productService).create(eq("SKU-003"), eq("Thing"), any(),
                argThat(attrs -> "green".equals(attrs.get("color")) && !attrs.containsKey("col")),
                any());
    }

    // ── Defaults ───────────────────────────────────────────────────────────────

    @Test
    void importProducts_appliesDefaults() {
        ReflectionTestUtils.setField(importService, "importSources",
                List.of(stubSource("CSV", List.of(
                        Map.of("sku", "SKU-004", "name", "Item")
                ))));
        when(productRepository.existsBySku("SKU-004")).thenReturn(false);

        ImportConfig c = config();
        c.setDefaults(Map.of("status", "DRAFT", "currency", "USD"));

        importService.importProducts(InputStream.nullInputStream(), c);

        verify(productService).create(eq("SKU-004"), any(), any(),
                argThat(attrs -> "USD".equals(attrs.get("currency"))),
                any());
    }

    // ── Transforms ─────────────────────────────────────────────────────────────

    @Test
    void importProducts_appliesTransforms() {
        ReflectionTestUtils.setField(importService, "importSources",
                List.of(stubSource("CSV", List.of(
                        Map.of("sku", "SKU-005", "name", "  trimme  ", "code", "abc")
                ))));
        when(productRepository.existsBySku("SKU-005")).thenReturn(false);

        ImportConfig c = config();
        c.setTransforms(Map.of("code", "uppercase"));

        importService.importProducts(InputStream.nullInputStream(), c);

        verify(productService).create(eq("SKU-005"), any(), any(),
                argThat(attrs -> "ABC".equals(attrs.get("code"))),
                any());
    }

    @Test
    void importProducts_prefixTransform() {
        ReflectionTestUtils.setField(importService, "importSources",
                List.of(stubSource("CSV", List.of(
                        Map.of("sku", "SKU-006", "name", "Prod", "ref", "12345")
                ))));
        when(productRepository.existsBySku("SKU-006")).thenReturn(false);

        ImportConfig c = config();
        c.setTransforms(Map.of("ref", "prefix:REF-"));

        importService.importProducts(InputStream.nullInputStream(), c);

        verify(productService).create(eq("SKU-006"), any(), any(),
                argThat(attrs -> "REF-12345".equals(attrs.get("ref"))),
                any());
    }

    // ── Error handling ─────────────────────────────────────────────────────────

    @Test
    void importProducts_missingSku_recordFails() {
        ReflectionTestUtils.setField(importService, "importSources",
                List.of(stubSource("CSV", List.of(
                        Map.of("name", "No SKU here")
                ))));

        ImportResult result = importService.importProducts(InputStream.nullInputStream(), config());

        assertThat(result.getFailed()).isEqualTo(1);
        assertThat(result.getErrors()).hasSize(1);
        assertThat(result.getErrors().get(0)).contains("missing SKU field");
        verifyNoInteractions(productService);
    }

    @Test
    void importProducts_serviceException_recordFails() {
        when(productRepository.existsBySku("SKU-001")).thenReturn(false);
        when(productRepository.existsBySku("SKU-002")).thenReturn(false);
        doThrow(new RuntimeException("schema violation"))
                .when(productService).create(eq("SKU-001"), any(), any(), any(), any());

        ImportResult result = importService.importProducts(InputStream.nullInputStream(), config());

        assertThat(result.getFailed()).isEqualTo(1);
        assertThat(result.getCreated()).isEqualTo(1); // SKU-002 still succeeds
        assertThat(result.getErrors().get(0)).contains("schema violation");
    }

    // ── Unknown source type ────────────────────────────────────────────────────

    @Test
    void importProducts_unknownSourceType_throws() {
        ImportConfig c = config();
        c.setSourceType("EXCEL");

        assertThatThrownBy(() -> importService.importProducts(InputStream.nullInputStream(), c))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("No import source registered for type 'EXCEL'");
    }

    // ── Profile-based import ───────────────────────────────────────────────────

    @Test
    void importFromProfile_loadsProfileAndRuns() {
        UUID profileId = UUID.randomUUID();
        FieldMappingProfile profile = new FieldMappingProfile();
        profile.setId(profileId);
        profile.setSourceType("CSV");
        profile.setCatalogId(catalogId);
        profile.setSkuField("sku");
        profile.setNameField("name");
        profile.setUpdateExisting(true);
        profile.setFieldMappings(Map.of());
        profile.setDefaults(Map.of());
        profile.setTransforms(Map.of());

        when(profileRepository.findById(profileId)).thenReturn(Optional.of(profile));
        when(productRepository.existsBySku(anyString())).thenReturn(false);

        ImportResult result = importService.importFromProfile(
                InputStream.nullInputStream(), profileId, "importer");

        assertThat(result.getCreated()).isEqualTo(2);
        verify(productService, times(2)).create(anyString(), anyString(), eq(catalogId), anyMap(), eq("importer"));
    }

    @Test
    void importFromProfile_profileNotFound_throws() {
        UUID profileId = UUID.randomUUID();
        when(profileRepository.findById(profileId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> importService.importFromProfile(
                InputStream.nullInputStream(), profileId, "user"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Mapping profile not found");
    }

    // ── Schema inference ────────────────────────────────────────────────────────

    @Test
    void inferSchema_returnsSchemaFromSource() {
        Map<String, Object> expectedSchema = Map.of(
                "$schema", "http://json-schema.org/draft-07/schema#",
                "properties", Map.of(
                        "sku",  Map.of("type", "string"),
                        "name", Map.of("type", "string"),
                        "price", Map.of("type", "number")));
        ReflectionTestUtils.setField(importService, "importSources",
                List.of(stubSourceWithSchema("CSV", expectedSchema)));

        Map<String, Object> result = importService.inferSchema(InputStream.nullInputStream(), "CSV");

        assertThat(result).containsKey("properties");
        @SuppressWarnings("unchecked")
        Map<String, Object> props = (Map<String, Object>) result.get("properties");
        assertThat(props).containsKey("sku").containsKey("name").containsKey("price");
    }

    @Test
    void inferSchema_returnsEmptyMapWhenSourceDoesNotSupportInference() {
        // Default interface method returns empty map — use a plain stub (no override)
        ReflectionTestUtils.setField(importService, "importSources",
                List.of(stubSource("CSV", List.of())));

        Map<String, Object> result = importService.inferSchema(InputStream.nullInputStream(), "CSV");

        assertThat(result).isEmpty();
    }

    @Test
    void inferSchema_unknownSourceType_throws() {
        assertThatThrownBy(() -> importService.inferSchema(InputStream.nullInputStream(), "XML"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("No import source registered for type 'XML'");
    }
}
