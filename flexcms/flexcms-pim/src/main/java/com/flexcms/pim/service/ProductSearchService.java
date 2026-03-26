package com.flexcms.pim.service;

import co.elastic.clients.elasticsearch._types.aggregations.Aggregation;
import com.flexcms.pim.model.Product;
import com.flexcms.pim.search.ProductDocument;
import com.flexcms.pim.search.ProductSearchRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchAggregations;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Manages the Elasticsearch product index for PIM.
 *
 * <p>Products are indexed on create/update/publish and removed on delete.
 * The index supports full-text search across product name + all string attributes,
 * plus keyword filter aggregations by status and catalog.</p>
 */
@Service
public class ProductSearchService {

    private static final Logger log = LoggerFactory.getLogger(ProductSearchService.class);

    @Autowired
    private ProductSearchRepository productSearchRepository;

    @Autowired
    private ElasticsearchOperations elasticsearchOps;

    // -------------------------------------------------------------------------
    // Indexing
    // -------------------------------------------------------------------------

    /**
     * Index (or re-index) a single product.
     */
    public void index(Product product) {
        ProductDocument doc = toDocument(product);
        productSearchRepository.save(doc);
        log.debug("Indexed product: {}", product.getSku());
    }

    /**
     * Index a batch of products.
     */
    public void indexAll(List<Product> products) {
        List<ProductDocument> docs = products.stream()
                .map(this::toDocument)
                .collect(Collectors.toList());
        productSearchRepository.saveAll(docs);
        log.info("Bulk indexed {} product documents", docs.size());
    }

    /**
     * Remove a product from the index by SKU.
     */
    public void remove(String sku) {
        productSearchRepository.deleteBySku(sku);
        log.debug("Removed product from index: {}", sku);
    }

    /**
     * Remove all indexed products for a catalog (used before full catalog reindex).
     */
    public void removeByCatalog(String catalogId) {
        productSearchRepository.deleteByCatalogId(catalogId);
        log.info("Removed all indexed products for catalog: {}", catalogId);
    }

    // -------------------------------------------------------------------------
    // Search
    // -------------------------------------------------------------------------

    /**
     * Full-text search across product name and all string attributes.
     *
     * @param query     free-text query
     * @param catalogId optional catalog filter
     * @param status    optional status filter (e.g. "PUBLISHED")
     * @param pageable  pagination
     * @return paginated search result with total count
     */
    public ProductSearchResult search(String query, String catalogId, String status, Pageable pageable) {
        NativeQuery searchQuery = NativeQuery.builder()
                .withQuery(q -> q
                        .bool(b -> {
                            b.must(m -> m.multiMatch(mm -> mm
                                    .query(query)
                                    .fields("name^3", "sku^2", "fullText")
                            ));
                            if (catalogId != null) {
                                b.filter(f -> f.term(t -> t.field("catalogId").value(catalogId)));
                            }
                            if (status != null) {
                                b.filter(f -> f.term(t -> t.field("status").value(status)));
                            }
                            return b;
                        }))
                .withPageable(pageable)
                .build();

        SearchHits<ProductDocument> hits = elasticsearchOps.search(searchQuery, ProductDocument.class);

        List<ProductSearchHit> results = hits.getSearchHits().stream()
                .map(hit -> new ProductSearchHit(
                        hit.getContent().getSku(),
                        hit.getContent().getName(),
                        hit.getContent().getCatalogId(),
                        hit.getContent().getStatus(),
                        hit.getScore()))
                .collect(Collectors.toList());

        return new ProductSearchResult(hits.getTotalHits(), results);
    }

    /**
     * Full-text search with facet aggregations for status and catalog.
     *
     * @param query     free-text query
     * @param catalogId optional catalog filter
     * @param status    optional status filter
     * @param pageable  pagination
     * @return result with hits and facet buckets
     */
    public ProductFacetedSearchResult searchWithFacets(String query, String catalogId, String status,
                                                        Pageable pageable) {
        NativeQuery searchQuery = NativeQuery.builder()
                .withQuery(q -> q
                        .bool(b -> {
                            b.must(m -> m.multiMatch(mm -> mm
                                    .query(query)
                                    .fields("name^3", "sku^2", "fullText")));
                            if (catalogId != null) {
                                b.filter(f -> f.term(t -> t.field("catalogId").value(catalogId)));
                            }
                            if (status != null) {
                                b.filter(f -> f.term(t -> t.field("status").value(status)));
                            }
                            return b;
                        }))
                .withAggregation("by_status",
                        Aggregation.of(a -> a.terms(t -> t.field("status").size(20))))
                .withAggregation("by_catalog",
                        Aggregation.of(a -> a.terms(t -> t.field("catalogId").size(50))))
                .withPageable(pageable)
                .build();

        SearchHits<ProductDocument> hits = elasticsearchOps.search(searchQuery, ProductDocument.class);

        List<ProductSearchHit> results = hits.getSearchHits().stream()
                .map(hit -> new ProductSearchHit(
                        hit.getContent().getSku(),
                        hit.getContent().getName(),
                        hit.getContent().getCatalogId(),
                        hit.getContent().getStatus(),
                        hit.getScore()))
                .collect(Collectors.toList());

        Map<String, List<FacetBucket>> facets = extractFacets(hits);
        return new ProductFacetedSearchResult(hits.getTotalHits(), results, facets);
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    private Map<String, List<FacetBucket>> extractFacets(SearchHits<ProductDocument> hits) {
        Map<String, List<FacetBucket>> facets = new LinkedHashMap<>();
        if (hits.getAggregations() == null) return facets;

        ElasticsearchAggregations aggregations = (ElasticsearchAggregations) hits.getAggregations();
        for (String name : List.of("by_status", "by_catalog")) {
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

    private ProductDocument toDocument(Product product) {
        ProductDocument doc = new ProductDocument();
        doc.setId(product.getId().toString());
        doc.setSku(product.getSku());
        doc.setName(product.getName());
        if (product.getCatalog() != null) {
            doc.setCatalogId(product.getCatalog().getId().toString());
            doc.setCatalogName(product.getCatalog().getName());
        }
        doc.setStatus(product.getStatus() != null ? product.getStatus().name() : null);
        doc.setAttributes(product.getResolvedAttributes());
        doc.setCreatedAt(product.getCreatedAt());
        doc.setUpdatedAt(product.getUpdatedAt());
        doc.setUpdatedBy(product.getUpdatedBy());

        // Build full-text field from all string-valued resolved attributes
        Map<String, Object> attrs = product.getResolvedAttributes();
        StringBuilder fullText = new StringBuilder(product.getName()).append(" ").append(product.getSku());
        for (Object value : attrs.values()) {
            if (value instanceof String s && !s.isBlank()) {
                fullText.append(" ").append(s);
            }
        }
        doc.setFullText(fullText.toString().trim());

        return doc;
    }

    // -------------------------------------------------------------------------
    // Result types
    // -------------------------------------------------------------------------

    public record ProductSearchResult(long totalCount, List<ProductSearchHit> items) {}

    public record ProductSearchHit(String sku, String name, String catalogId, String status, float score) {}

    public record ProductFacetedSearchResult(
            long totalCount,
            List<ProductSearchHit> items,
            Map<String, List<FacetBucket>> facets) {}

    public record FacetBucket(String value, long count) {}
}
