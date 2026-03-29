package com.flexcms.author.controller;

import com.flexcms.core.service.TemplateRegistryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@Tag(name = "Author Templates", description = "Template definition lookup for authoring UIs")
@RestController
@RequestMapping("/api/author/content/templates")
public class TemplateDefinitionController {

    @Autowired
    private TemplateRegistryService templateRegistryService;

    @Operation(summary = "List active page templates")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR','CONTENT_REVIEWER','CONTENT_PUBLISHER')")
    public ResponseEntity<Map<String, Object>> listTemplates() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("templates", templateRegistryService.getActiveTemplates());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get one page template by name")
    @GetMapping("/{name}")
    @PreAuthorize("hasAnyRole('ADMIN','CONTENT_AUTHOR','CONTENT_REVIEWER','CONTENT_PUBLISHER')")
    public ResponseEntity<TemplateRegistryService.TemplateContract> getTemplate(@PathVariable String name) {
        return templateRegistryService.getTemplate(name)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
