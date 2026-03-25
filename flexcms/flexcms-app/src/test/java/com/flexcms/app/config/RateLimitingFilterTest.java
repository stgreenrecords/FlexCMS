package com.flexcms.app.config;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

/**
 * Unit tests for RateLimitingFilter — no Spring context required.
 */
class RateLimitingFilterTest {

    private RateLimitingFilter filter;
    private RateLimitingFilter.RateLimitProperties props;

    @BeforeEach
    void setUp() {
        props = new RateLimitingFilter.RateLimitProperties();
        props.setCapacity(5);
        props.setRefillTokens(5);
        props.setRefillSeconds(60);     // slow refill so tests don't auto-refill
        props.setBucketEvictionMinutes(60);
        filter = new RateLimitingFilter(props);
    }

    // -------------------------------------------------------------------------
    // shouldNotFilter — excluded paths
    // -------------------------------------------------------------------------

    @Test
    void authorPath_isExcluded() {
        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/author/content");
        assertThat(filter.shouldNotFilter(req)).isTrue();
    }

    @Test
    void actuatorPath_isExcluded() {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/actuator/health");
        assertThat(filter.shouldNotFilter(req)).isTrue();
    }

    @Test
    void swaggerPath_isExcluded() {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/swagger-ui/index.html");
        assertThat(filter.shouldNotFilter(req)).isTrue();
    }

    // -------------------------------------------------------------------------
    // shouldNotFilter — included paths
    // -------------------------------------------------------------------------

    @Test
    void headlessContentPath_isRateLimited() {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/content/nodes");
        assertThat(filter.shouldNotFilter(req)).isFalse();
    }

    @Test
    void pagesPath_isRateLimited() {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/pages/corporate/en/home");
        assertThat(filter.shouldNotFilter(req)).isFalse();
    }

    @Test
    void graphqlPath_isRateLimited() {
        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/graphql");
        assertThat(filter.shouldNotFilter(req)).isFalse();
    }

    // -------------------------------------------------------------------------
    // Token-bucket behaviour
    // -------------------------------------------------------------------------

    @Test
    void requestsWithinLimit_passThrough() throws Exception {
        FilterChain chain = mock(FilterChain.class);

        for (int i = 0; i < props.getCapacity(); i++) {
            MockHttpServletRequest req = request("/api/content/pages", "10.0.0.1");
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilterInternal(req, res, chain);
            assertThat(res.getStatus()).isNotEqualTo(429);
        }

        verify(chain, org.mockito.Mockito.times((int) props.getCapacity()))
                .doFilter(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }

    @Test
    void requestExceedingLimit_returns429() throws Exception {
        FilterChain chain = mock(FilterChain.class);

        // Exhaust the bucket
        for (int i = 0; i < props.getCapacity(); i++) {
            filter.doFilterInternal(request("/api/content/nodes", "10.0.0.2"),
                    new MockHttpServletResponse(), chain);
        }

        // One more should be rejected
        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilterInternal(request("/api/content/nodes", "10.0.0.2"), res, chain);

        assertThat(res.getStatus()).isEqualTo(429);
        assertThat(res.getHeader("Retry-After")).isNotNull();
        assertThat(res.getContentAsString()).contains("Rate limit exceeded");
    }

    @Test
    void differentIps_haveSeparateBuckets() throws Exception {
        FilterChain chain = mock(FilterChain.class);

        // Exhaust IP A
        for (int i = 0; i < props.getCapacity(); i++) {
            filter.doFilterInternal(request("/api/content/nodes", "10.0.0.3"),
                    new MockHttpServletResponse(), chain);
        }

        // IP B should still have full quota
        MockHttpServletResponse resB = new MockHttpServletResponse();
        filter.doFilterInternal(request("/api/content/nodes", "10.0.0.4"), resB, chain);
        assertThat(resB.getStatus()).isNotEqualTo(429);
    }

    @Test
    void xForwardedFor_usesFirstIp() throws Exception {
        FilterChain chain = mock(FilterChain.class);

        // Exhaust the bucket for the XFF IP
        for (int i = 0; i < props.getCapacity(); i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/content/nodes");
            req.addHeader("X-Forwarded-For", "203.0.113.5, 10.10.10.1");
            filter.doFilterInternal(req, new MockHttpServletResponse(), chain);
        }

        // Next request from same XFF IP should be blocked
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/content/nodes");
        req.addHeader("X-Forwarded-For", "203.0.113.5, 10.10.10.1");
        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilterInternal(req, res, chain);

        assertThat(res.getStatus()).isEqualTo(429);
    }

    @Test
    void remainingHeader_isIncludedOnSuccess() throws Exception {
        FilterChain chain = mock(FilterChain.class);
        MockHttpServletRequest req = request("/api/content/nodes", "10.0.0.5");
        MockHttpServletResponse res = new MockHttpServletResponse();

        filter.doFilterInternal(req, res, chain);

        assertThat(res.getHeader("X-Rate-Limit-Remaining")).isNotNull();
        assertThat(Long.parseLong(res.getHeader("X-Rate-Limit-Remaining")))
                .isEqualTo(props.getCapacity() - 1);
    }

    @Test
    void blockedResponse_hasZeroRemainingHeader() throws Exception {
        FilterChain chain = mock(FilterChain.class);

        for (int i = 0; i < props.getCapacity(); i++) {
            filter.doFilterInternal(request("/graphql", "10.0.0.6"),
                    new MockHttpServletResponse(), chain);
        }

        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilterInternal(request("/graphql", "10.0.0.6"), res, chain);

        assertThat(res.getHeader("X-Rate-Limit-Remaining")).isEqualTo("0");
        assertThat(res.getContentType()).contains("application/json");
    }

    // -------------------------------------------------------------------------
    // Helper
    // -------------------------------------------------------------------------

    private MockHttpServletRequest request(String path, String ip) {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", path);
        req.setRemoteAddr(ip);
        return req;
    }
}
