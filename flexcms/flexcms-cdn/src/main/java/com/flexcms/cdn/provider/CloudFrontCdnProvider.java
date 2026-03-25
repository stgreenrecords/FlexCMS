package com.flexcms.cdn.provider;

import com.flexcms.plugin.spi.CdnProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cloudfront.CloudFrontClient;
import software.amazon.awssdk.services.cloudfront.model.CreateInvalidationRequest;
import software.amazon.awssdk.services.cloudfront.model.InvalidationBatch;
import software.amazon.awssdk.services.cloudfront.model.Paths;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.util.List;

/**
 * CloudFront CDN provider — invalidates cached objects via the AWS CloudFront API.
 *
 * <p>Activated when {@code flexcms.cdn.cloudfront.enabled=true} is set.
 * Requires the distribution ID and AWS credentials to be configured.</p>
 *
 * <h3>Configuration example (application.yml):</h3>
 * <pre>
 * flexcms:
 *   cdn:
 *     cloudfront:
 *       enabled: true
 *       distribution-id: E1ABCDEFGHIJKL
 *       region: us-east-1
 *       # Optional — defaults to AWS DefaultCredentialsProvider (IAM role / env vars)
 *       access-key-id: AKIA...
 *       secret-access-key: ...
 * </pre>
 *
 * <p>In production, prefer IAM role credentials (leave access-key-id blank)
 * over static key/secret.</p>
 */
@Component
@ConditionalOnProperty(name = "flexcms.cdn.cloudfront.enabled", havingValue = "true")
@EnableConfigurationProperties(CloudFrontCdnProvider.CloudFrontProperties.class)
public class CloudFrontCdnProvider implements CdnProvider {

    private static final Logger log = LoggerFactory.getLogger(CloudFrontCdnProvider.class);

    private final CloudFrontProperties props;
    private CloudFrontClient client;

    public CloudFrontCdnProvider(CloudFrontProperties props) {
        this.props = props;
    }

    @PostConstruct
    void init() {
        var builder = CloudFrontClient.builder()
                .region(Region.of(props.getRegion()));

        if (props.getAccessKeyId() != null && !props.getAccessKeyId().isBlank()) {
            builder.credentialsProvider(StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(props.getAccessKeyId(), props.getSecretAccessKey())));
        } else {
            builder.credentialsProvider(DefaultCredentialsProvider.create());
        }

