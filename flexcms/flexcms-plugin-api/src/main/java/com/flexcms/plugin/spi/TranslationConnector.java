package com.flexcms.plugin.spi;

import java.util.List;
import java.util.Map;

/**
 * SPI for external translation service integration.
 */
public interface TranslationConnector {

    String getProviderId();

    /**
     * Translate a batch of text units.
     */
    Map<String, String> translate(
            List<TranslationUnit> units,
            String sourceLocale,
            String targetLocale
    );

    record TranslationUnit(String id, String sourceText) {}
}
