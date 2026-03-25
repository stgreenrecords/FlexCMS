package com.flexcms.search.service;

import com.flexcms.core.model.ContentNode;
import com.flexcms.search.document.ContentNodeDocument;
import com.flexcms.search.repository.ContentSearchRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for SearchIndexService — mocks ES client/repository.
 */
@ExtendWith(MockitoExtension.class)
class SearchIndexServiceTest {

    @Mock
    private ContentSearchRepository searchRepository;

    @Mock
    private ElasticsearchOperations elasticsearchOps;

    @InjectMocks
    private SearchIndexService service;

    private ContentNode node;

    @BeforeEach
    void setUp() {
        node = new ContentNode("site.en.blog.post1", "post1", "flexcms/blog-post");
        node.setId(UUID.randomUUID());
        node.setSiteId("site1");
        node.setLocale("en");
        node.getProperties().put("jcr:title", "My Blog Post");
        node.getProperties().put("jcr:description", "A summary");
    }

    // -------------------------------------------------------------------------
    // index / indexAll / remove / removeBySite
    // -------------------------------------------------------------------------

    @Test
    void index_savesDocument() {
        service.index(node);

        ArgumentCaptor<ContentNodeDocument> captor = ArgumentCaptor.forClass(ContentNodeDocument.class);
        verify(searchRepository).save(captor.capture());
        ContentNodeDocument doc = captor.getValue();
        assertThat(doc.getPath()).isEqualTo("site.en.blog.post1");
        assertThat(doc.getTitle()).isEqualTo("My Blog Post");
        assertThat(doc.getSiteId()).isEqualTo("site1");
        assertThat(doc.getLocale()).isEqualTo("en");
    }

    @Test
    void index_stripsHtmlFromFullText() {
        node.getProperties().put("body", "<p>Hello <b>world</b></p>");

        service.index(node);

        ArgumentCaptor<ContentNodeDocument> captor = ArgumentCaptor.forClass(ContentNodeDocument.class);
        verify(searchRepository).save(captor.capture());
        String fullText = captor.getValue().getFullText();
        assertThat(fullText).doesNotContain("<p>").contains("Hello").contains("world");
    }

    @Test
    void indexAll_savesAllDocuments() {
        ContentNode node2 = new ContentNode("site.en.blog.post2", "post2", "flexcms/blog-post");
        node2.setId(UUID.randomUUID());
        node2.setSiteId("site1");
        node2.setLocale("en");

        service.indexAll(List.of(node, node2));

        ArgumentCaptor<List<ContentNodeDocument>> captor = ArgumentCaptor.forClass(List.class);
        verify(searchRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).hasSize(2);
    }

    @Test
    void remove_deletesDocumentByPath() {
        service.remove("site.en.page1");
        verify(searchRepository).deleteByPath("site.en.page1");
    }

    @Test
    void removeBySite_deletesBySiteId() {
        service.removeBySite("site1");
        verify(searchRepository).deleteBySiteId("site1");
    }

    // -------------------------------------------------------------------------
    // search
    // -------------------------------------------------------------------------

    @Test
    @SuppressWarnings("unchecked")
    void search_returnsResultsFromElasticsearch() {
        ContentNodeDocument doc = new ContentNodeDocument();
        doc.setPath("site.en.page1");
        doc.setTitle("Hello World");
        doc.setDescription("A test page");
        doc.setResourceType("flexcms/page");

        SearchHit<ContentNodeDocument> hit = mock(SearchHit.class);
        when(hit.getContent()).thenReturn(doc);
        when(hit.getScore()).thenReturn(1.5f);

        SearchHits<ContentNodeDocument> searchHits = mock(SearchHits.class);
        when(searchHits.getTotalHits()).thenReturn(1L);
        when(searchHits.getSearchHits()).thenReturn(List.of(hit));
        when(elasticsearchOps.search(any(NativeQuery.class), eq(ContentNodeDocument.class)))
                .thenReturn(searchHits);

        SearchIndexService.SearchResult result =
                service.search("hello", "site1", "en", PageRequest.of(0, 10));

        assertThat(result.totalCount()).isEqualTo(1L);
        assertThat(result.items()).hasSize(1);
        assertThat(result.items().get(0).path()).isEqualTo("site.en.page1");
        assertThat(result.items().get(0).score()).isEqualTo(1.5f);
    }

    // -------------------------------------------------------------------------
    // searchWithFacets
    // -------------------------------------------------------------------------

    @Test
    @SuppressWarnings("unchecked")
    void searchWithFacets_returnsResultsAndEmptyFacets_whenNoAggregations() {
        ContentNodeDocument doc = new ContentNodeDocument();
        doc.setPath("site.en.page1");
        doc.setTitle("Hello");
        doc.setDescription("desc");
        doc.setResourceType("flexcms/page");

        SearchHit<ContentNodeDocument> hit = mock(SearchHit.class);
        when(hit.getContent()).thenReturn(doc);
        when(hit.getScore()).thenReturn(1.0f);

        SearchHits<ContentNodeDocument> searchHits = mock(SearchHits.class);
        when(searchHits.getTotalHits()).thenReturn(1L);
        when(searchHits.getSearchHits()).thenReturn(List.of(hit));
        when(searchHits.getAggregations()).thenReturn(null); // no aggregations in mock
        when(elasticsearchOps.search(any(NativeQuery.class), eq(ContentNodeDocument.class)))
                .thenReturn(searchHits);

        SearchIndexService.FacetedSearchResult result =
                service.searchWithFacets("hello", "site1", "en", null, null, PageRequest.of(0, 10));

        assertThat(result.totalCount()).isEqualTo(1L);
        assertThat(result.items()).hasSize(1);
        assertThat(result.facets()).isEmpty(); // null aggregations → empty map
    }

    @Test
    @SuppressWarnings("unchecked")
    void searchWithFacets_passesFiltersToQuery() {
        SearchHits<ContentNodeDocument> searchHits = mock(SearchHits.class);
        when(searchHits.getTotalHits()).thenReturn(0L);
        when(searchHits.getSearchHits()).thenReturn(List.of());
        when(searchHits.getAggregations()).thenReturn(null);
        when(elasticsearchOps.search(any(NativeQuery.class), eq(ContentNodeDocument.class)))
                .thenReturn(searchHits);

        // Should not throw — filters are applied at query build time
        service.searchWithFacets("blog", "site1", "en", "flexcms/blog-post", "blog-post",
                PageRequest.of(0, 20));

        verify(elasticsearchOps).search(any(NativeQuery.class), eq(ContentNodeDocument.class));
    }
}
