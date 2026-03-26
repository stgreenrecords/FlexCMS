package com.flexcms.pim.service;

import com.flexcms.pim.model.Catalog;
import com.flexcms.pim.model.Product;
import com.flexcms.pim.model.ProductStatus;
import com.flexcms.pim.search.ProductDocument;
import com.flexcms.pim.search.ProductSearchRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHits;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.elasticsearch.client.elc.NativeQuery;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductSearchServiceTest {

    @Mock private ProductSearchRepository productSearchRepository;
    @Mock private ElasticsearchOperations elasticsearchOps;

    @InjectMocks
    private ProductSearchService productSearchService;

    private Product product;
    private final UUID productId = UUID.randomUUID();
    private final UUID catalogId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        Catalog catalog = new Catalog();
        catalog.setId(catalogId);
        catalog.setName("Test Catalog");

        product = new Product();
        product.setId(productId);
        product.setSku("SKU-001");
        product.setName("Widget Pro");
        product.setCatalog(catalog);
        product.setStatus(ProductStatus.PUBLISHED);
        product.setAttributes(Map.of("color", "red", "weight", "1.5kg"));
    }

    // ── index ─────────────────────────────────────────────────────────────────

    @Test
    void index_savesDocumentWithCorrectFields() {
        productSearchService.index(product);

        ArgumentCaptor<ProductDocument> captor = ArgumentCaptor.forClass(ProductDocument.class);
        verify(productSearchRepository).save(captor.capture());

        ProductDocument doc = captor.getValue();
        assertThat(doc.getId()).isEqualTo(productId.toString());
        assertThat(doc.getSku()).isEqualTo("SKU-001");
        assertThat(doc.getName()).isEqualTo("Widget Pro");
        assertThat(doc.getCatalogId()).isEqualTo(catalogId.toString());
        assertThat(doc.getCatalogName()).isEqualTo("Test Catalog");
        assertThat(doc.getStatus()).isEqualTo("PUBLISHED");
    }

    @Test
    void index_fullTextContainsNameSkuAndStringAttributes() {
        productSearchService.index(product);

        ArgumentCaptor<ProductDocument> captor = ArgumentCaptor.forClass(ProductDocument.class);
        verify(productSearchRepository).save(captor.capture());

        String fullText = captor.getValue().getFullText();
        assertThat(fullText).contains("Widget Pro");
        assertThat(fullText).contains("SKU-001");
        assertThat(fullText).contains("red");
        assertThat(fullText).contains("1.5kg");
    }

    @Test
    void index_productWithoutCatalog_doesNotThrow() {
        product.setCatalog(null);
        productSearchService.index(product);
        verify(productSearchRepository).save(any());
    }

    // ── indexAll ──────────────────────────────────────────────────────────────

    @Test
    void indexAll_savesAllDocuments() {
        Product second = new Product();
        second.setId(UUID.randomUUID());
        second.setSku("SKU-002");
        second.setName("Gadget");
        second.setStatus(ProductStatus.DRAFT);
        second.setAttributes(Map.of());

        productSearchService.indexAll(List.of(product, second));

        ArgumentCaptor<List<ProductDocument>> captor = ArgumentCaptor.forClass(List.class);
        verify(productSearchRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).hasSize(2);
    }

    // ── remove ────────────────────────────────────────────────────────────────

    @Test
    void remove_deletesBySkuInRepository() {
        productSearchService.remove("SKU-001");
        verify(productSearchRepository).deleteBySku("SKU-001");
    }

    @Test
    void removeByCatalog_deletesByCatalogIdInRepository() {
        String cid = catalogId.toString();
        productSearchService.removeByCatalog(cid);
        verify(productSearchRepository).deleteByCatalogId(cid);
    }

    // ── search ────────────────────────────────────────────────────────────────

    @Test
    void search_delegatesToElasticsearchOps() {
        SearchHits<ProductDocument> mockHits = mockEmptyHits();
        when(elasticsearchOps.search(any(NativeQuery.class), eq(ProductDocument.class))).thenReturn(mockHits);

        ProductSearchService.ProductSearchResult result =
                productSearchService.search("widget", null, null,
                        org.springframework.data.domain.PageRequest.of(0, 10));

        assertThat(result.totalCount()).isZero();
        assertThat(result.items()).isEmpty();
        verify(elasticsearchOps).search(any(NativeQuery.class), eq(ProductDocument.class));
    }

    @Test
    void searchWithFacets_delegatesToElasticsearchOps() {
        SearchHits<ProductDocument> mockHits = mockEmptyHitsWithAggregations();
        when(elasticsearchOps.search(any(NativeQuery.class), eq(ProductDocument.class))).thenReturn(mockHits);

        ProductSearchService.ProductFacetedSearchResult result =
                productSearchService.searchWithFacets("widget", catalogId.toString(), "PUBLISHED",
                        org.springframework.data.domain.PageRequest.of(0, 10));

        assertThat(result.totalCount()).isZero();
        assertThat(result.items()).isEmpty();
        assertThat(result.facets()).isEmpty();
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private SearchHits<ProductDocument> mockEmptyHits() {
        SearchHits<ProductDocument> hits = mock(SearchHits.class);
        when(hits.getTotalHits()).thenReturn(0L);
        when(hits.getSearchHits()).thenReturn(List.of());
        return hits;
    }

    private SearchHits<ProductDocument> mockEmptyHitsWithAggregations() {
        SearchHits<ProductDocument> hits = mockEmptyHits();
        when(hits.getAggregations()).thenReturn(null);
        return hits;
    }
}
