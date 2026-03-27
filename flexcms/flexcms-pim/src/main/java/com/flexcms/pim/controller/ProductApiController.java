package com.flexcms.pim.controller;

import com.flexcms.pim.model.CarryforwardDeltaReport;
import com.flexcms.pim.model.Product;
import com.flexcms.pim.model.ProductAssetRef;
import com.flexcms.pim.model.ProductStatus;
import com.flexcms.pim.model.ProductVariant;
import com.flexcms.pim.model.ProductVersion;
import com.flexcms.pim.service.ProductAssetRefService;
import com.flexcms.pim.service.ProductService;
import com.flexcms.pim.service.VariantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * PIM Product REST API — independent of CMS content APIs.
 *
 * <p>This API serves product data to:
 * <ul>
 *   <li>CMS ComponentModels (backend enrichment at render time)</li>
 *   <li>Admin UI (product editor, catalog browser)</li>
 *   <li>External systems (ERP, e-commerce, POS)</li>
 *   <li>Frontend SDK (direct product queries)</li>
 * </ul></p>
 */
@Tag(name = "PIM Products", description = "Product CRUD, status management, carryforward, variants, asset links, and version history")
@RestController
@RequestMapping("/api/pim/v1/products")
public class ProductApiController {

    @Autowired
    private ProductService productService;

    @Autowired
    private VariantService variantService;

    @Autowired
    private ProductAssetRefService assetRefService;

    // -------------------------------------------------------------------------
    // Product CRUD
    // -------------------------------------------------------------------------

    @Operation(summary = "Get product by SKU", description = "Returns a product with fully resolved attributes (carryforward inheritance applied).")
    @GetMapping("/{sku}")
    public ResponseEntity<Map<String, Object>> getProduct(@PathVariable String sku) {
        return productService.getResolvedProduct(sku)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "List or search products", description = "Returns paginated products filtered by catalog or full-text search query.")
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

    @Operation(summary = "Create product", description = "Creates a new product in the specified catalog.")
    @PostMapping
    public ResponseEntity<Product> createProduct(@Valid @RequestBody CreateProductRequest request) {
        Product product = productService.create(
                request.sku(), request.name(), request.catalogId(),
                request.attributes(), request.userId()
        );
        return ResponseEntity.ok(product);
    }

    @Operation(summary = "Update product", description = "Updates a product's attributes by SKU.")
    @PutMapping("/{sku}")
    public ResponseEntity<Product> updateProduct(
            @PathVariable String sku,
            @Valid @RequestBody UpdateProductRequest request) {
        Product updated = productService.update(sku, request.attributes(), request.userId());
        return ResponseEntity.ok(updated);
    }

