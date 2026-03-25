package com.flexcms.pim.service;

import com.flexcms.pim.model.Product;
import com.flexcms.pim.model.ProductVariant;
import com.flexcms.pim.repository.ProductRepository;
import com.flexcms.pim.repository.ProductVariantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Manages product variants (size/color/configuration combinations of a base product).
 *
 * <p>Each variant has its own SKU, attributes, pricing, and inventory JSONB blobs.
 * Variants are owned by a product and cascade-deleted when the product is deleted.</p>
 */
@Service
public class VariantService {

    @Autowired
    private ProductVariantRepository variantRepo;

    @Autowired
    private ProductRepository productRepo;

    @Transactional(value = "pimTransactionManager", readOnly = true)
    public List<ProductVariant> listByProduct(UUID productId) {
        return variantRepo.findByProductId(productId);
    }

    @Transactional(value = "pimTransactionManager", readOnly = true)
    public Optional<ProductVariant> getByVariantSku(String variantSku) {
        return variantRepo.findByVariantSku(variantSku);
    }

    @Transactional("pimTransactionManager")
    public ProductVariant create(UUID productId, String variantSku,
                                 Map<String, Object> attributes,
                                 Map<String, Object> pricing,
                                 Map<String, Object> inventory) {
        Product product = productRepo.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));

        if (variantRepo.existsByVariantSku(variantSku)) {
            throw new IllegalArgumentException("Variant SKU already exists: " + variantSku);
        }

        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);
        variant.setVariantSku(variantSku);
        variant.setAttributes(attributes != null ? attributes : Map.of());
        variant.setPricing(pricing != null ? pricing : Map.of());
        variant.setInventory(inventory != null ? inventory : Map.of());
        return variantRepo.save(variant);
    }

    @Transactional("pimTransactionManager")
    public ProductVariant update(UUID variantId, Map<String, Object> attributes,
                                 Map<String, Object> pricing, Map<String, Object> inventory) {
        ProductVariant variant = variantRepo.findById(variantId)
                .orElseThrow(() -> new IllegalArgumentException("Variant not found: " + variantId));
        if (attributes != null) variant.setAttributes(attributes);
        if (pricing != null) variant.setPricing(pricing);
        if (inventory != null) variant.setInventory(inventory);
        return variantRepo.save(variant);
    }

    @Transactional("pimTransactionManager")
    public void delete(UUID variantId) {
        if (!variantRepo.existsById(variantId)) {
            throw new IllegalArgumentException("Variant not found: " + variantId);
        }
        variantRepo.deleteById(variantId);
    }
}
