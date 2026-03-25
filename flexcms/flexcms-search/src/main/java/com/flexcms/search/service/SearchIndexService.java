package com.flexcms.search.service;

import co.elastic.clients.elasticsearch._types.aggregations.Aggregation;
import com.flexcms.core.model.ContentNode;
import com.flexcms.search.document.ContentNodeDocument;
import com.flexcms.search.repository.ContentSearchRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchAggregations;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
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
     * Remove all indexed documents for a given site (used before a full site reindex).
     */
    public void removeBySite(String siteId) {
        searchRepository.deleteBySiteId(siteId);
        log.info("Removed all index documents for site: {}", siteId);
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

    /**
     * Full-text search with facet aggregations.
     *
     * <p>In addition to paginated results, the response includes term-bucket aggregations
     * for {@code resourceType}, {@code locale}, and {@code template} fields so that
     * callers can render faceted navigation (e.g. "Articles (12) | Blog Posts (5)").</p>
     *
     * <p>The optional {@code resourceType} and {@code template} parameters act as
     * post-filters: when provided they narrow the result set but the aggregation counts
     * still reflect the un-filtered result set.</p>
     *
     * @param query        full-text query string
     * @param siteId       optional site filter
     * @param locale       optional locale filter
     * @param resourceType optional content type filter (e.g. {@code flexcms/page})
     * @param template     optional template filter (e.g. {@code blog-post})
     * @param pageable     pagination
     * @return result with hits and aggregated facet counts
     */
    public FacetedSearchResult searchWithFacets(String query, String siteId, String locale,
                                                 String resourceType, String template,
                                                 Pageable pageable) {
        NativeQuery searchQuery = NativeQuery.builder()
                .withQuery(q -> q
                        .bool(b -> {
                            b.must(m -> m.multiMatch(mm -> mm
                                    .query(query)
                                    .fields("title^3", "description^2", "fullText")));
                            if (siteId != null) {
                                b.filter(f -> f.term(t -> t.field("siteId").value(siteId)));
                            }
                            if (locale != null) {
                                b.filter(f -> f.term(t -> t.field("locale").value(locale)));
                            }
                            if (resourceType != null) {
                                b.filter(f -> f.term(t -> t.field("resourceType").value(resourceType)));
                            }
                            if (template != null) {
                                b.filter(f -> f.term(t -> t.field("template").value(template)));
                            }
                            return b;
                        }))
                .withAggregation("by_resourceType",
                        Aggregation.of(a -> a.terms(t -> t.field("resourceType").size(50))))
                .withAggregation("by_locale",
                        Aggregation.of(a -> a.terms(t -> t.field("locale").size(50))))
                .withAggregation("by_template",
                        Aggregation.of(a -> a.terms(t -> t.field("template").size(50))))
                .withPageable(pageable)
                .build();

        SearchHits<ContentNodeDocument> hits =
                elasticsearchOps.search(searchQuery, ContentNodeDocument.class);

        List<SearchHitResult> results = hits.getSearchHits().stream()
                .map(hit -> new SearchHitResult(
                        hit.getContent().getPath(),
                        hit.getContent().getTitle(),
                        hit.getContent().getDescription(),
                        hit.getScore(),
                        hit.getContent().getResourceType()))
                .collect(Collectors.toList());

        Map<String, List<FacetBucket>> facets = extractFacets(hits);
        return new FacetedSearchResult(hits.getTotalHits(), results, facets);
    }

    // -------------------------------------------------------------------------
    // Aggregation extraction
    // -------------------------------------------------------------------------

    /**
     * Extract term-bucket aggregations from a search result.
     * Returns an empty map when aggregations are not present (e.g. in unit tests).
     */
    private Map<String, List<FacetBucket>> extractFacets(SearchHits<ContentNodeDocument> hits) {
        Map<String, List<FacetBucket>> facets = new LinkedHashMap<>();
        if (hits.getAggregations() == null) {
            return facets;
        }
        ElasticsearchAggregations aggregations = (ElasticsearchAggregations) hits.getAggregations();
        for (String name : List.of("by_resourceType", "by_locale", "by_template")) {
            var agg = aggregations.get(name);
            if (agg == null) continue;
            var aggregate = agg.aggregation().getAggregate();
            if (aggregate.isSterms()) {
                List<FacetBucket> buckets = aggregate.sterms().buckets().array().stream()
                        .map(b -> new FacetBucket(b.key().stringValue(), b.docCount()))
                        .filter(b -> b.value() != null && !b.value().isBlank())
                        .collect(Collectors.toList());
                if (!buckets.isEmpty()) {
                    facets.put(name.replaceFirst("^by_", ""), buckets);
                }
            }
        }
        return facets;
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

    /**
     * Search result that includes term-bucket facet aggregations alongside the paginated hits.
     *
     * @param totalCount total number of matching documents
     * @param items      paginated result items
     * @param facets     map of facet dimension name → list of value/count buckets
     *                   (e.g. {@code "resourceType" → [{value:"flexcms/page", count:12}, ...]})
     */
    public record FacetedSearchResult(
            long totalCount,
            List<SearchHitResult> items,
            Map<String, List<FacetBucket>> facets) {}

    /**
     * A single bucket in a facet aggregation — represents one distinct value and its document count.
     */
    public record FacetBucket(String value, long count) {}
}

