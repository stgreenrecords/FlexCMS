package com.flexcms.cache.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Servlet filter that sets Cache-Control, Vary, and ETag headers
 * based on the request path and content type.
 */
@Component
@Order(1)
public class CacheControlFilter implements Filter {

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;

        chain.doFilter(request, response);

        String path = request.getRequestURI();
        applyCacheHeaders(path, request, response);
    }

    private void applyCacheHeaders(String path, HttpServletRequest request, HttpServletResponse response) {
        // Static assets with content hash — immutable, 1 year
        if (path.matches("/static/.*\\.[a-f0-9]{8}\\..*")) {
            response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
            return;
        }

        // DAM renditions — long cache
        if (path.startsWith("/dam/renditions/")) {
            response.setHeader("Cache-Control", "public, max-age=2592000, s-maxage=31536000");
            response.setHeader("Vary", "Accept");
            return;
        }

        // ClientLib bundles (versioned via hash) — long cache
        if (path.startsWith("/clientlibs/") && path.matches(".*\\.[a-f0-9]{8}\\.(css|js)$")) {
            response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
            return;
        }

        // Author/admin environment — no cache
        if (path.startsWith("/api/author/") || path.startsWith("/admin/")) {
            response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
            return;
        }

        // Headless API responses — moderate cache
        if (path.startsWith("/api/content/")) {
            response.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=3600");
            response.setHeader("Vary", "Accept, Accept-Language, X-FlexCMS-Site, X-FlexCMS-Locale");
            return;
        }

        // HTML pages — short browser cache, longer CDN cache
        String accept = request.getHeader("Accept");
        if (accept != null && accept.contains("text/html")) {
            response.setHeader("Cache-Control", "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400");
            response.setHeader("Vary", "Accept-Language, X-FlexCMS-Site");
            return;
        }

        // Default — short cache
        response.setHeader("Cache-Control", "public, max-age=60");
    }
}

