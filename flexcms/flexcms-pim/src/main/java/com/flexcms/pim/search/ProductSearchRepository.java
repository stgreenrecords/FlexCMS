package com.flexcms.pim.search;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductSearchRepository extends ElasticsearchRepository<ProductDocument, String> {

    Page<ProductDocument> findByCatalogId(String catalogId, Pageable pageable);

    Page<ProductDocument> findByStatus(String status, Pageable pageable);

    Page<ProductDocument> findByCatalogIdAndStatus(String catalogId, String status, Pageable pageable);

    void deleteBySku(String sku);

    void deleteByCatalogId(String catalogId);
}
