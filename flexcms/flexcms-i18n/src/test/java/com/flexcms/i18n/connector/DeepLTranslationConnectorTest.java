package com.flexcms.i18n.connector;

import com.flexcms.plugin.spi.TranslationConnector;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for DeepLTranslationConnector.
 *
 * Tests cover locale mapping, batch splitting, and the provider contract.
 * Live DeepL API calls are exercised by integration tests (not included here).
 */
class DeepLTranslationConnectorTest {

    private DeepLProperties props;
    private DeepLTranslationConnector connector;

    @BeforeEach
    void setUp() {
        props = new DeepLProperties();
        props.setEnabled(true);
        props.setApiKey("test-key:fx");
        props.setApiUrl("https://api-free.deepl.com/v2");
        props.setMaxCharsPerRequest(100);

        // Override constructor to avoid real RestClient initialization
        connector = new DeepLTranslationConnector(props) {
            // RestClient is not built in tests; only non-HTTP methods are tested.
            // Live translation tests belong in @SpringBootTest integration tests.
        };
    }

    // -------------------------------------------------------------------------
    // getProviderId
    // -------------------------------------------------------------------------

    @Test
    void getProviderId_returnsDeepL() {
        assertThat(connector.getProviderId()).isEqualTo("deepl");
    }

    // -------------------------------------------------------------------------
    // toDeepLLocale — source locale (language only, uppercase)
    // -------------------------------------------------------------------------

    @Test
    void toDeepLLocale_simpleLanguage_uppercases() {
        assertThat(connector.toDeepLLocale("en", false)).isEqualTo("EN");
        assertThat(connector.toDeepLLocale("de", false)).isEqualTo("DE");
        assertThat(connector.toDeepLLocale("fr", false)).isEqualTo("FR");
    }

    @Test
    void toDeepLLocale_source_stripsRegion() {
        // DeepL source locale must be language-only
        assertThat(connector.toDeepLLocale("en-US", false)).isEqualTo("EN");
        assertThat(connector.toDeepLLocale("fr-CA", false)).isEqualTo("FR");
        assertThat(connector.toDeepLLocale("en_US", false)).isEqualTo("EN"); // underscore normalised
    }

    // -------------------------------------------------------------------------
    // toDeepLLocale — target locale (full, uppercase)
    // -------------------------------------------------------------------------

    @Test
    void toDeepLLocale_target_keepsRegion() {
        assertThat(connector.toDeepLLocale("en-US", true)).isEqualTo("EN-US");
        assertThat(connector.toDeepLLocale("en-GB", true)).isEqualTo("EN-GB");
        assertThat(connector.toDeepLLocale("fr-CA", true)).isEqualTo("FR-CA");
    }

    @Test
    void toDeepLLocale_target_languageOnly_uppercases() {
        assertThat(connector.toDeepLLocale("de", true)).isEqualTo("DE");
        assertThat(connector.toDeepLLocale("zh", true)).isEqualTo("ZH");
    }

    @Test
    void toDeepLLocale_normalizesUnderscore() {
        assertThat(connector.toDeepLLocale("en_US", true)).isEqualTo("EN-US");
        assertThat(connector.toDeepLLocale("pt_BR", true)).isEqualTo("PT-BR");
    }

    @Test
    void toDeepLLocale_nullOrBlank_returnsNull() {
        assertThat(connector.toDeepLLocale(null, true)).isNull();
        assertThat(connector.toDeepLLocale("", true)).isNull();
        assertThat(connector.toDeepLLocale("  ", true)).isNull();
    }

    // -------------------------------------------------------------------------
    // splitIntoBatches
    // -------------------------------------------------------------------------

    @Test
    void splitIntoBatches_fitsInOneBatch() {
        // maxCharsPerRequest = 100, each unit = 10 chars → fits in one batch
        List<TranslationConnector.TranslationUnit> units = List.of(
                new TranslationConnector.TranslationUnit("u1", "Hello"),
                new TranslationConnector.TranslationUnit("u2", "World"),
                new TranslationConnector.TranslationUnit("u3", "Test")
        );
        List<List<TranslationConnector.TranslationUnit>> batches = connector.splitIntoBatches(units);
        assertThat(batches).hasSize(1);
        assertThat(batches.get(0)).hasSize(3);
    }

    @Test
    void splitIntoBatches_splitsWhenOverLimit() {
        // maxCharsPerRequest = 100; two texts of 60 chars each should split
        String text60 = "A".repeat(60);
        List<TranslationConnector.TranslationUnit> units = List.of(
                new TranslationConnector.TranslationUnit("u1", text60),
                new TranslationConnector.TranslationUnit("u2", text60)
        );
        List<List<TranslationConnector.TranslationUnit>> batches = connector.splitIntoBatches(units);
        assertThat(batches).hasSize(2);
        assertThat(batches.get(0)).hasSize(1);
        assertThat(batches.get(1)).hasSize(1);
    }

    @Test
    void splitIntoBatches_emptyInput_returnsNoBatches() {
        List<List<TranslationConnector.TranslationUnit>> batches = connector.splitIntoBatches(List.of());
        assertThat(batches).isEmpty();
    }

    @Test
    void splitIntoBatches_singleUnitLargerThanLimit_goesInOwnBatch() {
        // A single unit larger than the limit must still be sent (can't split a single unit)
        String bigText = "X".repeat(200); // > maxCharsPerRequest (100)
        List<TranslationConnector.TranslationUnit> units = List.of(
                new TranslationConnector.TranslationUnit("u1", bigText)
        );
        List<List<TranslationConnector.TranslationUnit>> batches = connector.splitIntoBatches(units);
        assertThat(batches).hasSize(1);
        assertThat(batches.get(0).get(0).id()).isEqualTo("u1");
    }

    // -------------------------------------------------------------------------
    // translate — empty input
    // -------------------------------------------------------------------------

    @Test
    void translate_emptyUnits_returnsEmptyMap() {
        Map<String, String> result = connector.translate(List.of(), "en", "de");
        assertThat(result).isEmpty();
    }

    @Test
    void translate_nullUnits_returnsEmptyMap() {
        Map<String, String> result = connector.translate(null, "en", "de");
        assertThat(result).isEmpty();
    }
}
