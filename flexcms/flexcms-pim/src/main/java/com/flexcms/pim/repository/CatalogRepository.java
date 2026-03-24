package com.flexcms.pim.repository;

import com.flexcms.pim.model.Catalog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CatalogRepository extends JpaRepository<Catalog, UUID> {
    List<Catalog> findByYear(int year);
    List<Catalog> findByYearAndStatus(int year, Catalog.CatalogStatus status);
    List<Catalog> findBySchemaId(UUID schemaId);
}

