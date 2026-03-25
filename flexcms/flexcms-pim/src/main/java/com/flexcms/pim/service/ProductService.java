package com.flexcms.pim.service;

import com.flexcms.pim.model.*;
import com.flexcms.pim.repository.CatalogRepository;
import com.flexcms.pim.repository.ProductRepository;
import com.flexcms.pim.repository.ProductSchemaRepository;
import com.flexcms.pim.repository.ProductVersionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Core PIM service — manages products, catalogs, and year-over-year carryforward.
 */
@Service
public class ProductService {

    private static final Logger log = LoggerFactory.getLogger(ProductService.class);

    @Autowired private ProductRepository productRepo;
    @Autowired private CatalogRepository catalogRepo;
    @Autowired private ProductSchemaRepository schemaRepo;
    @Autowired private ProductVersionRepository productVersionRepo;
    @Autowired private SchemaValidationService schemaValidationService;

    // -------------------------------------------------------------------------
    // Product CRUD
    // -------------------------------------------------------------------------

    @Transactional(value = "pimTransactionManager", readOnly = true)
    public Optional<Product> getBysku(String sku) {
        return productRepo.findBySku(sku);
    }

    /**
     * Get a product with fully resolved attributes (merged with source).
     * This is the primary read method for API consumers and CMS integration.
     */
    @Transactional(value = "pimTransactionManager", readOnly = true)
    public Optional<Map<String, Object>> getResolvedProduct(String sku) {
        return productRepo.findBySku(sku).map(this::toResolvedMap);
    }

    @Transactional(value = "pimTransactionManager", readOnly = true)
    public Page<Product> listByCatalog(UUID catalogId, Pageable pageable) {
        return productRepo.findByCatalogId(catalogId, pageable);
    }

    @Transactional(value = "pimTransactionManager", readOnly = true)
    public Page<Product> search(String query, Pageable pageable) {
        return productRepo.searchGlobal(query, pageable);
    }

    @Transactional("pimTransactionManager")
    public Product create(String sku, String name, UUID catalogId, Map<String, Object> attributes, String userId) {
        Catalog catalog = catalogRepo.findById(catalogId)
                .orElseThrow(() -> new IllegalArgumentException("Catalog not found: " + catalogId));

        Product product = new Product();
        product.setSku(sku);
        product.setName(name);
        product.setCatalog(catalog);
        product.setSchema(catalog.getSchema());
        product.setCreatedBy(userId);

        // Validate attributes against the catalog's schema before saving
        schemaValidationService.validateOrThrow(catalog.getSchema(), attributes);
        product.setAttributes(attributes);

        product = productRepo.save(product);
        productVersionRepo.save(ProductVersion.fromProduct(product));
        return product;
    }