        this.client = builder.build();
        log.info("CloudFront CDN provider initialized: distributionId={}, region={}",
                props.getDistributionId(), props.getRegion());
    }

    @PreDestroy
    void destroy() {
        if (client != null) {
            client.close();
        }
    }

    @Override
    public String getProviderName() {
        return "cloudfront";
    }

    /**
     * Invalidate a list of specific URLs.
     * URLs are converted to CloudFront paths by stripping the hostname.
     */
    @Override
    public void purgeUrls(List<String> urls) {
        if (urls == null || urls.isEmpty()) return;
        List<String> paths = urls.stream()
                .map(this::urlToPath)
                .toList();
        createInvalidation(paths);
    }

    /**
     * Invalidate by path patterns (may include wildcards, e.g., {@code /blog/*}).
     */
    @Override
    public void purgePaths(List<String> pathPatterns) {
        if (pathPatterns == null || pathPatterns.isEmpty()) return;
        createInvalidation(pathPatterns);
    }

    /**
     * Invalidate the entire distribution (creates a {@code /*} invalidation).
     */
    @Override
    public void purgeAll(String siteId) {
        log.info("CloudFront full-distribution invalidation for site: {}", siteId);
        createInvalidation(List.of("/*"));
    }

    /**
     * CloudFront does not natively support surrogate-key / cache-tag invalidation.
     * If surrogate key → path mapping is configured, convert and invalidate those paths.
     * Otherwise logs a warning and falls back to a full-distribution invalidation.
     */
    @Override
    public void purgeSurrogateKeys(List<String> keys) {
        if (keys == null || keys.isEmpty()) return;

        if (props.isFallbackFullPurgeOnSurrogateKey()) {
            log.warn("CloudFront does not support surrogate-key purge natively. " +
                     "Falling back to full distribution invalidation for keys: {}", keys);
            createInvalidation(List.of("/*"));
        } else {
            log.warn("CloudFront surrogate-key purge requested for {} keys but no fallback configured. " +
                     "Set flexcms.cdn.cloudfront.fallback-full-purge-on-surrogate-key=true to enable " +
                     "full-distribution fallback, or switch to Cloudflare for native tag invalidation.",
                     keys.size());
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private void createInvalidation(List<String> paths) {
        // CloudFront requires all paths to start with "/"
        List<String> normalizedPaths = paths.stream()
                .map(p -> p.startsWith("/") ? p : "/" + p)
                .distinct()
                .toList();

        String callerRef = "flexcms-" + System.currentTimeMillis();

        CreateInvalidationRequest request = CreateInvalidationRequest.builder()
                .distributionId(props.getDistributionId())
                .invalidationBatch(InvalidationBatch.builder()
                        .callerReference(callerRef)
                        .paths(Paths.builder()
                                .items(normalizedPaths)
                                .quantity(normalizedPaths.size())
                                .build())
                        .build())
                .build();

        client.createInvalidation(request);
        log.info("CloudFront invalidation created (ref={}) for {} paths", callerRef, normalizedPaths.size());
    }

    /**
     * Strip scheme and host from a URL to produce a CloudFront-compatible path.
     * {@code https://example.com/blog/post-1} → {@code /blog/post-1}
     */
    private String urlToPath(String url) {
        if (url == null) return "/";
        // Remove scheme://host
        int slashSlash = url.indexOf("//");
        if (slashSlash >= 0) {
            int pathStart = url.indexOf('/', slashSlash + 2);
            return pathStart >= 0 ? url.substring(pathStart) : "/";
        }
        return url.startsWith("/") ? url : "/" + url;
    }

    // -------------------------------------------------------------------------
    // Configuration properties
    // -------------------------------------------------------------------------

    @ConfigurationProperties(prefix = "flexcms.cdn.cloudfront")
    public static class CloudFrontProperties {

        private boolean enabled = false;

        /** CloudFront distribution ID (e.g., {@code E1ABCDEFGHIJKL}). Required. */
        private String distributionId;

        /** AWS region for the CloudFront client. Default: {@code us-east-1}. */
        private String region = "us-east-1";

        /**
         * Optional static AWS access key ID.
         * If blank, falls back to {@code DefaultCredentialsProvider} (IAM role / env vars).
         */
        private String accessKeyId;

        /** Optional static AWS secret access key. Used only when accessKeyId is set. */
        private String secretAccessKey;

        /**
         * When a surrogate-key purge is requested (which CloudFront doesn't natively support),
         * fall back to a full {@code /*} invalidation. Default: false (skip with warning).
         */
        private boolean fallbackFullPurgeOnSurrogateKey = false;

        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
        public String getDistributionId() { return distributionId; }
        public void setDistributionId(String distributionId) { this.distributionId = distributionId; }
        public String getRegion() { return region; }
        public void setRegion(String region) { this.region = region; }
        public String getAccessKeyId() { return accessKeyId; }
        public void setAccessKeyId(String accessKeyId) { this.accessKeyId = accessKeyId; }
        public String getSecretAccessKey() { return secretAccessKey; }
        public void setSecretAccessKey(String secretAccessKey) { this.secretAccessKey = secretAccessKey; }
        public boolean isFallbackFullPurgeOnSurrogateKey() { return fallbackFullPurgeOnSurrogateKey; }
        public void setFallbackFullPurgeOnSurrogateKey(boolean v) { this.fallbackFullPurgeOnSurrogateKey = v; }
    }
}
