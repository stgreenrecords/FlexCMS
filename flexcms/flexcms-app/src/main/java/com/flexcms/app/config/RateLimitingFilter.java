package com.flexcms.app.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Per-IP token-bucket rate limiter for public (unauthenticated) API endpoints.
 *
 * <p>Applied to headless / publish-tier paths only — author paths are
 * already protected by JWT authentication and not rate-limited here.
 *
 * <p>Configurable via {@code flexcms.rate-limit.*} in application.yml.
 * Disabled by default; set {@code flexcms.rate-limit.enabled=true} to activate.
 */
@Component
@ConditionalOnProperty(name = "flexcms.rate-limit.enabled", havingValue = "true")
@EnableConfigurationProperties(RateLimitingFilter.RateLimitProperties.class)
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitingFilter.class);

    /** Paths that are subject to rate limiting (public / headless APIs). */
    private static final String[] RATE_LIMITED_PREFIXES = {
            "/api/content/",
            "/api/pages/",
            "/graphql",
            "/api/pim/v1/"    // PIM read endpoints are also public
    };

    /** Paths that are never rate-limited (author writes, actuator, static). */
    private static final String[] EXCLUDED_PREFIXES = {
            "/api/author/",
            "/actuator/",
            "/swagger-ui",
            "/v3/api-docs"
    };

    private final RateLimitProperties props;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final ScheduledExecutorService cleaner = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "rate-limit-bucket-cleaner");
        t.setDaemon(true);
        return t;
    });

    public RateLimitingFilter(RateLimitProperties props) {
        this.props = props;
        // Periodically evict stale buckets to prevent unbounded memory growth.
        // Buckets are cheaply rebuilt from config on first access per IP.
        cleaner.scheduleAtFixedRate(buckets::clear,
                props.getBucketEvictionMinutes(),
                props.getBucketEvictionMinutes(),
                TimeUnit.MINUTES);
        log.info("Rate limiting enabled: {} req/{} s per IP, burst cap {}",
                props.getRefillTokens(), props.getRefillSeconds(), props.getCapacity());
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        for (String excluded : EXCLUDED_PREFIXES) {
            if (path.startsWith(excluded)) {
                return true;
            }
        }
        for (String limited : RATE_LIMITED_PREFIXES) {
            if (path.startsWith(limited)) {
                return false;
            }
        }
        // Publish-tier catch-all pages (paths not under /api) are also rate-limited.
        return false;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String clientIp = resolveClientIp(request);
        Bucket bucket = buckets.computeIfAbsent(clientIp, k -> buildBucket());

        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (probe.isConsumed()) {
            response.setHeader("X-Rate-Limit-Remaining",
                    String.valueOf(probe.getRemainingTokens()));
            chain.doFilter(request, response);
        } else {
            long retryAfterSeconds = Math.max(1,
                    probe.getNanosToWaitForRefill() / 1_000_000_000);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
            response.setHeader("X-Rate-Limit-Remaining", "0");
            response.getWriter().write(
                    "{\"status\":429,\"error\":\"Too Many Requests\"," +
                    "\"message\":\"Rate limit exceeded. Retry after " + retryAfterSeconds + "s.\"}");
            log.debug("Rate limit exceeded for IP {}: retry after {}s", clientIp, retryAfterSeconds);
        }
    }

    private Bucket buildBucket() {
        Bandwidth limit = Bandwidth.classic(
                props.getCapacity(),
                Refill.greedy(props.getRefillTokens(),
                        Duration.ofSeconds(props.getRefillSeconds())));
        return Bucket.builder().addLimit(limit).build();
    }

    /**
     * Resolves the real client IP, respecting {@code X-Forwarded-For} from
     * trusted reverse proxies (CDN / load balancer in front of the publish tier).
     */
    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            // Take the leftmost (originating client) entry
            int comma = xff.indexOf(',');
            return (comma >= 0 ? xff.substring(0, comma) : xff).trim();
        }
        return request.getRemoteAddr();
    }

    // -------------------------------------------------------------------------
    // Configuration properties
    // -------------------------------------------------------------------------

    @ConfigurationProperties(prefix = "flexcms.rate-limit")
    public static class RateLimitProperties {

        /** Whether rate limiting is active. Default: false (opt-in). */
        private boolean enabled = false;

        /** Maximum burst capacity (token bucket size). Default: 100. */
        private long capacity = 100;

        /**
         * Number of tokens added per refill period.
         * Combined with {@code refillSeconds} this defines the sustained rate.
         * Default: 60 tokens per second → ~60 req/s per IP.
         */
        private long refillTokens = 60;

        /** Refill period in seconds. Default: 1. */
        private long refillSeconds = 1;

        /** How often (minutes) to evict stale per-IP buckets from memory. Default: 10. */
        private long bucketEvictionMinutes = 10;

        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }

        public long getCapacity() { return capacity; }
        public void setCapacity(long capacity) { this.capacity = capacity; }

        public long getRefillTokens() { return refillTokens; }
        public void setRefillTokens(long refillTokens) { this.refillTokens = refillTokens; }

        public long getRefillSeconds() { return refillSeconds; }
        public void setRefillSeconds(long refillSeconds) { this.refillSeconds = refillSeconds; }

        public long getBucketEvictionMinutes() { return bucketEvictionMinutes; }
        public void setBucketEvictionMinutes(long bucketEvictionMinutes) {
            this.bucketEvictionMinutes = bucketEvictionMinutes;
        }
    }
}