    /**
     * Update a product — automatically tracks which fields were overridden
     * (important for carryforward products).
     */
    @Transactional("pimTransactionManager")
    public Product update(String sku, Map<String, Object> newAttributes, String userId) {
        Product product = productRepo.findBySku(sku)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + sku));

        // Validate against schema before merging
        Map<String, Object> merged = new HashMap<>(product.getAttributes());
        merged.putAll(newAttributes);
        schemaValidationService.validateOrThrow(product.getSchema(), merged);

        // Track overridden fields (fields that differ from source)
        if (product.getSourceProduct() != null) {
            Set<String> overridden = new LinkedHashSet<>();
            if (product.getOverriddenFields() != null) {
                overridden.addAll(Arrays.asList(product.getOverriddenFields()));
            }
            overridden.addAll(newAttributes.keySet());
            product.setOverriddenFields(overridden.toArray(new String[0]));
        }

        product.getAttributes().putAll(newAttributes);
        product.setUpdatedBy(userId);
        product = productRepo.save(product);
        productVersionRepo.save(ProductVersion.fromProduct(product));
        return product;
    }

    // -------------------------------------------------------------------------
    // Year-over-Year Carryforward
    // -------------------------------------------------------------------------

    /**
     * Clone all products from a source catalog to a target catalog.
     * Products in the target will have {@code sourceProduct} pointing to the source,
     * with no overridden fields — they inherit everything. Only editing a field
     * in the new year marks it as overridden.
     *
     * <p>This enables "minimal effort" year rollover: create the 2027 catalog,
     * carryforward from 2026, and only edit what changed.</p>
     */
    @Transactional("pimTransactionManager")
    public int carryforward(UUID sourceCatalogId, UUID targetCatalogId, String userId) {
        Catalog targetCatalog = catalogRepo.findById(targetCatalogId)
                .orElseThrow(() -> new IllegalArgumentException("Target catalog not found"));

        List<Product> sourceProducts = productRepo.findByCatalogIdAndSourceProductIsNull(sourceCatalogId);
        // Also get carryforward products from the source
        Page<Product> allSource = productRepo.findByCatalogId(sourceCatalogId, Pageable.unpaged());

        int count = 0;
        for (Product source : allSource) {
            // Skip if SKU already exists in target
            String newSku = source.getSku(); // Same SKU across years
            if (productRepo.existsBySku(newSku + "-" + targetCatalog.getYear())) continue;

            Product carried = new Product();
            carried.setSku(newSku + "-" + targetCatalog.getYear());
            carried.setName(source.getName());
            carried.setCatalog(targetCatalog);
            carried.setSchema(targetCatalog.getSchema());
            carried.setAttributes(new HashMap<>()); // Empty — inherits from source
            carried.setSourceProduct(source);
            carried.setOverriddenFields(new String[0]);
            carried.setCreatedBy(userId);
            productRepo.save(carried);
            count++;
        }

        log.info("Carried forward {} products from catalog {} to {}", count, sourceCatalogId, targetCatalogId);
        return count;
    }

    @Transactional("pimTransactionManager")
    public void delete(String sku) {
        Product product = productRepo.findBySku(sku)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + sku));
        productRepo.delete(product);
    }

    @Transactional("pimTransactionManager")
    public Product updateStatus(String sku, ProductStatus status, String userId) {
        Product product = productRepo.findBySku(sku)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + sku));
        product.setStatus(status);
        product.setUpdatedBy(userId);
        product = productRepo.save(product);
        productVersionRepo.save(ProductVersion.fromProduct(product));
        return product;
    }

    // -------------------------------------------------------------------------
    // Version history
    // -------------------------------------------------------------------------

    /**
     * Return all saved versions for a product, newest first.
     */
    @Transactional(value = "pimTransactionManager", readOnly = true)
    public List<ProductVersion> getVersionHistory(UUID productId) {
        return productVersionRepo.findByProductIdOrderByVersionNumberDesc(productId);
    }

    /**
     * Restore a product to a specific historical version.
     * Creates a new version snapshot after restoring.
     */
    @Transactional("pimTransactionManager")
    public Product restoreVersion(UUID productId, Long versionNumber, String userId) {
        Product product = productRepo.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));
        ProductVersion snapshot = productVersionRepo.findByProductIdAndVersionNumber(productId, versionNumber)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Version " + versionNumber + " not found for product " + productId));

        product.setAttributes(new HashMap<>(snapshot.getAttributes()));
        product.setName(snapshot.getName());
        product.setUpdatedBy(userId);
        product = productRepo.save(product);

        ProductVersion restoredSnapshot = ProductVersion.fromProduct(product);
        restoredSnapshot.setChangeSummary("Restored from version " + versionNumber);
        productVersionRepo.save(restoredSnapshot);

        log.info("Restored product {} to version {} (new version: {})", productId, versionNumber, product.getVersion());
        return product;
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private Map<String, Object> toResolvedMap(Product product) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", product.getId().toString());
        result.put("sku", product.getSku());
        result.put("name", product.getName());
        result.put("status", product.getStatus().name());
        result.put("attributes", product.getResolvedAttributes());
        result.put("overriddenFields", product.getOverriddenFields());
        result.put("version", product.getVersion());
        result.put("catalogId", product.getCatalog().getId().toString());
        result.put("schemaId", product.getSchema().getId().toString());

        // Variants
        List<Map<String, Object>> variants = product.getVariants().stream().map(v -> {
            Map<String, Object> vm = new LinkedHashMap<>();
            vm.put("variantSku", v.getVariantSku());
            vm.put("attributes", v.getAttributes());
            vm.put("pricing", v.getPricing());
            vm.put("inventory", v.getInventory());
            return vm;
        }).toList();
        result.put("variants", variants);

        // Asset references
        List<Map<String, Object>> assets = product.getAssetRefs().stream().map(a -> {
            Map<String, Object> am = new LinkedHashMap<>();
            am.put("assetPath", a.getAssetPath());
            am.put("role", a.getRole());
            return am;
        }).toList();
        result.put("assets", assets);

        return result;
    }
}

