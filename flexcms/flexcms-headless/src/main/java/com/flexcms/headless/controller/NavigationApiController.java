package com.flexcms.headless.controller;

import com.flexcms.core.service.ContentDeliveryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST API for site navigation trees.
 */
@RestController
@RequestMapping("/api/content/v1/navigation")
public class NavigationApiController {

    @Autowired
    private ContentDeliveryService deliveryService;

    /**
     * Get navigation tree for a site and locale.
     */
    @GetMapping("/{siteId}/{locale}")
    public ResponseEntity<List<Map<String, Object>>> getNavigation(
            @PathVariable String siteId,
            @PathVariable String locale,
            @RequestParam(defaultValue = "3") int depth) {

        List<Map<String, Object>> nav = deliveryService.buildNavigation(siteId, locale, depth);
        return ResponseEntity.ok(nav);
    }
}

