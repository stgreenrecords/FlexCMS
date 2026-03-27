package com.flexcms.headless.graphql;

import com.flexcms.core.model.Asset;
import com.flexcms.core.model.ComponentDefinition;
import com.flexcms.core.model.ContentNode;
import com.flexcms.core.repository.AssetRepository;
import com.flexcms.core.service.ComponentRegistry;
import com.flexcms.core.service.ContentDeliveryService;
import com.flexcms.core.service.ContentNodeService;
import com.flexcms.pim.model.Catalog;
import com.flexcms.pim.model.Product;
import com.flexcms.pim.model.ProductStatus;
import com.flexcms.pim.service.CatalogService;
import com.flexcms.pim.service.ProductSearchService;
import com.flexcms.pim.service.ProductService;
import com.flexcms.plugin.model.RenderContext;
import com.flexcms.search.service.SearchIndexService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.UUID;

/**
 * GraphQL query resolvers for the FlexCMS headless API.
 *
 * <p>Resolvers correspond 1-to-1 with the queries defined in {@code schema.graphqls}.
 * Each method is annotated with {@link QueryMapping} which maps it to the GraphQL
 * query by method name.</p>
 */
@Controller
public class ContentQueryResolver {

    @Autowired
    private ContentNodeService nodeService;

    @Autowired
    private ContentDeliveryService deliveryService;

    @Autowired
    private ComponentRegistry componentRegistry;

    @Autowired
    private SearchIndexService searchService;

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private ProductService productService;

    @Autowired
    private CatalogService catalogService;

    @Autowired
    private ProductSearchService productSearchService;

    // -------------------------------------------------------------------------
    // page(path, site, locale): Page
    // -------------------------------------------------------------------------

    /**
     * Returns a single page with its full component tree.
     *
     * <p>Returns {@code null} if the page does not exist (GraphQL null propagation).</p>
     */
    @QueryMapping
    public Map<String, Object> page(@Argument String path,
                                    @Argument String site,
                                    @Argument String locale) {
        String contentPath = toContentPath(path);
        RenderContext ctx = new RenderContext(
                site,
                locale != null ? Locale.forLanguageTag(locale) : Locale.ENGLISH,
                path, "publish");

        try {
            // renderPage returns {page: {path, title, ...}, components: [...]}
            // The GraphQL Page type expects the fields flattened at the top level.
            Map<String, Object> raw = deliveryService.renderPage(contentPath, ctx);
            return flattenPageResponse(raw);
        } catch (IllegalArgumentException e) {
            return null; // Page not found — GraphQL returns null field
        }
    }

    // -------------------------------------------------------------------------
    // pages(site, locale, template, limit, offset): PageConnection
    // -------------------------------------------------------------------------

    /**
     * Returns a paginated list of pages for a site.
     * Supports optional filtering by locale and template.
     */
    @QueryMapping
    public Map<String, Object> pages(@Argument String site,
                                     @Argument String locale,
                                     @Argument String template,
                                     @Argument Integer limit,
                                     @Argument Integer offset) {
        int pageSize = limit != null ? limit : 20;
        int pageOffset = offset != null ? offset : 0;
        return deliveryService.listPages(site, locale, template, pageSize, pageOffset);
    }

    // -------------------------------------------------------------------------
    // node(path): ContentNode
    // -------------------------------------------------------------------------

    /**
     * Returns a single content node (any type, not just pages).
     * Accepts either dot-separated paths (mysite.language-masters.en) or
     * slash-separated paths (/mysite/language-masters/en) — both resolve
     * to the same node. Does NOT add a "content." prefix, unlike the
     * page() resolver, so XF paths work as-is.
     */
    @QueryMapping
    public Map<String, Object> node(@Argument String path) {
        String contentPath = path.startsWith("/") ? path.substring(1).replace("/", ".") : path;
        return nodeService.getByPath(contentPath)
                .map(this::nodeToMap)
                .orElse(null);
    }

    // -------------------------------------------------------------------------
    // search(query, site, locale, limit): SearchResult
    // -------------------------------------------------------------------------

    /**
     * Full-text search. Delegates to Elasticsearch via SearchIndexService.
     * Returns a SearchResult with totalCount and items (SearchHit list).
     */
    @QueryMapping
    public SearchIndexService.SearchResult search(@Argument String query,
                                                   @Argument String site,
                                                   @Argument String locale,
                                                   @Argument Integer limit) {
        int pageSize = limit != null ? limit : 20;
        return searchService.search(query, site, locale, PageRequest.of(0, pageSize));
    }

    // -------------------------------------------------------------------------
    // navigation(site, locale, depth): [NavigationItem!]!
    // -------------------------------------------------------------------------

    /**
     * Returns the navigation tree for a site up to the specified depth.
     */
    @QueryMapping
    public List<Map<String, Object>> navigation(@Argument String site,
                                                 @Argument String locale,
                                                 @Argument Integer depth) {
        return deliveryService.buildNavigation(site, locale, depth != null ? depth : 3);
    }

    // -------------------------------------------------------------------------
    // asset(id: ID!): Asset
    // -------------------------------------------------------------------------

    /**
     * Returns a DAM asset by its UUID.
     */
    @QueryMapping
    public Asset asset(@Argument String id) {
        try {
            return assetRepository.findById(UUID.fromString(id)).orElse(null);
        } catch (IllegalArgumentException e) {
            return null; // Invalid UUID format
        }
    }

    // -------------------------------------------------------------------------
    // components: [ComponentDefinition!]!
    // -------------------------------------------------------------------------

    /**
     * Returns all registered component definitions from the component registry.
     */
    @QueryMapping
    public List<ComponentDefinition> components() {
        return componentRegistry.getAllDefinitions();
    }

