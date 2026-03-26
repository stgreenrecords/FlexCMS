package com.flexcms.pim.service;

import com.flexcms.pim.model.Product;
import com.flexcms.pim.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * Rebuilds the Elasticsearch product index from the PIM database.
 *
 * <p>Useful for initial population after deployment, recovery after cluster reset,
 * or correcting index drift. All operations are idempotent.</p>
 */
@Service
public class ProductIndexRebuildService {

    private static final Logger log = LoggerFactory.getLogger(ProductIndexRebuildService.class);
    private static final int BATCH_SIZE = 500;

    @Autowired
    private ProductSearchService productSearchService;

    @Autowired
    private ProductRepository productRepository;

    /**
     * Rebuild the product index for a specific catalog.
     *
     * @param catalogId the catalog to reindex
     * @return number of documents indexed
     */
    public int rebuildCatalog(UUID catalogId) {
        log.info("Starting product index rebuild for catalog: {}", catalogId);

        List<Product> products = productRepository.findByCatalogId(catalogId, Pageable.unpaged()).getContent();
        int total = products.size();

        for (int i = 0; i < total; i += BATCH_SIZE) {
            List<Product> batch = products.subList(i, Math.min(i + BATCH_SIZE, total));
            productSearchService.indexAll(batch);
            log.info("Product index rebuild progress for catalog {}: {}/{}", catalogId,
                    Math.min(i + BATCH_SIZE, total), total);
        }

        log.info("Product index rebuild complete for catalog {}: {} documents indexed", catalogId, total);
        return total;
    }

    /**
     * Purge the catalog's product documents from the index and rebuild.
     *
     * @param catalogId the catalog to purge and reindex
     * @return number of documents indexed after purge
     */
    public int purgeAndRebuildCatalog(UUID catalogId) {
        log.info("Purging and rebuilding product index for catalog: {}", catalogId);
        productSearchService.removeByCatalog(catalogId.toString());
        return rebuildCatalog(catalogId);
    }

    /**
     * Rebuild the product index for all products across all catalogs.
     *
     * @return total number of documents indexed
     */
    public int rebuildAll() {
        log.info("Starting full product index rebuild");

        List<Product> products = productRepository.findAll();
        int total = products.size();

        for (int i = 0; i < total; i += BATCH_SIZE) {
            List<Product> batch = products.subList(i, Math.min(i + BATCH_SIZE, total));
            productSearchService.indexAll(batch);
            log.info("Full product index rebuild progress: {}/{}", Math.min(i + BATCH_SIZE, total), total);
        }

        log.info("Full product index rebuild complete: {} documents indexed", total);
        return total;
    }
}
