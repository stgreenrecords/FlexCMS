package com.flexcms.pim.service;

import com.flexcms.pim.model.ProductSchema;
import com.flexcms.pim.repository.ProductSchemaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Manages product schemas — the type system for PIM attributes.
 *
 * <p>Schemas are versioned: each year a new version can inherit from the prior,
 * allowing incremental attribute additions without breaking existing products.</p>
 */
@Service
public class SchemaService {

    @Autowired
    private ProductSchemaRepository schemaRepo;

    @Transactional(value = "pimTransactionManager", readOnly = true)
    public Optional<ProductSchema> getById(UUID id) {
        return schemaRepo.findById(id);
    }

    @Transactional(value = "pimTransactionManager", readOnly = true)
    public Optional<ProductSchema> getByNameAndVersion(String name, String version) {
        return schemaRepo.findByNameAndVersion(name, version);
    }

    @Transactional(value = "pimTransactionManager", readOnly = true)
    public List<ProductSchema> listByName(String name) {
        return schemaRepo.findByName(name);
    }

    @Transactional(value = "pimTransactionManager", readOnly = true)
    public Page<ProductSchema> listByName(String name, Pageable pageable) {
        return schemaRepo.findByName(name, pageable);
    }

    @Transactional(value = "pimTransactionManager", readOnly = true)
    public List<ProductSchema> listActive() {
        return schemaRepo.findByActiveTrue();
    }

    @Transactional(value = "pimTransactionManager", readOnly = true)
    public Page<ProductSchema> listActive(Pageable pageable) {
        return schemaRepo.findByActiveTrue(pageable);
    }

    /**
     * Create a new schema. If {@code parentId} is provided, the new schema inherits
     * from that parent (year-over-year versioning).
     */
    @Transactional("pimTransactionManager")
    public ProductSchema create(String name, String version, String description,
                                Map<String, Object> schemaDef, Map<String, Object> attributeGroups,
                                UUID parentId, String userId) {
        if (schemaRepo.findByNameAndVersion(name, version).isPresent()) {
            throw new IllegalArgumentException("Schema already exists: " + name + " v" + version);
        }

        ProductSchema schema = new ProductSchema();
        schema.setName(name);
        schema.setVersion(version);
        schema.setDescription(description);
        schema.setSchemaDef(schemaDef);
        schema.setAttributeGroups(attributeGroups);
        schema.setCreatedBy(userId);

        if (parentId != null) {
            ProductSchema parent = schemaRepo.findById(parentId)
                    .orElseThrow(() -> new IllegalArgumentException("Parent schema not found: " + parentId));
            schema.setParent(parent);
        }

        return schemaRepo.save(schema);
    }

    /**
     * Create a new version of an existing schema — convenience wrapper for year rollover.
     */
    @Transactional("pimTransactionManager")
    public ProductSchema createNewVersion(UUID sourceSchemaId, String newVersion,
                                          Map<String, Object> schemaDef, String userId) {
        ProductSchema source = schemaRepo.findById(sourceSchemaId)
                .orElseThrow(() -> new IllegalArgumentException("Source schema not found: " + sourceSchemaId));

        return create(source.getName(), newVersion, source.getDescription(),
                schemaDef, source.getAttributeGroups(), sourceSchemaId, userId);
    }

    @Transactional("pimTransactionManager")
    public ProductSchema update(UUID id, String description, Map<String, Object> schemaDef,
                                Map<String, Object> attributeGroups) {
        ProductSchema schema = schemaRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Schema not found: " + id));
        if (description != null) schema.setDescription(description);
        if (schemaDef != null) schema.setSchemaDef(schemaDef);
        if (attributeGroups != null) schema.setAttributeGroups(attributeGroups);
        return schemaRepo.save(schema);
    }

    @Transactional("pimTransactionManager")
    public void deactivate(UUID id) {
        ProductSchema schema = schemaRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Schema not found: " + id));
        schema.setActive(false);
        schemaRepo.save(schema);
    }

    @Transactional("pimTransactionManager")
    public void delete(UUID id) {
        if (!schemaRepo.existsById(id)) {
            throw new IllegalArgumentException("Schema not found: " + id);
        }
        schemaRepo.deleteById(id);
    }
}