    // -------------------------------------------------------------------------
    // product(sku: String!): Product
    // -------------------------------------------------------------------------

    /**
     * Returns a single PIM product by SKU with all resolved attributes
     * (carryforward inheritance applied). Returns {@code null} if not found.
     */
    @QueryMapping
    public Map<String, Object> product(@Argument String sku) {
        return productService.getResolvedProduct(sku).orElse(null);
    }

    // -------------------------------------------------------------------------
    // products(catalogId, status, limit, offset): ProductConnection!
    // -------------------------------------------------------------------------

    /**
     * Returns a paginated list of products for a catalog with optional status filter.
     */
    @QueryMapping
    @Transactional(value = "pimTransactionManager", readOnly = true)
    public Map<String, Object> products(@Argument String catalogId,
                                        @Argument String status,
                                        @Argument Integer limit,
                                        @Argument Integer offset) {
        int pageSize = limit != null ? limit : 20;
        int pageNum  = (offset != null && pageSize > 0) ? offset / pageSize : 0;

        ProductStatus ps = status != null ? ProductStatus.valueOf(status.toUpperCase()) : null;
        Page<Product> page = productService.listByCatalog(UUID.fromString(catalogId), ps,
                PageRequest.of(pageNum, pageSize));

        List<Map<String, Object>> items = page.getContent().stream()
                .map(this::productToMap)
                .toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalCount", (int) page.getTotalElements());
        result.put("items", items);
        result.put("hasNextPage", page.hasNext());
        return result;
    }

    // -------------------------------------------------------------------------
    // catalogs: [Catalog!]!
    // -------------------------------------------------------------------------

    /**
     * Returns all PIM catalogs.
     */
    @QueryMapping
    public List<Map<String, Object>> catalogs() {
        return catalogService.listAll().stream()
                .map(this::catalogToMap)
                .toList();
    }

    // -------------------------------------------------------------------------
    // searchProducts(query, catalogId, status, limit): ProductSearchResult!
    // -------------------------------------------------------------------------

    /**
     * Full-text product search via Elasticsearch.
     */
    @QueryMapping
    public Map<String, Object> searchProducts(@Argument String query,
                                              @Argument String catalogId,
                                              @Argument String status,
                                              @Argument Integer limit) {
        int pageSize = limit != null ? limit : 20;
        ProductSearchService.ProductSearchResult result =
                productSearchService.search(query, catalogId, status, PageRequest.of(0, pageSize));

        List<Map<String, Object>> items = result.items().stream()
                .map(hit -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("sku",       hit.sku());
                    m.put("name",      hit.name());
                    m.put("catalogId", hit.catalogId());
                    m.put("status",    hit.status());
                    m.put("score",     hit.score());
                    return m;
                })
                .toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalCount", result.totalCount());
        response.put("items", items);
        return response;
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Converts a URL-style path (/site/en/about) to content tree path (content.site.en.about).
     */
    private String toContentPath(String path) {
        String p = path.startsWith("/") ? path.substring(1) : path;
        p = p.replace("/", ".");
        return p.startsWith("content.") ? p : "content." + p;
    }

    /**
     * Flatten the response from {@link ContentDeliveryService#renderPage} into
     * the structure expected by the GraphQL {@code Page} type.
     *
     * <p>{@code renderPage} returns {@code {page: {path, title, ...}, components: [...]}}.
     * The GraphQL type expects {@code {path, title, description, template, locale,
     * lastModified, components}} at the top level.</p>
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> flattenPageResponse(Map<String, Object> raw) {
        Map<String, Object> pageMeta = (Map<String, Object>) raw.getOrDefault("page", Map.of());
        List<?> components = (List<?>) raw.getOrDefault("components", List.of());
        Map<String, Object> result = new LinkedHashMap<>(pageMeta);
        result.put("components", components);
        return result;
    }

    /**
     * Map a ContentNode to the GraphQL {@code ContentNode} type fields.
     */
    private Map<String, Object> nodeToMap(ContentNode node) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("path", node.getPath());
        map.put("name", node.getName());
        map.put("resourceType", node.getResourceType());
        map.put("properties", node.getProperties());
        map.put("status", node.getStatus() != null ? node.getStatus().name() : null);
        map.put("version", node.getVersion());
        map.put("locale", node.getLocale());
        map.put("siteId", node.getSiteId());
        return map;
    }

    /**
     * Map a PIM {@link Product} entity to the GraphQL {@code Product} type fields.
     * Must be called within an active PIM transaction to allow lazy-loaded catalog access.
     */
    private Map<String, Object> productToMap(Product product) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",        product.getId().toString());
        m.put("sku",       product.getSku());
        m.put("name",      product.getName());
        m.put("status",    product.getStatus().name());
        m.put("catalogId", product.getCatalog().getId().toString());
        m.put("attributes", product.getAttributes());
        m.put("version",   product.getVersion());
        m.put("createdAt", product.getCreatedAt() != null ? product.getCreatedAt().toString() : null);
        m.put("updatedAt", product.getUpdatedAt() != null ? product.getUpdatedAt().toString() : null);
        m.put("updatedBy", product.getUpdatedBy());
        return m;
    }

    /**
     * Map a PIM {@link Catalog} entity to the GraphQL {@code Catalog} type fields.
     */
    private Map<String, Object> catalogToMap(Catalog catalog) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",          catalog.getId().toString());
        m.put("name",        catalog.getName());
        m.put("year",        catalog.getYear());
        m.put("season",      catalog.getSeason());
        m.put("description", catalog.getDescription());
        m.put("status",      catalog.getStatus().name());
        return m;
    }
}
