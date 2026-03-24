package com.flexcms.pim.controller;

import com.flexcms.core.exception.NotFoundException;
import com.flexcms.pim.model.Product;
import com.flexcms.pim.service.ProductService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * PIM Product REST API — independent of CMS content APIs.
 *
 * <p>This API serves product data to:
 * <ul>
 *   <li>CMS Sling Models (backend enrichment at render time)</li>
 *   <li>Admin UI (product editor, catalog browser)</li>
 *   <li>External systems (ERP, e-commerce, POS)</li>
 *   <li>Frontend SDK (direct product queries)</li>
 * </ul></p>
 */
@RestController
@RequestMapping("/api/pim/v1/products")
public class ProductApiController {

    @Autowired
    private ProductService productService;

    /** Get a product by SKU with fully resolved attributes */
    @GetMapping("/{sku}")
    public ResponseEntity<Map<String, Object>> getProduct(@PathVariable String sku) {
        return ResponseEntity.ok(
                productService.getResolvedProduct(sku)
                        .orElseThrow(() -> NotFoundException.forId("Product", sku))
        );
    }

    /** List products in a catalog (paginated) */
    @GetMapping
    public ResponseEntity<Page<Product>> listProducts(
            @RequestParam(required = false) UUID catalogId,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Product> result;
        if (q != null && !q.isBlank()) {
            result = productService.search(q, PageRequest.of(page, size));
        } else if (catalogId != null) {
            result = productService.listByCatalog(catalogId, PageRequest.of(page, size));
        } else {
            result = productService.search("", PageRequest.of(page, size));
        }
        return ResponseEntity.ok(result);
    }

    /** Create a product */
    @PostMapping
    public ResponseEntity<Product> createProduct(@Valid @RequestBody CreateProductRequest request) {
        Product product = productService.create(
                request.sku(), request.name(), request.catalogId(),
                request.attributes(), request.userId()
        );
        return ResponseEntity.ok(product);
    }

    /** Update product attributes */
    @PutMapping("/{sku}")
    public ResponseEntity<Product> updateProduct(
            @PathVariable String sku,
            @Valid @RequestBody UpdateProductRequest request) {
        Product updated = productService.update(sku, request.attributes(), request.userId());
        return ResponseEntity.ok(updated);
    }

    /** Carryforward products from one catalog to another (year rollover) */
    @PostMapping("/carryforward")
    public ResponseEntity<Map<String, Object>> carryforward(@Valid @RequestBody CarryforwardRequest request) {
        int count = productService.carryforward(
                request.sourceCatalogId(), request.targetCatalogId(), request.userId()
        );
        return ResponseEntity.ok(Map.of("carriedForward", count));
    }

    // Request records with validation constraints
    public record CreateProductRequest(
            @NotBlank(message = "sku is required") String sku,
            @NotBlank(message = "name is required") String name,
            @NotNull(message = "catalogId is required") UUID catalogId,
            Map<String, Object> attributes,
            @NotBlank(message = "userId is required") String userId) {}

    public record UpdateProductRequest(
            @NotNull(message = "attributes is required") Map<String, Object> attributes,
            @NotBlank(message = "userId is required") String userId) {}

    public record CarryforwardRequest(
            @NotNull(message = "sourceCatalogId is required") UUID sourceCatalogId,
            @NotNull(message = "targetCatalogId is required") UUID targetCatalogId,
            @NotBlank(message = "userId is required") String userId) {}
}
