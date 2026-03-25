package com.flexcms.headless.controller;

import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.service.ContentDeliveryService;
import com.flexcms.core.service.ContentNodeService;
import com.flexcms.plugin.model.RenderContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Locale;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;

/**
 * REST API for headless page delivery.
 */
@Tag(name = "Headless Pages", description = "Retrieve rendered page data and component trees for headless rendering")
@RestController
@RequestMapping("/api/content/v1/pages")
public class PageApiController {

    @Autowired
    private ContentDeliveryService deliveryService;

    @Autowired
    private ContentNodeService nodeService;   // FIX BUG-01: injected via DI, not new()

    /**
     * Get a page with full component tree.
     */
    @GetMapping("/{*path}")
    public ResponseEntity<Map<String, Object>> getPage(
            @PathVariable String path,
            @RequestHeader(value = "X-FlexCMS-Site", required = false) String siteId,
            @RequestHeader(value = "X-FlexCMS-Locale", required = false, defaultValue = "en") String locale,
            HttpServletRequest request) {

        String contentPath = toContentPath(path);
        RenderContext context = new RenderContext(siteId, Locale.forLanguageTag(locale),
                request.getRequestURI(), "publish");

        Map<String, Object> pageData = deliveryService.renderPage(contentPath, context);
        return ResponseEntity.ok(pageData);
        // NotFoundException from deliveryService propagates to GlobalExceptionHandler
    }

    /**
     * Get child pages (for navigation).
     * URL: GET /api/content/v1/pages/children/{*path}
     */
    @GetMapping("/children/{*path}")
    public ResponseEntity<?> getChildren(
            @PathVariable String path,
            @RequestHeader(value = "X-FlexCMS-Site", required = false) String siteId) {
        String contentPath = toContentPath(path);
        var parent = nodeService.getByPath(contentPath)
                .orElseThrow(() -> NotFoundException.forPath(contentPath));
        var children = nodeService.getChildren(contentPath);
        return ResponseEntity.ok(Map.of(
                "path", contentPath,
                "siteId", parent.getSiteId() != null ? parent.getSiteId() : "",
                "children", children
        ));
    }

    private String toContentPath(String path) {
        String p = path.startsWith("/") ? path.substring(1) : path;
        p = p.replace("/", ".");
        return p.startsWith("content.") ? p : "content." + p;
    }
}
