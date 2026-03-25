package com.flexcms.i18n.connector;

import com.flexcms.plugin.spi.TranslationConnector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * DeepL translation connector — integrates with the DeepL v2 REST API.
 *
 * <p>Registered automatically when {@code flexcms.translation.deepl.enabled=true}.
 * Used by {@link com.flexcms.i18n.service.TranslationService#machineTranslate}
 * via the {@link TranslationConnector} SPI.</p>
 *
 * <h3>Features</h3>
 * <ul>
 *   <li>Batched translation: chunks requests to stay within DeepL's size limits</li>
 *   <li>Locale mapping: converts FlexCMS locales (e.g., {@code en-US}) to
 *       DeepL format ({@code EN-US})</li>
 *   <li>Preserves unit ID → translated text mapping for the caller</li>
 * </ul>
 *
 * <h3>API</h3>
 * <pre>
 * POST {api-url}/translate
 * Authorization: DeepL-Auth-Key {apiKey}
 * Content-Type: application/json
 *
 * {"text": ["Hello", "World"], "source_lang": "EN", "target_lang": "DE"}
 * → {"translations": [{"text": "Hallo"}, {"text": "Welt"}]}
 * </pre>
 */
@Component
@ConditionalOnProperty(name = "flexcms.translation.deepl.enabled", havingValue = "true")
@EnableConfigurationProperties(DeepLProperties.class)
public class DeepLTranslationConnector implements TranslationConnector {

    private static final Logger log = LoggerFactory.getLogger(DeepLTranslationConnector.class);

    static final String PROVIDER_ID = "deepl";

    private final DeepLProperties props;
    private final RestClient restClient;

    public DeepLTranslationConnector(DeepLProperties props) {
        this.props = props;
        this.restClient = RestClient.builder()
                .baseUrl(props.getApiUrl())
                .defaultHeader(HttpHeaders.AUTHORIZATION, "DeepL-Auth-Key " + props.getApiKey())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Override
    public String getProviderId() {
        return PROVIDER_ID;
    }

    /**
     * Translate a batch of text units using the DeepL API.
     *
     * <p>Units are split into sub-batches if the total character count exceeds
     * {@link DeepLProperties#getMaxCharsPerRequest()}. Results are merged back
     * into a single map keyed by {@link TranslationUnit#id()}.</p>
     *
     * @param units        list of (id, sourceText) pairs
     * @param sourceLocale FlexCMS locale for the source (e.g., "en", "fr-CA")
     * @param targetLocale FlexCMS locale for the target (e.g., "de", "en-US")
     * @return map of unitId → translated text
     */
    @Override
    public Map<String, String> translate(List<TranslationUnit> units, String sourceLocale, String targetLocale) {
        if (units == null || units.isEmpty()) {
            return Map.of();
        }

        String deeplSource = toDeepLLocale(sourceLocale, false);
        String deeplTarget = toDeepLLocale(targetLocale, true);

        log.info("Translating {} units: {} → {} (DeepL)", units.size(), deeplSource, deeplTarget);

        Map<String, String> results = new HashMap<>();
        List<List<TranslationUnit>> batches = splitIntoBatches(units);

        for (List<TranslationUnit> batch : batches) {
            Map<String, String> batchResult = translateBatch(batch, deeplSource, deeplTarget);
            results.putAll(batchResult);
        }

        log.info("DeepL translation complete: {} units translated", results.size());
        return results;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private Map<String, String> translateBatch(List<TranslationUnit> batch,
                                                String deeplSource, String deeplTarget) {
        List<String> texts = batch.stream().map(TranslationUnit::sourceText).toList();
        DeepLRequest request = new DeepLRequest(texts, deeplSource, deeplTarget);

        DeepLResponse response;
        try {
            response = restClient.post()
                    .uri("/translate")
                    .body(request)
                    .retrieve()
                    .body(DeepLResponse.class);
        } catch (Exception e) {
            log.error("DeepL API call failed: {}", e.getMessage(), e);
            throw new RuntimeException("DeepL translation failed: " + e.getMessage(), e);
        }

        if (response == null || response.translations() == null) {
            log.warn("DeepL returned empty response for batch of {} texts", texts.size());
            return Map.of();
        }

        Map<String, String> result = new HashMap<>();
        List<DeepLResponse.Translation> translations = response.translations();
        for (int i = 0; i < Math.min(batch.size(), translations.size()); i++) {
            result.put(batch.get(i).id(), translations.get(i).text());
        }
        return result;
    }

    /**
     * Split units into batches where each batch's total text length stays within
     * {@link DeepLProperties#getMaxCharsPerRequest()}.
     */
    List<List<TranslationUnit>> splitIntoBatches(List<TranslationUnit> units) {
        List<List<TranslationUnit>> batches = new ArrayList<>();
        List<TranslationUnit> current = new ArrayList<>();
        int currentChars = 0;

        for (TranslationUnit unit : units) {
            int unitLen = unit.sourceText() != null ? unit.sourceText().length() : 0;
            if (!current.isEmpty() && currentChars + unitLen > props.getMaxCharsPerRequest()) {
                batches.add(current);
                current = new ArrayList<>();
                currentChars = 0;
            }
            current.add(unit);
            currentChars += unitLen;
        }

        if (!current.isEmpty()) {
            batches.add(current);
        }

        return batches;
    }

    /**
     * Convert a FlexCMS locale string to a DeepL locale code.
     *
     * <p>DeepL uses uppercase language codes ({@code EN}, {@code DE}) and
     * uppercase region variants ({@code EN-US}, {@code EN-GB}) for target locales.
     * Source locale uses language-only uppercase codes.</p>
     *
     * <pre>
     * en       → EN
     * en-US    → EN-US  (target) / EN (source)
     * fr-CA    → FR-CA  (target) / FR (source)
     * zh-hans  → ZH
     * </pre>
     */
    String toDeepLLocale(String locale, boolean isTarget) {
        if (locale == null || locale.isBlank()) return null;

        // Normalize separator: "en_US" → "en-US"
        String normalized = locale.replace('_', '-');

        String upper = normalized.toUpperCase();

        // For source locale, DeepL only accepts the base language (no region)
        if (!isTarget && upper.contains("-")) {
            return upper.substring(0, upper.indexOf('-'));
        }

        return upper;
    }

    // -------------------------------------------------------------------------
    // DeepL API request/response types
    // -------------------------------------------------------------------------

    record DeepLRequest(
            List<String> text,
            String source_lang,  // NOSONAR: matches DeepL JSON field name
            String target_lang   // NOSONAR: matches DeepL JSON field name
    ) {}

    record DeepLResponse(List<Translation> translations) {
        record Translation(String detected_source_language, String text) {} // NOSONAR: JSON field names
    }
}
