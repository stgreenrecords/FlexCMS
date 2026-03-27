package com.flexcms.headless.graphql;

import com.flexcms.core.model.Asset;
import com.flexcms.core.model.ComponentDefinition;
import com.flexcms.core.model.ContentNode;
import com.flexcms.core.model.NodeStatus;
import com.flexcms.core.repository.AssetRepository;
import com.flexcms.core.service.ComponentRegistry;
import com.flexcms.core.service.ContentDeliveryService;
import com.flexcms.core.service.ContentNodeService;
import com.flexcms.search.service.SearchIndexService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContentQueryResolverTest {

    @Mock
    private ContentNodeService nodeService;

    @Mock
    private ContentDeliveryService deliveryService;

    @Mock
    private ComponentRegistry componentRegistry;

    @Mock
    private SearchIndexService searchService;

    @Mock
    private AssetRepository assetRepository;

    @InjectMocks
    private ContentQueryResolver resolver;

    // -------------------------------------------------------------------------
    // page
    // -------------------------------------------------------------------------

    @Test
    void page_returnsFlattenedPageStructure() {
        Map<String, Object> pageMeta = new LinkedHashMap<>();
        pageMeta.put("path", "content.corporate.en.home");
        pageMeta.put("title", "Home");
        pageMeta.put("locale", "en");

        Map<String, Object> raw = new LinkedHashMap<>();
        raw.put("page", pageMeta);
        raw.put("components", List.of(Map.of("name", "hero")));

        when(deliveryService.renderPage(eq("content.corporate.en.home"), any()))
                .thenReturn(raw);

        Map<String, Object> result = resolver.page("/corporate/en/home", "corporate", "en");

        assertThat(result).containsKey("path");
        assertThat(result).containsKey("title");
        assertThat(result).containsKey("components");
        assertThat(result).doesNotContainKey("page"); // Flattened — not nested
        assertThat(result.get("path")).isEqualTo("content.corporate.en.home");
    }

    @Test
    void page_returnsNull_whenPageNotFound() {
        when(deliveryService.renderPage(any(), any()))
                .thenThrow(new IllegalArgumentException("Page not found"));

        Map<String, Object> result = resolver.page("/missing", null, null);

        assertThat(result).isNull();
    }

    @Test
    void page_usesEnglishLocale_whenLocaleIsNull() {
        Map<String, Object> raw = Map.of("page", Map.of("path", "content.site.en.home"), "components", List.of());
        when(deliveryService.renderPage(any(), any())).thenReturn(raw);

        resolver.page("/site/en/home", "site", null);

        verify(deliveryService).renderPage(eq("content.site.en.home"), argThat(ctx ->
                ctx.getLocale().equals(Locale.ENGLISH)));
    }

    // -------------------------------------------------------------------------
    // pages
    // -------------------------------------------------------------------------

    @Test
    void pages_returnsPageConnection() {
        Map<String, Object> connection = Map.of(
                "totalCount", 5L,
                "items", List.of(Map.of("path", "content.corp.en.home")));
        when(deliveryService.listPages("corp", "en", null, 20, 0)).thenReturn(connection);

        Map<String, Object> result = resolver.pages("corp", "en", null, null, null);

        assertThat(result).containsKey("totalCount");
        assertThat(result).containsKey("items");
        assertThat(result.get("totalCount")).isEqualTo(5L);
    }

    @Test
    void pages_usesDefaultLimitAndOffset() {
        when(deliveryService.listPages(any(), any(), any(), eq(20), eq(0)))
                .thenReturn(Map.of("totalCount", 0L, "items", List.of()));

        resolver.pages("corp", null, null, null, null);

        verify(deliveryService).listPages("corp", null, null, 20, 0);
    }

    @Test
    void pages_passesTemplateFilter() {
        when(deliveryService.listPages("corp", "en", "flexcms/landing", 10, 0))
                .thenReturn(Map.of("totalCount", 2L, "items", List.of()));

        resolver.pages("corp", "en", "flexcms/landing", 10, 0);

        verify(deliveryService).listPages("corp", "en", "flexcms/landing", 10, 0);
    }

    // -------------------------------------------------------------------------
    // node
    // -------------------------------------------------------------------------

    @Test
    void node_returnsMappedNode() {
        ContentNode node = node("content.corp.en.about", "about", "flexcms/page");
        when(nodeService.getByPath("content.corp.en.about")).thenReturn(Optional.of(node));

        Map<String, Object> result = resolver.node("content.corp.en.about");

        assertThat(result).containsEntry("path", "content.corp.en.about");
        assertThat(result).containsEntry("name", "about");
        assertThat(result).containsEntry("resourceType", "flexcms/page");
    }

    @Test
    void node_returnsNull_whenNotFound() {
        when(nodeService.getByPath(any())).thenReturn(Optional.empty());

        assertThat(resolver.node("/missing")).isNull();
    }

    @Test
    void node_convertsUrlPathToDotPath() {
        // node() does NOT prepend "content." — it uses the path as-is (dot-separated).
        // See CLAUDE.md: "GraphQL node() resolver uses path directly (no content. prefix added)."
        when(nodeService.getByPath("corp.en.about")).thenReturn(Optional.empty());

        resolver.node("/corp/en/about");

        verify(nodeService).getByPath("corp.en.about");
    }

    // -------------------------------------------------------------------------
    // search
    // -------------------------------------------------------------------------

    @Test
    void search_delegatesToSearchService() {
        SearchIndexService.SearchResult mockResult = new SearchIndexService.SearchResult(3, List.of());
        when(searchService.search(eq("shoe"), eq("corp"), eq("en"), any(PageRequest.class)))
                .thenReturn(mockResult);

        SearchIndexService.SearchResult result = resolver.search("shoe", "corp", "en", 10);

        assertThat(result.totalCount()).isEqualTo(3);
        verify(searchService).search(eq("shoe"), eq("corp"), eq("en"), any());
    }

    @Test
    void search_usesDefaultPageSize_whenLimitIsNull() {
        when(searchService.search(any(), any(), any(), argThat(p -> p.getPageSize() == 20)))
                .thenReturn(new SearchIndexService.SearchResult(0, List.of()));

        resolver.search("q", null, null, null);

        verify(searchService).search(any(), any(), any(), argThat(p -> p.getPageSize() == 20));
    }

    // -------------------------------------------------------------------------
    // navigation
    // -------------------------------------------------------------------------

    @Test
    void navigation_returnsNavItems() {
        List<Map<String, Object>> navItems = List.of(
                Map.of("title", "Home", "url", "/"),
                Map.of("title", "About", "url", "/about"));
        when(deliveryService.buildNavigation("corp", "en", 3)).thenReturn(navItems);

        List<Map<String, Object>> result = resolver.navigation("corp", "en", null);

        assertThat(result).hasSize(2);
        assertThat(result.get(0)).containsEntry("title", "Home");
    }

    @Test
    void navigation_usesProvidedDepth() {
        when(deliveryService.buildNavigation("corp", "en", 2)).thenReturn(List.of());

        resolver.navigation("corp", "en", 2);

        verify(deliveryService).buildNavigation("corp", "en", 2);
    }

    // -------------------------------------------------------------------------
    // asset
    // -------------------------------------------------------------------------

    @Test
    void asset_returnsFoundAsset() {
        UUID id = UUID.randomUUID();
        Asset asset = new Asset();
        when(assetRepository.findById(id)).thenReturn(Optional.of(asset));

        Asset result = resolver.asset(id.toString());

        assertThat(result).isSameAs(asset);
    }

    @Test
    void asset_returnsNull_whenNotFound() {
        UUID id = UUID.randomUUID();
        when(assetRepository.findById(id)).thenReturn(Optional.empty());

        assertThat(resolver.asset(id.toString())).isNull();
    }

    @Test
    void asset_returnsNull_forInvalidUuid() {
        assertThat(resolver.asset("not-a-uuid")).isNull();
    }

    // -------------------------------------------------------------------------
    // components
    // -------------------------------------------------------------------------

    @Test
    void components_returnsAllDefinitions() {
        ComponentDefinition def = new ComponentDefinition();
        def.setResourceType("flexcms/text");
        when(componentRegistry.getAllDefinitions()).thenReturn(List.of(def));

        List<ComponentDefinition> result = resolver.components();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getResourceType()).isEqualTo("flexcms/text");
    }

    @Test
    void components_returnsEmptyList_whenNoneRegistered() {
        when(componentRegistry.getAllDefinitions()).thenReturn(List.of());

        assertThat(resolver.components()).isEmpty();
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private ContentNode node(String path, String name, String resourceType) {
        ContentNode n = new ContentNode();
        n.setPath(path);
        n.setName(name);
        n.setResourceType(resourceType);
        n.setStatus(NodeStatus.PUBLISHED);
        return n;
    }
}
