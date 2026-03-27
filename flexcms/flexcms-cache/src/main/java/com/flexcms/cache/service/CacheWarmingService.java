package com.flexcms.cache.service;

import com.flexcms.cache.config.CacheWarmingProperties;
import com.flexcms.core.event.ContentIndexEvent;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

/**
 * Cache warming service that pre-populates the publish-tier cache by issuing
 * HTTP GET requests for known URL paths.
 *
 * <p>Warming is triggered in two situations:
 * <ol>
 *   <li><b>Application startup</b> — warms all paths listed in
 *       {@link CacheWarmingProperties#getPaths()} once the application context is ready.</li>
 *   <li><b>Content activation</b> — listens for {@link ContentIndexEvent} and warms the
 *       URL path derived from the activated content node's ltree path.</li>
 * </ol>
 *
 * <p>Concurrency is bounded by {@link CacheWarmingProperties#getConcurrency()} so that
 * warming never floods the publish tier.
 *
 * <p>Enabled only when {@code flexcms.cache.warming.enabled=true} (default).
 */
@Service
@ConditionalOnProperty(name = "flexcms.cache.warming.enabled", havingValue = "true", matchIfMissing = true)
public class CacheWarmingService {

    private static final Logger log = LoggerFactory.getLogger(CacheWarmingService.class);

    @Autowired
    private CacheWarmingProperties properties;

    private ExecutorService executor;
    private HttpClient httpClient;

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    @PostConstruct
    void init() {
        executor = Executors.newFixedThreadPool(
                properties.getConcurrency(),
                Thread.ofVirtual().name("cache-warm-", 0).factory()
        );
        httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(properties.getConnectTimeoutMs()))
                .executor(executor)
                .build();
        log.info("CacheWarmingService initialised: publishBaseUrl={}, concurrency={}, paths={}",
                properties.getPublishBaseUrl(), properties.getConcurrency(), properties.getPaths());
    }

    @PreDestroy
    void shutdown() {
        executor.shutdown();
        try {
            if (!executor.awaitTermination(5, TimeUnit.SECONDS)) {
                executor.shutdownNow();
            }
        } catch (InterruptedException ex) {
            executor.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }

    // ── Event listeners ───────────────────────────────────────────────────────

    /**
     * On startup, warm all statically configured paths.
     * Runs asynchronously so it does not delay the application start.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Async
    public void onApplicationReady() {
        List<String> paths = properties.getPaths();
        if (paths.isEmpty()) {
            log.debug("Cache warming: no paths configured — skipping startup warm");
            return;
        }
        log.info("Cache warming: {} paths scheduled for startup warm", paths.size());
        warmPaths(paths);
    }

    /**
     * After a content node is activated (published), warm its URL path on the publish tier.
     * Only INDEX events trigger warming; REMOVE events do not.
     */
    @EventListener
    @Async
    public void onContentIndexed(ContentIndexEvent event) {
        if (event.getAction() != ContentIndexEvent.Action.INDEX) {
            return;
        }
        String ltreePath = event.getPath();
        // Convert ltree path (content.site.en.home) → URL path (/content/site/en/home)
        String urlPath = "/" + ltreePath.replace(".", "/");
        log.debug("Cache warming: queuing path after activation — {}", urlPath);
        executor.submit(() -> warmPath(urlPath));
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Warm a list of URL paths concurrently, respecting the configured concurrency limit.
     *
     * @param paths URL paths relative to the publish base URL (e.g. {@code /}, {@code /products})
     */
    public void warmPaths(List<String> paths) {
        if (paths == null || paths.isEmpty()) {
            return;
        }
        Semaphore semaphore = new Semaphore(properties.getConcurrency());
        for (String path : paths) {
            try {
                semaphore.acquire();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.warn("Cache warming interrupted while queuing paths");
                return;
            }
            executor.submit(() -> {
                try {
                    warmPath(path);
                } finally {
                    semaphore.release();
                }
            });
        }
    }

    /**
     * Send a single warming GET request to the publish tier for the given URL path.
     * Failures are logged as warnings and never propagated — warming must not impact production.
     *
     * @param urlPath URL path relative to the publish base URL (e.g. {@code /}, {@code /en/home})
     */
    public void warmPath(String urlPath) {
        String url = properties.getPublishBaseUrl() + urlPath;
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofMillis(properties.getReadTimeoutMs()))
                    .header("X-Cache-Warm", "true")
                    .GET()
                    .build();
            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            int status = response.statusCode();
            if (status >= 200 && status < 400) {
                log.debug("Cache warmed: {} → HTTP {}", url, status);
            } else {
                log.warn("Cache warming received unexpected HTTP {} for: {}", status, url);
            }
        } catch (Exception e) {
            log.warn("Cache warming request failed for '{}': {}", url, e.getMessage());
        }
    }
}

