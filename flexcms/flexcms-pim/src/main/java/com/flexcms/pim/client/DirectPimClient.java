package com.flexcms.pim.client;

import com.flexcms.plugin.pim.PimClient;
import com.flexcms.plugin.pim.PimProductData;
import com.flexcms.pim.model.Product;
import com.flexcms.pim.model.ProductStatus;
import com.flexcms.pim.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * In-process PimClient implementation for use when CMS and PIM run in the same JVM.
 *
 * <p>Accesses the PIM database directly through {@link ProductRepository},
 * bypassing HTTP overhead. All reads use the PIM transaction manager and are
 * read-only (no writes from this client).</p>
 *
 * <p>This bean is auto-discovered by Spring as it lives in the {@code com.flexcms.pim}
 * package, which is included in the main app's component scan. ComponentModels can
 * {@code @Autowired PimClient pimClient} without any additional configuration.</p>
 */
@Service
public class DirectPimClient implements PimClient {

    private static final Logger log = LoggerFactory.getLogger(DirectPimClient.class);

    @Autowired
    private ProductRepository productRepository;

    @Override
    @Transactional(value = "pimTransactionManager", readOnly = true)
    public Optional<PimProductData> getProduct(String sku) {
        return productRepository.findBySku(sku)
                .map(this::toProductData);
    }

    @Override
    @Transactional(value = "pimTransactionManager", readOnly = true)
    public List<PimProductData> getBulk(Collection<String> skus) {
        if (skus == null || skus.isEmpty()) {
            return List.of();
        }
        return skus.stream()
                .map(sku -> productRepository.findBySku(sku))
                .filter(Optional::isPresent)
                .map(opt -> toProductData(opt.get()))
                .toList();
    }

    @Override
    @Transactional(value = "pimTransactionManager", readOnly = true)
    public List<PimProductData> listByCatalog(String catalogId, int page, int size) {
        int clampedSize = Math.min(size, 100);
        UUID id;
        try {
            id = UUID.fromString(catalogId);
        } catch (IllegalArgumentException e) {
            log.warn("PimClient.listByCatalog: invalid catalogId '{}'", catalogId);
            return List.of();
        }
        return productRepository.findByCatalogIdAndStatus(id, ProductStatus.PUBLISHED,
                        PageRequest.of(page, clampedSize))
                .stream()
                .map(this::toProductData)
                .toList();
    }

    @Override
    @Transactional(value = "pimTransactionManager", readOnly = true)
    public boolean exists(String sku) {
        return productRepository.existsBySku(sku);
    }

    // -------------------------------------------------------------------------
    // Mapping
    // -------------------------------------------------------------------------

    private PimProductData toProductData(Product product) {
        List<Map<String, Object>> variants = product.getVariants().stream().map(v -> {
            Map<String, Object> vm = new java.util.LinkedHashMap<>();
            vm.put("variantSku", v.getVariantSku());
            vm.put("attributes", v.getAttributes());
            vm.put("pricing", v.getPricing());
            vm.put("inventory", v.getInventory());
            return (Map<String, Object>) vm;
        }).toList();

        List<Map<String, Object>> assets = product.getAssetRefs().stream().map(a -> {
            Map<String, Object> am = new java.util.LinkedHashMap<>();
            am.put("assetPath", a.getAssetPath());
            am.put("role", a.getRole());
            am.put("orderIndex", a.getOrderIndex());
            return (Map<String, Object>) am;
        }).toList();

        List<String> overriddenFields = product.getOverriddenFields() != null
                ? Arrays.asList(product.getOverriddenFields())
                : List.of();

        return new PimProductData(
                product.getId().toString(),
                product.getSku(),
                product.getName(),
                product.getStatus().name(),
                product.getResolvedAttributes(),   // fully merged (carryforward-aware)
                overriddenFields,
                variants,
                assets,
                product.getCatalog().getId().toString(),
                product.getSchema().getId().toString()
        );
    }
}
