package com.flexcms.cache.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Configuration properties for the cache warming service.
 *
 * <pre>
 * flexcms.cache.warming.enabled=true
 * flexcms.cache.warming.publish-base-url=http://localhost:8081
 * flexcms.cache.warming.paths=/,/products,/about
 * flexcms.cache.warming.concurrency=4
 * flexcms.cache.warming.connect-timeout-ms=5000
 * flexcms.cache.warming.read-timeout-ms=10000
 * </pre>
 */
@Component
@ConfigurationProperties(prefix = "flexcms.cache.warming")
public class CacheWarmingProperties {

    /** Whether the cache warming service is active. */
    private boolean enabled = true;

    /**
     * Base URL of the publish tier.
     * Warming requests are sent here to trigger cache population.
     */
    private String publishBaseUrl = "http://localhost:8081";

    /**
     * Paths to pre-warm on application startup and after full-site replication.
     * Defaults to the homepage only.
     */
    private List<String> paths = new ArrayList<>(List.of("/"));

    /** Maximum concurrent warming requests. */
    private int concurrency = 4;

    /** HTTP connect timeout in milliseconds. */
    private int connectTimeoutMs = 5_000;

    /** HTTP read timeout in milliseconds. */
    private int readTimeoutMs = 10_000;

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public String getPublishBaseUrl() { return publishBaseUrl; }
    public void setPublishBaseUrl(String publishBaseUrl) { this.publishBaseUrl = publishBaseUrl; }

    public List<String> getPaths() { return paths; }
    public void setPaths(List<String> paths) { this.paths = paths; }

    public int getConcurrency() { return concurrency; }
    public void setConcurrency(int concurrency) { this.concurrency = concurrency; }

    public int getConnectTimeoutMs() { return connectTimeoutMs; }
    public void setConnectTimeoutMs(int connectTimeoutMs) { this.connectTimeoutMs = connectTimeoutMs; }

    public int getReadTimeoutMs() { return readTimeoutMs; }
    public void setReadTimeoutMs(int readTimeoutMs) { this.readTimeoutMs = readTimeoutMs; }
}
