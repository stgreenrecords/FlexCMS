package com.flexcms.pim.service;

import com.flexcms.pim.model.Product;
import com.flexcms.pim.model.ProductAssetRef;
import com.flexcms.pim.repository.ProductAssetRefRepository;
import com.flexcms.pim.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Links and unlinks DAM assets to PIM products.
 *
 * <p>References are stored by asset path (string), not foreign key, so the PIM
 * database remains fully decoupled from the DAM/CMS database schema.</p>
 */
@Service
public class ProductAssetRefService {

    @Autowired
    private ProductAssetRefRepository assetRefRepo;

    @Autowired
    private ProductRepository productRepo;

    @Transactional(value = "pimTransactionManager", readOnly = true)
    public List<ProductAssetRef> listByProduct(UUID productId) {
        return assetRefRepo.findByProductIdOrderByOrderIndex(productId);
    }

    /**
     * Link a DAM asset to a product.
     *
     * @param productId  the product UUID
     * @param assetPath  DAM asset path (e.g. "/dam/products/shoe-x1/hero.jpg")
     * @param role       semantic role: hero, gallery, thumbnail, swatch, document, etc.
     * @param orderIndex display order within the role group
     */
    @Transactional("pimTransactionManager")
    public ProductAssetRef link(UUID productId, String assetPath, String role, int orderIndex) {
        Product product = productRepo.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));

        // Prevent duplicates for the same (product, path, role) combination
        if (assetRefRepo.findByProductIdAndAssetPathAndRole(productId, assetPath, role).isPresent()) {
            throw new IllegalArgumentException(
                    "Asset already linked to this product with role '" + role + "': " + assetPath);
        }

        ProductAssetRef ref = new ProductAssetRef();
        ref.setProduct(product);
        ref.setAssetPath(assetPath);
        ref.setRole(role);
        ref.setOrderIndex(orderIndex);
        return assetRefRepo.save(ref);
    }

    /**
     * Unlink a DAM asset from a product by ref ID.
     */
    @Transactional("pimTransactionManager")
    public void unlink(UUID refId) {
        if (!assetRefRepo.existsById(refId)) {
            throw new IllegalArgumentException("Asset ref not found: " + refId);
        }
        assetRefRepo.deleteById(refId);
    }

    /**
     * Update the order index and role of an existing asset reference.
     */
    @Transactional("pimTransactionManager")
    public ProductAssetRef updateRef(UUID refId, String role, int orderIndex) {
        ProductAssetRef ref = assetRefRepo.findById(refId)
                .orElseThrow(() -> new IllegalArgumentException("Asset ref not found: " + refId));
        if (role != null) ref.setRole(role);
        ref.setOrderIndex(orderIndex);
        return assetRefRepo.save(ref);
    }
}
