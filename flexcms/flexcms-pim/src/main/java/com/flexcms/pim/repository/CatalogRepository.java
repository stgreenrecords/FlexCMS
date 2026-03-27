package com.flexcms.pim.repository;

import com.flexcms.pim.model.Catalog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CatalogRepository extends JpaRepository<Catalog, UUID> {

    @Query("SELECT c FROM Catalog c JOIN FETCH c.schema")
    List<Catalog> findAll();

    @Query(value = "SELECT c FROM Catalog c JOIN FETCH c.schema",
           countQuery = "SELECT COUNT(c) FROM Catalog c")
    Page<Catalog> findAllPaginated(Pageable pageable);

    @Query("SELECT c FROM Catalog c JOIN FETCH c.schema WHERE c.id = :id")
    Optional<Catalog> findById(UUID id);

    @Query("SELECT c FROM Catalog c JOIN FETCH c.schema WHERE c.year = :year")
    List<Catalog> findByYear(int year);

    @Query(value = "SELECT c FROM Catalog c JOIN FETCH c.schema WHERE c.year = :year",
           countQuery = "SELECT COUNT(c) FROM Catalog c WHERE c.year = :year")
    Page<Catalog> findByYearPaginated(int year, Pageable pageable);

    List<Catalog> findByYearAndStatus(int year, Catalog.CatalogStatus status);
    List<Catalog> findBySchemaId(UUID schemaId);
}
