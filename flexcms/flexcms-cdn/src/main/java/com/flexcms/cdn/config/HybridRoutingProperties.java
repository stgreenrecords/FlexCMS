package com.flexcms.cdn.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties for CDN hybrid routing (S3 primary / SSR fallback).
 *
 * <h3>Configuration example (application.yml):</h3>
 * <pre>
 * flexcms:
 *   cdn:
 *     hybrid:
 *       enabled: true
 *       s3-endpoint: http://localhost:9000        # blank = AWS S3 (uses IAM/env creds)
 *       s3-bucket: flexcms-static
 *       s3-region: us-east-1
 *       s3-access-key: minioadmin               # blank = DefaultCredentialsProvider
 *       s3-secret-key: minioadmin
 *       s3-public-base-url: https://d1234.cloudfront.net
 *       ssr-base-url: http://localhost:8081
 *       manifest-cache-seconds: 60
 * </pre>
 */
@ConfigurationProperties(prefix = "flexcms.cdn.hybrid")
public class HybridRoutingProperties {

    /** Enable the hybrid routing service. Default: false. */
    private boolean enabled = false;

    /**
     * S3 endpoint URL override.
     * Leave blank to use AWS S3 (credentials from IAM role / environment).
     * Set to {@code http://localhost:9000} (or container name) for MinIO.
     */
    private String s3Endpoint;

    /** S3 bucket that stores pre-built static pages. Default: flexcms-static. */
    private String s3Bucket = "flexcms-static";

    /** AWS region for the S3 client. Default: us-east-1. */
    private String s3Region = "us-east-1";

    /**
     * Optional static S3 access key.
     * If blank, falls back to {@code DefaultCredentialsProvider} (IAM role / env vars).
     */
    private String s3AccessKey;

    /** Optional static S3 secret key. Used only when s3AccessKey is set. */
    private String s3SecretKey;

    /**
     * Public base URL from which static pages are served (e.g., CloudFront domain).
     * If blank, falls back to {@code s3Endpoint + "/" + s3Bucket}.
     */
    private String s3PublicBaseUrl;

    /**
     * Base URL of the SSR / publish server.
     * Used as the fallback origin when a page is not found in the S3 manifest.
     * Default: http://localhost:8081
     */
    private String ssrBaseUrl = "http://localhost:8081";

    /**
     * How long to cache the S3 build manifest in memory (seconds).
     * Invalidated automatically via {@link com.flexcms.cdn.service.HybridRoutingService#invalidateManifestCache}.
     * Default: 60 seconds.
     */
    private int manifestCacheSeconds = 60;

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public String getS3Endpoint() { return s3Endpoint; }
    public void setS3Endpoint(String s3Endpoint) { this.s3Endpoint = s3Endpoint; }

    public String getS3Bucket() { return s3Bucket; }
    public void setS3Bucket(String s3Bucket) { this.s3Bucket = s3Bucket; }

    public String getS3Region() { return s3Region; }
    public void setS3Region(String s3Region) { this.s3Region = s3Region; }

    public String getS3AccessKey() { return s3AccessKey; }
    public void setS3AccessKey(String s3AccessKey) { this.s3AccessKey = s3AccessKey; }

    public String getS3SecretKey() { return s3SecretKey; }
    public void setS3SecretKey(String s3SecretKey) { this.s3SecretKey = s3SecretKey; }

    public String getS3PublicBaseUrl() { return s3PublicBaseUrl; }
    public void setS3PublicBaseUrl(String s3PublicBaseUrl) { this.s3PublicBaseUrl = s3PublicBaseUrl; }

    public String getSsrBaseUrl() { return ssrBaseUrl; }
    public void setSsrBaseUrl(String ssrBaseUrl) { this.ssrBaseUrl = ssrBaseUrl; }

    public int getManifestCacheSeconds() { return manifestCacheSeconds; }
    public void setManifestCacheSeconds(int manifestCacheSeconds) { this.manifestCacheSeconds = manifestCacheSeconds; }
}
