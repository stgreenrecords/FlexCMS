package com.flexcms.i18n.connector;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties for the DeepL translation connector.
 *
 * <h3>Configuration example (application.yml):</h3>
 * <pre>
 * flexcms:
 *   translation:
 *     deepl:
 *       enabled: true
 *       api-key: your-deepl-api-key
 *       # Use api-free endpoint for DeepL Free plan (api keys end with ":fx")
 *       # Leave default for Pro plan
 *       api-url: https://api-free.deepl.com/v2
 *       # Optional: fallback source language when auto-detection fails
 *       default-source-language: en
 *       # Max characters per batch request (DeepL limit: 128 KiB per request)
 *       max-chars-per-request: 50000
 * </pre>
 */
@ConfigurationProperties(prefix = "flexcms.translation.deepl")
public class DeepLProperties {

    /** Enable the DeepL translation connector. Default: false. */
    private boolean enabled = false;

    /**
     * DeepL API authentication key.
     * Free plan keys end with {@code :fx} — use the free endpoint URL for those.
     */
    private String apiKey;

    /**
     * DeepL API base URL.
     * <ul>
     *   <li>Pro plan: {@code https://api.deepl.com/v2}</li>
     *   <li>Free plan: {@code https://api-free.deepl.com/v2}</li>
     * </ul>
     * Default: {@code https://api-free.deepl.com/v2} (free tier).
     */
    private String apiUrl = "https://api-free.deepl.com/v2";

    /**
     * Maximum total character count per API request.
     * DeepL imposes a 128 KiB limit per request; this property caps batches
     * conservatively to avoid hitting the limit. Default: 50000.
     */
    private int maxCharsPerRequest = 50000;

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }

    public String getApiUrl() { return apiUrl; }
    public void setApiUrl(String apiUrl) { this.apiUrl = apiUrl; }

    public int getMaxCharsPerRequest() { return maxCharsPerRequest; }
    public void setMaxCharsPerRequest(int maxCharsPerRequest) { this.maxCharsPerRequest = maxCharsPerRequest; }
}
