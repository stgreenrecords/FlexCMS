package com.flexcms.publish.controller;

import com.flexcms.publish.service.PageResolver;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Publish tier page delivery controller — returns JSON only.
 *
 * <p>The backend never generates HTML. All rendering (SSR or CSR) is handled
 * by the frontend layer (Next.js, Nuxt, Angular SSR, or any framework using
 * {@code @flexcms/sdk}). This controller resolves URL → content path → JSON
 * page response and returns it for the frontend to render.</p>
 */
@RestController
public class PublishPageController {

    @Autowired
    private PageResolver pageResolver;

    /**
     * Catch-all handler for page delivery.
     * Resolves the request URL to a content node and returns structured JSON.
     * The frontend SSR framework (Next.js, Nuxt, etc.) consumes this JSON
     * and renders the HTML.
     */
    @GetMapping(value = {"/{path:^(?!api|static|dam|clientlibs|graphql|actuator).*$}/**", "/"},
                produces = "application/json")
    public ResponseEntity<Map<String, Object>> getPage(HttpServletRequest request) {
        var resolved = pageResolver.resolve(request);

        if (resolved.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(resolved.get().pageData());
    }
}



