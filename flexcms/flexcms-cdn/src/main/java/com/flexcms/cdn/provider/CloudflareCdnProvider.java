package com.flexcms.cdn.provider;

import com.flexcms.plugin.spi.CdnProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.Map;

/**
 * Cloudflare CDN provider — purges cached resources via the Cloudflare Cache Purge API.
 *
 * <p>Cloudflare supports three purge strategies:
 * <ul>
 *   <li><b>Purge by URL</b> — {@code POST /zones/{zoneId}/purge_cache} with {@code files}</li>
 *   <li><b>Purge by cache tag</b> — same endpoint with {@code tags} (surrogate keys)</li>
 *   <li><b>Purge everything</b> — same endpoint with {@code purge_everything: true}</li>
 * </ul>
 * Purge-by-tag requires a Cloudflare Enterprise plan.</p>
 *
 * <h3>Configuration example (application.yml):</h3>
 * <pre>
 * flexcms:
 *   cdn:
 *     cloudflare:
 *       enabled: true
 *       zone-id: abcdef1234567890abcdef1234567890
 *       api-token: my-cloudflare-api-token
 *       batch-size: 30   # Cloudflare max is 30 URLs per purge request
 * </pre>
 */
@Component
@ConditionalOnProperty(name = "flexcms.cdn.cloudflare.enabled", havingValue = "true")
@EnableConfigurationProperties(CloudflareCdnProvider.CloudflareProperties.class)
public class CloudflareCdnProvider implements CdnProvider {

    private static final Logger log = LoggerFactory.getLogger(CloudflareCdnProvider.class);

    /** Cloudflare allows at most 30 files per purge request. */
    private static final int MAX_FILES_PER_REQUEST = 30;

    private static final String PURGE_ENDPOINT = "https://api.cloudflare.com/client/v4/zones/{zoneId}/purge_cache";

    private final CloudflareProperties props;
    private WebClient webClient;

    public CloudflareCdnProvider(CloudflareProperties props) {
        this.props = props;
    }

    @PostConstruct
    void init() {
        this.webClient = WebClient.builder()
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + props.getApiToken())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
        log.info("Cloudflare CDN provider initialized: zoneId={}", props.getZoneId());
    }

    @Override
    public String getProviderName() {
        return "cloudflare";
    }

    /**
     * Purge a list of specific URLs. Batches requests to stay within
     * Cloudflare's 30-file-per-request limit.
     */
    @Override
    public void purgeUrls(List<String> urls) {
        if (urls == null || urls.isEmpty()) return;
        int batchSize = Math.min(props.getBatchSize(), MAX_FILES_PER_REQUEST);
        for (int i = 0; i < urls.size(); i += batchSize) {
            List<String> batch = urls.subList(i, Math.min(i + batchSize, urls.size()));
            purge(Map.of("files", batch));
            log.info("Cloudflare purged {} URLs (batch starting at {})", batch.size(), i);
        }
    }

    /**
     * Purge by path patterns. Cloudflare doesn't support path wildcards natively;
     * paths are treated as exact-match URLs. For wildcard behavior, use
     * cache tags ({@link #purgeSurrogateKeys}) on Enterprise plans.
     */
    @Override
    public void purgePaths(List<String> pathPatterns) {
        if (pathPatterns == null || pathPatterns.isEmpty()) return;
        // Build full URLs by prepending the configured base URL if not already absolute
        List<String> urls = pathPatterns.stream()
                .map(p -> p.startsWith("http") ? p : props.getBaseUrl() + p)
                .toList();
        purgeUrls(urls);
    }

    /**
     * Purge all cached content in the zone ({@code purge_everything: true}).
     * Use with caution — this triggers a full cache miss storm on the origin.
     */
    @Override
    public void purgeAll(String siteId) {
        log.info("Cloudflare zone-wide cache purge for site: {}", siteId);
        purge(Map.of("purge_everything", true));
    }

    /**
     * Purge by cache tags (Cloudflare's native surrogate-key support).
     * Requires a Cloudflare Enterprise plan.
     */
    @Override
    public void purgeSurrogateKeys(List<String> keys) {
        if (keys == null || keys.isEmpty()) return;
        int batchSize = Math.min(props.getBatchSize(), MAX_FILES_PER_REQUEST);
        for (int i = 0; i < keys.size(); i += batchSize) {
            List<String> batch = keys.subList(i, Math.min(i + batchSize, keys.size()));
            purge(Map.of("tags", batch));
            log.info("Cloudflare purged {} cache tags (batch starting at {})", batch.size(), i);
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private void purge(Map<String, Object> body) {
        webClient.post()
                .uri(PURGE_ENDPOINT, props.getZoneId())
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .doOnError(e -> log.error("Cloudflare purge request failed: {}", e.getMessage()))
                .block();  // CdnPurgeService calls @Async — blocking here is safe
    }

    // -------------------------------------------------------------------------
    // Configuration properties
    // -------------------------------------------------------------------------

    @ConfigurationProperties(prefix = "flexcms.cdn.cloudflare")
    public static class CloudflareProperties {

        private boolean enabled = false;

        /** Cloudflare Zone ID. Required. */
        private String zoneId;

        /** Cloudflare API Token with Cache Purge permissions. Required. */
        private String apiToken;

        /**
         * Optional base URL for constructing full URLs when
         * {@link #purgePaths(List)} receives relative paths.
         * Example: {@code https://www.example.com}
         */
        private String baseUrl = "";

        /**
         * Maximum number of files/tags per purge request.
         * Cloudflare's hard limit is 30. Default: 30.
         */
        private int batchSize = 30;

        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
        public String getZoneId() { return zoneId; }
        public void setZoneId(String zoneId) { this.zoneId = zoneId; }
        public String getApiToken() { return apiToken; }
        public void setApiToken(String apiToken) { this.apiToken = apiToken; }
        public String getBaseUrl() { return baseUrl; }
        public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
        public int getBatchSize() { return batchSize; }
        public void setBatchSize(int batchSize) { this.batchSize = batchSize; }
    }
}
