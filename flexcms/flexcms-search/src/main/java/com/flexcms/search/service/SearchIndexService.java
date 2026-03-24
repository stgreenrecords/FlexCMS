package com.flexcms.search.service;

import com.flexcms.core.model.ContentNode;
import com.flexcms.search.document.ContentNodeDocument;
import com.flexcms.search.repository.ContentSearchRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Full-text search and indexing service backed by Elasticsearch.
 */
@Service
public class SearchIndexService {

    private static final Logger log = LoggerFactory.getLogger(SearchIndexService.class);

    @Autowired
    private ContentSearchRepository searchRepository;

    @Autowired
    private ElasticsearchOperations elasticsearchOps;

    /**
     * Index a content node (called after publish / replication).
     */
    public void index(ContentNode node) {
        ContentNodeDocument doc = toDocument(node);
        searchRepository.save(doc);
        log.debug("Indexed content: {}", node.getPath());
    }

    /**
     * Index multiple nodes in bulk.
     */
    public void indexAll(List<ContentNode> nodes) {
        List<ContentNodeDocument> docs = nodes.stream()
                .map(this::toDocument)
                .collect(Collectors.toList());
        searchRepository.saveAll(docs);
        log.info("Bulk indexed {} documents", docs.size());
    }

    /**
     * Remove a node from the index.
     */
    public void remove(String path) {
        searchRepository.deleteByPath(path);
        log.debug("Removed from index: {}", path);
    }

    /**
     * Full-text search across content.
     */
    public SearchResult search(String query, String siteId, String locale, Pageable pageable) {
        NativeQuery searchQuery = NativeQuery.builder()
                .withQuery(q -> q
                        .bool(b -> {
                            b.must(m -> m.multiMatch(mm -> mm
                                    .query(query)
                                    .fields("title^3", "description^2", "fullText")
                            ));
                            if (siteId != null) {
                                b.filter(f -> f.term(t -> t.field("siteId").value(siteId)));
                            }
                            if (locale != null) {
                                b.filter(f -> f.term(t -> t.field("locale").value(locale)));
                            }
                            return b;
                        }))
                .withPageable(pageable)
                .build();

        SearchHits<ContentNodeDocument> hits = elasticsearchOps.search(searchQuery, ContentNodeDocument.class);

        List<SearchHitResult> results = hits.getSearchHits().stream()
                .map(hit -> new SearchHitResult(
                        hit.getContent().getPath(),
                        hit.getContent().getTitle(),
                        hit.getContent().getDescription(),
                        hit.getScore(),
                        hit.getContent().getResourceType()))
                .collect(Collectors.toList());

        return new SearchResult(hits.getTotalHits(), results);
    }

    /**
     * Search with additional template filter.
     */
    public Page<ContentNodeDocument> searchByTemplate(String siteId, String locale,
                                                        String template, Pageable pageable) {
        return searchRepository.findBySiteIdAndLocaleAndResourceType(siteId, locale, template, pageable);
    }

    private ContentNodeDocument toDocument(ContentNode node) {
        ContentNodeDocument doc = new ContentNodeDocument();
        doc.setId(node.getId().toString());
        doc.setPath(node.getPath());
        doc.setTitle(node.getProperty("jcr:title", String.class));
        doc.setDescription(node.getProperty("jcr:description", String.class));
        doc.setResourceType(node.getResourceType());
        doc.setSiteId(node.getSiteId());
        doc.setLocale(node.getLocale());
        doc.setTemplate(node.getProperty("template", String.class));
        doc.setStatus(node.getStatus() != null ? node.getStatus().name() : null);
        doc.setProperties(node.getProperties());
        doc.setModifiedAt(node.getModifiedAt());
        doc.setModifiedBy(node.getModifiedBy());

        // Build full-text content from all string properties
        StringBuilder fullText = new StringBuilder();
        for (Object value : node.getProperties().values()) {
            if (value instanceof String s) {
                fullText.append(stripHtml(s)).append(" ");
            }
        }
        doc.setFullText(fullText.toString().trim());

        return doc;
    }

    private String stripHtml(String html) {
        return html.replaceAll("<[^>]*>", " ").replaceAll("\\s+", " ").trim();
    }

    public record SearchResult(long totalCount, List<SearchHitResult> items) {}
    public record SearchHitResult(String path, String title, String excerpt, float score, String type) {}
}