    @Operation(summary = "Delete product", description = "Deletes a product and all its variants and asset references.")
    @DeleteMapping("/{sku}")
    public ResponseEntity<Void> deleteProduct(@PathVariable String sku) {
        productService.delete(sku);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Update product status", description = "Transitions a product to a new status (DRAFT, PUBLISHED, ARCHIVED).")
    @PutMapping("/{sku}/status")
    public ResponseEntity<Product> updateStatus(
            @PathVariable String sku,
            @Valid @RequestBody UpdateStatusRequest request) {
        Product updated = productService.updateStatus(sku, request.status(), request.userId());
        return ResponseEntity.ok(updated);
    }

    @Operation(summary = "Carryforward products", description = "Copies products from a source catalog to a target catalog for year rollover.")
    @PostMapping("/carryforward")
    public ResponseEntity<Map<String, Object>> carryforward(@Valid @RequestBody CarryforwardRequest request) {
        int count = productService.carryforward(
                request.sourceCatalogId(), request.targetCatalogId(), request.userId()
        );
        return ResponseEntity.ok(Map.of("carriedForward", count));
    }

    /**
     * Permanently merge all inherited attributes into this product's own attribute map
     * and break the carryforward inheritance chain. Use when the product is fully reviewed
     * for the new year and should stand on its own.
     */
    @Operation(summary = "Merge inherited attributes", description = "Merges carryforward-inherited attributes into the product's own map, breaking the inheritance chain.")
    @PostMapping("/{sku}/merge-inherited")
    public ResponseEntity<Product> mergeInherited(
            @PathVariable String sku,
            @NotBlank(message = "userId is required") @RequestParam String userId) {
        return productService.getBysku(sku)
                .map(p -> ResponseEntity.ok(productService.mergeInheritedAttributes(sku, userId)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get a delta report comparing a source catalog (previous year) to a target catalog.
     * Shows which products were modified, which are brand-new, and which source products
     * were not carried forward.
     */
    @Operation(summary = "Get carryforward delta", description = "Returns a delta report comparing products between source and target catalogs.")
    @GetMapping("/carryforward/delta")
    public ResponseEntity<CarryforwardDeltaReport> getCarryforwardDelta(
            @RequestParam UUID sourceCatalogId,
            @RequestParam UUID targetCatalogId) {
        return ResponseEntity.ok(
                productService.getCarryforwardDelta(sourceCatalogId, targetCatalogId));
    }

    // -------------------------------------------------------------------------
    // Variants
    // -------------------------------------------------------------------------

    @Operation(summary = "List variants", description = "Returns all variants for a product.")
    @GetMapping("/{sku}/variants")
    public ResponseEntity<List<ProductVariant>> listVariants(@PathVariable String sku) {
        return productService.getBysku(sku)
                .map(p -> ResponseEntity.ok(variantService.listByProduct(p.getId())))
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Create variant", description = "Creates a new variant for a product.")
    @PostMapping("/{sku}/variants")
    public ResponseEntity<ProductVariant> createVariant(
            @PathVariable String sku,
            @Valid @RequestBody CreateVariantRequest request) {
        return productService.getBysku(sku)
                .map(p -> ResponseEntity.ok(variantService.create(
                        p.getId(), request.variantSku(),
                        request.attributes(), request.pricing(), request.inventory())))
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Update variant", description = "Updates a product variant's attributes, pricing, and inventory.")
    @PutMapping("/variants/{variantId}")
    public ResponseEntity<ProductVariant> updateVariant(
            @PathVariable UUID variantId,
            @RequestBody UpdateVariantRequest request) {
        ProductVariant updated = variantService.update(variantId,
                request.attributes(), request.pricing(), request.inventory());
        return ResponseEntity.ok(updated);
    }

    @Operation(summary = "Delete variant", description = "Deletes a product variant by ID.")
    @DeleteMapping("/variants/{variantId}")
    public ResponseEntity<Void> deleteVariant(@PathVariable UUID variantId) {
        variantService.delete(variantId);
        return ResponseEntity.noContent().build();
    }

    // -------------------------------------------------------------------------
    // Asset references
    // -------------------------------------------------------------------------

    @Operation(summary = "List product assets", description = "Returns all DAM asset references linked to a product.")
    @GetMapping("/{sku}/assets")
    public ResponseEntity<List<ProductAssetRef>> listAssets(@PathVariable String sku) {
        return productService.getBysku(sku)
                .map(p -> ResponseEntity.ok(assetRefService.listByProduct(p.getId())))
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Link asset to product", description = "Links a DAM asset to a product with a role and display order.")
    @PostMapping("/{sku}/assets")
    public ResponseEntity<ProductAssetRef> linkAsset(
            @PathVariable String sku,
            @Valid @RequestBody LinkAssetRequest request) {
        return productService.getBysku(sku)
                .map(p -> ResponseEntity.ok(assetRefService.link(
                        p.getId(), request.assetPath(), request.role(), request.orderIndex())))
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Update asset reference", description = "Updates the role and display order of a product-asset link.")
    @PutMapping("/assets/{refId}")
    public ResponseEntity<ProductAssetRef> updateAssetRef(
            @PathVariable UUID refId,
            @RequestBody UpdateAssetRefRequest request) {
        ProductAssetRef updated = assetRefService.updateRef(refId, request.role(), request.orderIndex());
        return ResponseEntity.ok(updated);
    }

    @Operation(summary = "Unlink asset", description = "Removes a DAM asset link from a product.")
    @DeleteMapping("/assets/{refId}")
    public ResponseEntity<Void> unlinkAsset(@PathVariable UUID refId) {
        assetRefService.unlink(refId);
        return ResponseEntity.noContent().build();
    }

    // -------------------------------------------------------------------------
    // Request records
    // -------------------------------------------------------------------------

    public record CreateProductRequest(
            @NotBlank(message = "sku is required") String sku,
            @NotBlank(message = "name is required") String name,
            @NotNull(message = "catalogId is required") UUID catalogId,
            Map<String, Object> attributes,
            @NotBlank(message = "userId is required") String userId) {}

    public record UpdateProductRequest(
            @NotNull(message = "attributes is required") Map<String, Object> attributes,
            @NotBlank(message = "userId is required") String userId) {}

    public record UpdateStatusRequest(
            @NotNull(message = "status is required") ProductStatus status,
            @NotBlank(message = "userId is required") String userId) {}

    public record CarryforwardRequest(
            @NotNull(message = "sourceCatalogId is required") UUID sourceCatalogId,
            @NotNull(message = "targetCatalogId is required") UUID targetCatalogId,
            @NotBlank(message = "userId is required") String userId) {}

    public record CreateVariantRequest(
            @NotBlank(message = "variantSku is required") String variantSku,
            Map<String, Object> attributes,
            Map<String, Object> pricing,
            Map<String, Object> inventory) {}

    public record UpdateVariantRequest(
            Map<String, Object> attributes,
            Map<String, Object> pricing,
            Map<String, Object> inventory) {}

    public record LinkAssetRequest(
            @NotBlank(message = "assetPath is required") String assetPath,
            @NotBlank(message = "role is required") String role,
            int orderIndex) {}

    public record UpdateAssetRefRequest(
            String role,
            int orderIndex) {}

    // -------------------------------------------------------------------------
    // Version history
    // -------------------------------------------------------------------------

    @Operation(summary = "Get version history", description = "Returns the full version history for a product ordered newest-first.")
    @GetMapping("/{id}/versions")
    public ResponseEntity<List<ProductVersion>> getVersionHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(productService.getVersionHistory(id));
    }

    @Operation(summary = "Restore product version", description = "Restores a product to a specific historical version.")
    @PostMapping("/{id}/versions/{versionNumber}/restore")
    public ResponseEntity<Product> restoreVersion(
            @PathVariable UUID id,
            @PathVariable Long versionNumber,
            @NotBlank(message = "userId is required") @RequestParam String userId) {
        return ResponseEntity.ok(productService.restoreVersion(id, versionNumber, userId));
    }
}
