package com.flexcms.app.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Servlet filter that populates SLF4J MDC with per-request correlation fields.
 *
 * <p>The following MDC keys are set for every HTTP request and cleared after:
 * <ul>
 *   <li>{@code requestId} — {@code X-Request-ID} header value, or a freshly generated UUID</li>
 *   <li>{@code traceId}   — echoes {@code requestId} (overwritten by OTel agent when present)</li>
 * </ul>
 *
 * <p>The {@code X-Request-ID} header is also added to the response so callers can
 * correlate their logs with server-side log entries.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorrelationIdFilter extends OncePerRequestFilter {

    static final String REQUEST_ID_HEADER = "X-Request-ID";
    static final String MDC_REQUEST_ID    = "requestId";
    static final String MDC_TRACE_ID      = "traceId";

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String requestId = request.getHeader(REQUEST_ID_HEADER);
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString();
        }

        MDC.put(MDC_REQUEST_ID, requestId);
        MDC.put(MDC_TRACE_ID,   requestId);   // overwritten by OTel when present
        response.setHeader(REQUEST_ID_HEADER, requestId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_REQUEST_ID);
            MDC.remove(MDC_TRACE_ID);
        }
    }
}
