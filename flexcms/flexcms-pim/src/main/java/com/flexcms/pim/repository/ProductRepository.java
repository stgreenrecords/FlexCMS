package com.flexcms.pim.repository;

import com.flexcms.pim.model.Product;
import com.flexcms.pim.model.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {

    Optional<Product> findBySku(String sku);

    @Query(value = "SELECT p FROM Product p JOIN FETCH p.catalog JOIN FETCH p.schema WHERE p.catalog.id = :catalogId",
           countQuery = "SELECT COUNT(p) FROM Product p WHERE p.catalog.id = :catalogId")
    Page<Product> findByCatalogId(UUID catalogId, Pageable pageable);

    Page<Product> findByCatalogIdAndStatus(UUID catalogId, ProductStatus status, Pageable pageable);

    List<Product> findByCatalogIdAndSourceProductIsNull(UUID catalogId);

    @Query("SELECT p FROM Product p WHERE p.catalog.id = :catalogId AND LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Product> searchInCatalog(UUID catalogId, String query, Pageable pageable);

    @Query(value = "SELECT p FROM Product p JOIN FETCH p.catalog JOIN FETCH p.schema WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :query, '%'))",
           countQuery = "SELECT COUNT(p) FROM Product p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Product> searchGlobal(String query, Pageable pageable);

    boolean existsBySku(String sku);

    /** Find all products in a catalog that were carried forward from a source (have a sourceProduct). */
    List<Product> findBySourceProductCatalogId(UUID sourceCatalogId);

    /** Find all products in the target catalog that link back to any source product. */
    @Query("SELECT p FROM Product p WHERE p.catalog.id = :catalogId AND p.sourceProduct IS NOT NULL")
    List<Product> findCarryforwardProductsInCatalog(UUID catalogId);
}

