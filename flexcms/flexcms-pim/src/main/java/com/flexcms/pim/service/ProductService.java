package com.flexcms.pim.service;

import com.flexcms.pim.event.ProductPublishedMessage;
import com.flexcms.pim.model.*;
import com.flexcms.pim.repository.CatalogRepository;
import com.flexcms.pim.repository.ProductRepository;
import com.flexcms.pim.repository.ProductSchemaRepository;
import com.flexcms.pim.repository.ProductVersionRepository;

import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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

    /** Routing key for product publish events on the replication exchange. */
    public static final String PRODUCT_PUBLISHED_ROUTING_KEY = "product.published";

    @Autowired private ProductRepository productRepo;
    @Autowired private CatalogRepository catalogRepo;
    @Autowired private ProductSchemaRepository schemaRepo;
    @Autowired private ProductVersionRepository productVersionRepo;
    @Autowired private SchemaValidationService schemaValidationService;
    @Autowired private ProductSearchService productSearchService;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Value("${flexcms.replication.exchange:flexcms.replication}")
    private String replicationExchange = "flexcms.replication"; // default; overridden by @Value in Spring context

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
        productSearchService.index(product);
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
        productSearchService.index(product);
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

        Page<Product> allSource = productRepo.findByCatalogId(sourceCatalogId, Pageable.unpaged());

        int count = 0;
        for (Product source : allSource) {
            String targetSku = source.getSku() + "-" + targetCatalog.getYear();
            if (productRepo.existsBySku(targetSku)) continue;

            Product carried = new Product();
            carried.setSku(targetSku);
            carried.setName(source.getName());
            carried.setCatalog(targetCatalog);
            carried.setSchema(targetCatalog.getSchema());
            carried.setAttributes(new HashMap<>());  // empty — inherits from source at read time
            carried.setSourceProduct(source);
            carried.setOverriddenFields(new String[0]);
            carried.setCreatedBy(userId);
            productRepo.save(carried);
            count++;
        }

        log.info("Carried forward {} products from catalog {} to {}", count, sourceCatalogId, targetCatalogId);
        return count;
    }

    /**
     * Permanently merge inherited attributes from the source product into this product's
     * own {@code attributes} map, then break the inheritance chain by clearing
     * {@code sourceProduct} and {@code overriddenFields}.
     *
     * <p>Use this when a carryforward product has been fully reviewed and should stand
     * on its own — typically at end-of-season or when the source catalog is archived.</p>
     *
     * @return the updated product with all inherited values baked in
     */
    @Transactional("pimTransactionManager")
    public Product mergeInheritedAttributes(String sku, String userId) {
        Product product = productRepo.findBySku(sku)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + sku));

        if (product.getSourceProduct() == null) {
            // Already standalone — nothing to merge
            return product;
        }

        // Resolved attributes already does the deep merge (recursive through source chain)
        Map<String, Object> merged = new HashMap<>(product.getResolvedAttributes());
        product.setAttributes(merged);
        product.setSourceProduct(null);
        product.setOverriddenFields(new String[0]);
        product.setUpdatedBy(userId);
        product = productRepo.save(product);

        ProductVersion snapshot = ProductVersion.fromProduct(product);
        snapshot.setChangeSummary("Merged inherited attributes — inheritance chain broken");
        productVersionRepo.save(snapshot);
        productSearchService.index(product);

        log.info("Merged inherited attributes for product {} ({})", product.getId(), sku);
        return product;
    }

    /**
     * Build a delta report comparing a source catalog to a target catalog.
     *
     * <p>Returns three groups:
     * <ol>
     *   <li><b>modifiedProducts</b> — carried-forward products that have at least one
     *       explicitly overridden field in the target.</li>
     *   <li><b>newProductSkus</b> — products in the target with no source link
     *       (created fresh in the new year).</li>
     *   <li><b>notCarriedForwardSkus</b> — source products that have no corresponding
     *       carried product in the target.</li>
     * </ol></p>
     */
    @Transactional(value = "pimTransactionManager", readOnly = true)
    public CarryforwardDeltaReport getCarryforwardDelta(UUID sourceCatalogId, UUID targetCatalogId) {
        List<Product> sourceProducts = productRepo.findByCatalogId(sourceCatalogId, Pageable.unpaged())
                .getContent();
        List<Product> targetProducts = productRepo.findByCatalogId(targetCatalogId, Pageable.unpaged())
                .getContent();

        // Target products that have a source link (carryforward)
        List<Product> carried = targetProducts.stream()
                .filter(p -> p.getSourceProduct() != null)
                .toList();

        // Target products with NO source link (brand new)
        List<String> newSkus = targetProducts.stream()
                .filter(p -> p.getSourceProduct() == null)
                .map(Product::getSku)
                .toList();

        // Which source SKUs have a carried product in target?
        Set<UUID> carriedSourceIds = carried.stream()
                .map(p -> p.getSourceProduct().getId())
                .collect(Collectors.toSet());

        // Source products not carried forward
        List<String> notCarried = sourceProducts.stream()
                .filter(p -> !carriedSourceIds.contains(p.getId()))
                .map(Product::getSku)
                .toList();

        // Modified: carried products that have ≥1 overridden field
        List<CarryforwardDeltaReport.ProductDelta> modified = carried.stream()
                .filter(p -> p.getOverriddenFields() != null && p.getOverriddenFields().length > 0)
                .map(p -> new CarryforwardDeltaReport.ProductDelta(
                        p.getSku(),
                        p.getSourceProduct().getSku(),
                        Arrays.asList(p.getOverriddenFields())))
                .toList();

        return new CarryforwardDeltaReport(
                modified, newSkus, notCarried,
                sourceProducts.size(), targetProducts.size(), carried.size());
    }

    @Transactional("pimTransactionManager")
    public void delete(String sku) {
        Product product = productRepo.findBySku(sku)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + sku));
        productRepo.delete(product);
        productSearchService.remove(sku);
    }

    @Transactional("pimTransactionManager")
    public Product updateStatus(String sku, ProductStatus status, String userId) {
        Product product = productRepo.findBySku(sku)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + sku));
        product.setStatus(status);
        product.setUpdatedBy(userId);
        product = productRepo.save(product);
        productVersionRepo.save(ProductVersion.fromProduct(product));

        // When a product is published, notify the CMS layer so pages that reference
        // this product can be re-activated and rebuilt via the build-worker pipeline.
        if (status == ProductStatus.PUBLISHED) {
            UUID catalogId = product.getCatalog() != null ? product.getCatalog().getId() : null;
            ProductPublishedMessage msg = new ProductPublishedMessage(sku, catalogId, userId);
            rabbitTemplate.convertAndSend(replicationExchange, PRODUCT_PUBLISHED_ROUTING_KEY, msg);
            log.info("Published product '{}' — sent page-rebuild notification", sku);
        }

        productSearchService.index(product);
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
        productSearchService.index(product);

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

