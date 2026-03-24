package com.flexcms.headless.controller;

import com.flexcms.core.service.ContentDeliveryService;
import com.flexcms.core.service.ContentNodeService;
import com.flexcms.plugin.model.RenderContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Locale;
import java.util.Map;

/**
 * REST API for headless page delivery.
 */
@RestController
@RequestMapping("/api/content/v1/pages")
public class PageApiController {

    @Autowired
    private ContentDeliveryService deliveryService;

    /**
     * Get a page with full component tree.
     */
    @GetMapping("/{*path}")
    public ResponseEntity<Map<String, Object>> getPage(
            @PathVariable String path,
            @RequestHeader(value = "X-FlexCMS-Site", required = false) String siteId,
            @RequestHeader(value = "X-FlexCMS-Locale", required = false, defaultValue = "en") String locale,
            HttpServletRequest request) {

        String contentPath = path.replace("/", ".");
        if (!contentPath.startsWith("content.")) {
            contentPath = "content." + contentPath;
        }

        RenderContext context = new RenderContext(siteId, Locale.forLanguageTag(locale),
                request.getRequestURI(), "publish");

        try {
            Map<String, Object> pageData = deliveryService.renderPage(contentPath, context);
            return ResponseEntity.ok(pageData);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get child pages (for navigation).
     */
    @GetMapping("/{*path}/children")
    public ResponseEntity<?> getChildren(@PathVariable String path,
                                          @RequestHeader(value = "X-FlexCMS-Site", required = false) String siteId) {
        String contentPath = path.replace("/", ".");
        if (!contentPath.startsWith("content.")) {
            contentPath = "content." + contentPath;
        }

        var node = new ContentNodeService();
        // Delegate to delivery service for child listing
        return ResponseEntity.ok(Map.of("path", contentPath, "message", "Children endpoint"));
    }
}

