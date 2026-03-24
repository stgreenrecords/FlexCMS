package com.flexcms.headless.controller;

import com.flexcms.search.service.SearchIndexService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST API for full-text search.
 */
@RestController
@RequestMapping("/api/content/v1/search")
public class SearchApiController {

    @Autowired
    private SearchIndexService searchService;

    @GetMapping
    public ResponseEntity<SearchIndexService.SearchResult> search(
            @RequestParam String q,
            @RequestParam(required = false) String site,
            @RequestParam(required = false) String locale,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        var result = searchService.search(q, site, locale, PageRequest.of(page, size));
        return ResponseEntity.ok(result);
    }
}

