package com.flexcms.pim.repository;

import com.flexcms.pim.model.ProductSchema;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductSchemaRepository extends JpaRepository<ProductSchema, UUID> {
    Optional<ProductSchema> findByNameAndVersion(String name, String version);
    List<ProductSchema> findByName(String name);
    Page<ProductSchema> findByName(String name, Pageable pageable);
    List<ProductSchema> findByActiveTrue();
    Page<ProductSchema> findByActiveTrue(Pageable pageable);
}

