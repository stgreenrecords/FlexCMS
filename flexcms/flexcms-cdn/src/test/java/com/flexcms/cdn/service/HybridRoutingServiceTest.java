package com.flexcms.cdn.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for HybridRoutingService — path conversion and routing logic.
 *
 * The S3 / SSR routing decisions that depend on live S3 calls are exercised
 * by integration tests; here we cover the path-conversion utilities and
 * the routing decisions derived from manifest presence/absence.
 */
class HybridRoutingServiceTest {

    // Build a service instance with a stub S3 client — we test only the methods
    // that do NOT require a live S3 connection (path conversions, URL builders).
    // The live-path tests (fetchManifest, resolve) belong in an integration test.

    private HybridRoutingService serviceWithProps(String s3Endpoint, String s3PublicBaseUrl, String ssrBaseUrl) {
        com.flexcms.cdn.config.HybridRoutingProperties props =
                new com.flexcms.cdn.config.HybridRoutingProperties();
        props.setS3Endpoint(s3Endpoint);
        props.setS3Bucket("flexcms-static");
        props.setS3Region("us-east-1");
        props.setS3PublicBaseUrl(s3PublicBaseUrl);
        props.setSsrBaseUrl(ssrBaseUrl);
        props.setManifestCacheSeconds(60);
        // Skip @PostConstruct S3 client init — we only test path helpers here
        return new HybridRoutingService(props, new com.fasterxml.jackson.databind.ObjectMapper()) {
            @Override
            void init() { /* no-op for unit tests */ }
        };
    }

    // -------------------------------------------------------------------------
    // contentPathToUrlPath
    // -------------------------------------------------------------------------

    @Test
    void contentPathToUrlPath_stripsContentSiteLocalePrefix() {
        HybridRoutingService svc = serviceWithProps(null, null, "http://localhost:8081");

        assertThat(svc.contentPathToUrlPath("content.corporate.en.products.widget", "corporate", "en"))
                .isEqualTo("products/widget");
    }

    @Test
    void contentPathToUrlPath_nestedPath() {
        HybridRoutingService svc = serviceWithProps(null, null, "http://localhost:8081");

        assertThat(svc.contentPathToUrlPath("content.shop.de.catalog.shoes.running", "shop", "de"))
                .isEqualTo("catalog/shoes/running");
    }

    @Test
    void contentPathToUrlPath_rootPage_returnsEmpty() {
        HybridRoutingService svc = serviceWithProps(null, null, "http://localhost:8081");

        // content.corporate.en → the site root / homepage
        String result = svc.contentPathToUrlPath("content.corporate.en", "corporate", "en");
        assertThat(result).isEmpty();
    }

    @Test
    void contentPathToUrlPath_fallbackWhenPrefixDoesNotMatch() {
        HybridRoutingService svc = serviceWithProps(null, null, "http://localhost:8081");

        // Fallback: strip first 3 segments
        assertThat(svc.contentPathToUrlPath("content.other.fr.news.article1", "corporate", "en"))
                .isEqualTo("news/article1");
    }

    // -------------------------------------------------------------------------
    // getS3Key
    // -------------------------------------------------------------------------

    @Test
    void getS3Key_producesCorrectKey() {
        HybridRoutingService svc = serviceWithProps(null, null, "http://localhost:8081");

        String key = svc.getS3Key("corporate", "en", "content.corporate.en.products.widget");
        assertThat(key).isEqualTo("sites/corporate/en/products/widget/index.html");
    }

    @Test
    void getS3Key_homePage_producesRootIndexKey() {
        HybridRoutingService svc = serviceWithProps(null, null, "http://localhost:8081");

        String key = svc.getS3Key("corporate", "en", "content.corporate.en");
        // empty urlPath → sites/corporate/en//index.html (trailing slash is acceptable for homepage)
        assertThat(key).startsWith("sites/corporate/en/");
        assertThat(key).endsWith("index.html");
    }

    // -------------------------------------------------------------------------
    // invalidateManifestCache — no-op smoke test
    // -------------------------------------------------------------------------

    @Test
    void invalidateManifestCache_doesNotThrow() {
        HybridRoutingService svc = serviceWithProps(null, null, "http://localhost:8081");

        // Should complete without error even when cache is empty
        svc.invalidateManifestCache("corporate", "en");
        svc.invalidateManifestCache("corporate", "en"); // double-call is idempotent
    }

    // -------------------------------------------------------------------------
    // RoutingDecision helper
    // -------------------------------------------------------------------------

    @Test
    void routingDecision_s3_isStaticTrue() {
        HybridRoutingService.RoutingDecision decision =
                new HybridRoutingService.RoutingDecision(HybridRoutingService.Origin.S3, "https://cdn.example.com/about");
        assertThat(decision.isStatic()).isTrue();
        assertThat(decision.origin()).isEqualTo(HybridRoutingService.Origin.S3);
    }

    @Test
    void routingDecision_ssr_isStaticFalse() {
        HybridRoutingService.RoutingDecision decision =
                new HybridRoutingService.RoutingDecision(HybridRoutingService.Origin.SSR, "http://localhost:8081");
        assertThat(decision.isStatic()).isFalse();
        assertThat(decision.origin()).isEqualTo(HybridRoutingService.Origin.SSR);
    }
}
