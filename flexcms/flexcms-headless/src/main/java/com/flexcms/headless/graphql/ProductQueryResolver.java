package com.flexcms.headless.graphql;

import com.flexcms.pim.model.Catalog;
import com.flexcms.pim.model.Product;
import com.flexcms.pim.repository.CatalogRepository;
import com.flexcms.pim.service.ProductSearchService;
import com.flexcms.pim.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.*;
import java.util.stream.Collectors;

/**
 * GraphQL resolvers for PIM product and catalog queries.
 *
 * <p>Extends the FlexCMS headless GraphQL schema with read-only product data
 * so that frontend components can query products alongside content nodes in a
 * single GraphQL request.</p>
 */
@Controller
public class ProductQueryResolver {

    @Autowired
    private ProductService productService;

    @Autowired
    private CatalogRepository catalogRepository;

    @Autowired
    private ProductSearchService productSearchService;

    // -------------------------------------------------------------------------
    // product(sku): Product
    // -------------------------------------------------------------------------

    @QueryMapping
    public Map<String, Object> product(@Argument String sku) {
        return productService.getResolvedProduct(sku)
                .map(this::toProductMap)
                .orElse(null);
    }

    // -------------------------------------------------------------------------
    // products(catalogId, status, limit, offset): ProductConnection
    // -------------------------------------------------------------------------

    @QueryMapping
    public Map<String, Object> products(
            @Argument String catalogId,
            @Argument String status,
            @Argument Integer limit,
            @Argument Integer offset) {

        int pageSize = limit != null ? Math.min(limit, 200) : 20;
        int pageNum = offset != null ? offset / pageSize : 0;

        UUID catId = UUID.fromString(catalogId);
        Page<Product> page = productService.listByCatalog(catId, PageRequest.of(pageNum, pageSize));

        List<Map<String, Object>> items = page.getContent().stream()
                .filter(p -> status == null || status.equalsIgnoreCase(p.getStatus().name()))
                .map(this::productToMap)
                .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalCount", (int) page.getTotalElements());
        result.put("items", items);
        result.put("hasNextPage", page.hasNext());
        return result;
    }

    // -------------------------------------------------------------------------
    // catalogs: [Catalog]
    // -------------------------------------------------------------------------

    @QueryMapping
    public List<Map<String, Object>> catalogs() {
        return catalogRepository.findAll().stream()
                .map(this::catalogToMap)
                .collect(Collectors.toList());
    }

    // -------------------------------------------------------------------------
    // searchProducts(query, catalogId, status, limit): ProductSearchResult
    // -------------------------------------------------------------------------

    @QueryMapping
    public Map<String, Object> searchProducts(
            @Argument String query,
            @Argument String catalogId,
            @Argument String status,
            @Argument Integer limit) {

        int pageSize = limit != null ? Math.min(limit, 200) : 20;

        ProductSearchService.ProductSearchResult result =
                productSearchService.search(query, catalogId, status, PageRequest.of(0, pageSize));

        List<Map<String, Object>> hits = result.items().stream()
                .map(h -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("sku", h.sku());
                    m.put("name", h.name());
                    m.put("catalogId", h.catalogId());
                    m.put("status", h.status());
                    m.put("score", h.score());
                    return m;
                })
                .collect(Collectors.toList());

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("totalCount", (int) result.totalCount());
        out.put("items", hits);
        return out;
    }

    // -------------------------------------------------------------------------
    // Mapping helpers
    // -------------------------------------------------------------------------

    /**
     * Maps a resolved-attributes product map (from {@link ProductService#getResolvedProduct})
     * into the GraphQL Product type shape.
     */
    private Map<String, Object> toProductMap(Map<String, Object> resolved) {
        // The resolved map already has the right structure — just return it as-is.
        // GraphQL field names match the map keys (id, sku, name, status, catalogId, attributes, …).
        return resolved;
    }

    private Map<String, Object> productToMap(Product p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId().toString());
        m.put("sku", p.getSku());
        m.put("name", p.getName());
        m.put("status", p.getStatus().name());
        m.put("catalogId", p.getCatalog() != null ? p.getCatalog().getId().toString() : null);
        m.put("attributes", p.getResolvedAttributes());
        m.put("version", p.getVersion());
        m.put("createdAt", p.getCreatedAt() != null ? p.getCreatedAt().toString() : null);
        m.put("updatedAt", p.getUpdatedAt() != null ? p.getUpdatedAt().toString() : null);
        m.put("updatedBy", p.getUpdatedBy());
        return m;
    }

    private Map<String, Object> catalogToMap(Catalog c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId().toString());
        m.put("name", c.getName());
        m.put("year", c.getYear());
        m.put("season", c.getSeason());
        m.put("description", c.getDescription());
        m.put("status", c.getStatus().name());
        return m;
    }
}
