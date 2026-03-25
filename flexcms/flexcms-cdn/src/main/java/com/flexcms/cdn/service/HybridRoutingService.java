package com.flexcms.cdn.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.flexcms.cdn.config.HybridRoutingProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.net.URI;
import java.time.Instant;
import java.util.Arrays;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Hybrid routing service — determines whether a given page should be served
 * from the pre-built S3 static site or the SSR (publish) server.
 *
 * <h3>Architecture</h3>
 * When a page is published and compiled by the build-worker, it is uploaded to S3
 * as {@code sites/{siteId}/{locale}/{urlPath}/index.html}. A manifest file at
 * {@code _meta/{siteId}/{locale}/manifest.json} records which pages have been
 * compiled and their content versions.
 *
 * <p>This service checks the manifest to determine the appropriate origin for
 * each request. In production, CloudFront uses an Origin Group that automatically
 * retries the SSR origin on S3 403/404. In local dev, an nginx reverse proxy
 * mirrors this behaviour.</p>
 *
 * <pre>
 * Request flow:
 *   CDN edge → S3 primary origin (pre-built HTML)
 *                   ↓ 403/404?
 *              SSR origin fallback (Next.js / publish instance)
 * </pre>
 */
@Service
@ConditionalOnProperty(name = "flexcms.cdn.hybrid.enabled", havingValue = "true")
@EnableConfigurationProperties(HybridRoutingProperties.class)
public class HybridRoutingService {

    private static final Logger log = LoggerFactory.getLogger(HybridRoutingService.class);

    /** Routing origin — which backend should serve this request. */
    public enum Origin { S3, SSR }

    /**
     * Result of a routing resolution: where to send the request and the public URL.
     *
     * @param origin      S3 (static, pre-built) or SSR (dynamic, on-the-fly)
     * @param resolvedUrl public URL of the resolved page
     */
    public record RoutingDecision(Origin origin, String resolvedUrl) {
        public boolean isStatic() { return origin == Origin.S3; }
    }

    private final HybridRoutingProperties props;
    private final ObjectMapper objectMapper;
    private S3Client s3;

    /** In-memory manifest cache: {@code "siteId:locale"} → {@link CachedManifest}. */
    private final Map<String, CachedManifest> manifestCache = new ConcurrentHashMap<>();

    public HybridRoutingService(HybridRoutingProperties props, ObjectMapper objectMapper) {
        this.props = props;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    void init() {
        var builder = S3Client.builder()
                .region(Region.of(props.getS3Region()));

        if (props.getS3Endpoint() != null && !props.getS3Endpoint().isBlank()) {
            builder.endpointOverride(URI.create(props.getS3Endpoint()))
                   .forcePathStyle(true); // required for MinIO path-style access
        }

        if (props.getS3AccessKey() != null && !props.getS3AccessKey().isBlank()) {
            builder.credentialsProvider(StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(props.getS3AccessKey(), props.getS3SecretKey())));
        } else {
            builder.credentialsProvider(DefaultCredentialsProvider.create());
        }

        this.s3 = builder.build();
        log.info("HybridRoutingService initialized: s3Endpoint={}, s3Bucket={}, ssrBaseUrl={}",
                props.getS3Endpoint(), props.getS3Bucket(), props.getSsrBaseUrl());
    }

    @PreDestroy
    void destroy() {
        if (s3 != null) s3.close();
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Resolve the best origin for a given content page.
     *
     * <p>Checks the S3 build manifest. If the page has been statically compiled,
     * routes to S3. Otherwise routes to the SSR (publish) server.</p>
     *
     * @param siteId      the site identifier (e.g., {@code "corporate"})
     * @param locale      the content locale (e.g., {@code "en"})
     * @param contentPath the FlexCMS ltree content path
     *                    (e.g., {@code "content.corporate.en.products.widget"})
     * @return routing decision with origin and resolved public URL
     */
    public RoutingDecision resolve(String siteId, String locale, String contentPath) {
        BuildManifest manifest = fetchManifest(siteId, locale);
        if (manifest != null && manifest.pages() != null && manifest.pages().containsKey(contentPath)) {
            String urlPath = contentPathToUrlPath(contentPath, siteId, locale);
            String publicUrl = buildS3PublicUrl(siteId, locale, urlPath);
            log.debug("Routing {} → S3 ({})", contentPath, publicUrl);
            return new RoutingDecision(Origin.S3, publicUrl);
        }
        log.debug("Routing {} → SSR ({})", contentPath, props.getSsrBaseUrl());
        return new RoutingDecision(Origin.SSR, props.getSsrBaseUrl());
    }

    /**
     * Check if a page has been statically compiled (exists in the S3 build manifest).
     *
     * @param siteId      site identifier
     * @param locale      content locale
     * @param contentPath FlexCMS ltree content path
     * @return {@code true} if the page is available as pre-built static HTML in S3
     */
    public boolean isStaticallyBuilt(String siteId, String locale, String contentPath) {
        BuildManifest manifest = fetchManifest(siteId, locale);
        return manifest != null && manifest.pages() != null && manifest.pages().containsKey(contentPath);
    }

    /**
     * Compute the S3 object key for a content page's compiled HTML.
     * Key format: {@code sites/{siteId}/{locale}/{urlPath}/index.html}
     *
     * @param siteId      site identifier
     * @param locale      content locale
     * @param contentPath FlexCMS ltree content path
     * @return S3 object key
     */
    public String getS3Key(String siteId, String locale, String contentPath) {
        String urlPath = contentPathToUrlPath(contentPath, siteId, locale);
        return "sites/" + siteId + "/" + locale + "/" + urlPath + "/index.html";
    }

    /**
     * Invalidate the cached manifest for a site/locale pair.
     *
     * <p>Call this after a new build completes so the next routing resolution
     * fetches the freshly updated manifest from S3.</p>
     *
     * @param siteId site identifier
     * @param locale content locale
     */
    public void invalidateManifestCache(String siteId, String locale) {
        manifestCache.remove(siteId + ":" + locale);
        log.debug("Manifest cache invalidated: site={}, locale={}", siteId, locale);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Fetch the build manifest for a site/locale, using the in-memory cache.
     * Returns {@code null} if the manifest does not exist in S3 or cannot be read.
     */
    private BuildManifest fetchManifest(String siteId, String locale) {
        String cacheKey = siteId + ":" + locale;
        CachedManifest cached = manifestCache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            return cached.manifest(); // may be null (cached "not found")
        }

        String s3Key = "_meta/" + siteId + "/" + locale + "/manifest.json";
        try {
            var bytes = s3.getObjectAsBytes(
                    GetObjectRequest.builder().bucket(props.getS3Bucket()).key(s3Key).build());
            BuildManifest manifest = objectMapper.readValue(bytes.asUtf8String(), BuildManifest.class);
            Instant expiresAt = Instant.now().plusSeconds(props.getManifestCacheSeconds());
            manifestCache.put(cacheKey, new CachedManifest(manifest, expiresAt));
            log.debug("Loaded S3 manifest: site={}, locale={}, pages={}",
                    siteId, locale, manifest.pages() != null ? manifest.pages().size() : 0);
            return manifest;
        } catch (NoSuchKeyException e) {
            // Cache a null entry to avoid hammering S3 on every request
            Instant expiresAt = Instant.now().plusSeconds(props.getManifestCacheSeconds());
            manifestCache.put(cacheKey, new CachedManifest(null, expiresAt));
            log.debug("No S3 manifest found for site={}, locale={} — routing all to SSR", siteId, locale);
            return null;
        } catch (Exception e) {
            log.warn("Failed to fetch S3 manifest for site={}, locale={}: {}", siteId, locale, e.getMessage());
            return null;
        }
    }

    /**
     * Build the public URL for a statically compiled page.
     * Uses {@code s3PublicBaseUrl} if configured; falls back to the raw S3/MinIO endpoint.
     */
    private String buildS3PublicUrl(String siteId, String locale, String urlPath) {
        String base = props.getS3PublicBaseUrl();
        if (base != null && !base.isBlank()) {
            String normalizedBase = base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
            return urlPath.isEmpty() ? normalizedBase + "/" : normalizedBase + "/" + urlPath;
        }
        // Fallback: construct from S3 endpoint + bucket + key
        String endpoint = props.getS3Endpoint() != null ? props.getS3Endpoint() : "https://s3.amazonaws.com";
        return endpoint + "/" + props.getS3Bucket() + "/sites/" + siteId + "/" + locale
                + (urlPath.isEmpty() ? "" : "/" + urlPath) + "/index.html";
    }

    /**
     * Convert a FlexCMS content path to a URL path segment.
     *
     * <pre>
     * content.corporate.en.products.widget → products/widget
     * content.corporate.en                 → "" (homepage)
     * </pre>
     */
    String contentPathToUrlPath(String contentPath, String siteId, String locale) {
        String prefix = "content." + siteId + "." + locale + ".";
        if (contentPath.startsWith(prefix)) {
            return contentPath.substring(prefix.length()).replace(".", "/");
        }
        // Fallback: strip first 3 segments (content.{site}.{locale})
        String[] segments = contentPath.split("\\.");
        if (segments.length > 3) {
            return String.join("/", Arrays.copyOfRange(segments, 3, segments.length));
        }
        return "";
    }

    // -------------------------------------------------------------------------
    // Internal types
    // -------------------------------------------------------------------------

    /**
     * Manifest data structure matching the build-worker's ManifestManager output.
     * Keyed by FlexCMS content path → manifest page entry.
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    record BuildManifest(String siteId, String locale, String builtAt, Map<String, Object> pages) {}

    /** Time-bounded manifest cache entry. */
    record CachedManifest(BuildManifest manifest, Instant expiresAt) {
        boolean isExpired() { return Instant.now().isAfter(expiresAt); }
    }
}
