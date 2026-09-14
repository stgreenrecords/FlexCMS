package com.flexcms.pim.service;

import com.flexcms.pim.exception.PimConflictException;
import com.flexcms.pim.exception.PimNotFoundException;
import com.flexcms.pim.model.Catalog;
import com.flexcms.pim.model.ProductSchema;
import com.flexcms.pim.repository.CatalogRepository;
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
 * Manages catalogs and their status lifecycle: DRAFT → ACTIVE → ARCHIVED.
 *
 * <p>Only one catalog per year may be ACTIVE at a time. Archiving an ACTIVE catalog
 * requires explicit activation of another catalog or an explicit archive transition.</p>
 */
@Service
public class CatalogService {

    @Autowired
    private CatalogRepository catalogRepo;

    @Autowired
    private ProductSchemaRepository schemaRepo;

    @Transactional(value = "pimTransactionManager", readOnly = true)
    public Optional<Catalog> getById(UUID id) {
        return catalogRepo.findById(id);
    }

    @Transactional(value = "pimTransactionManager", readOnly = true)
    public List<Catalog> listByYear(int year) {
        return catalogRepo.findByYear(year);
    }

    @Transactional(value = "pimTransactionManager", readOnly = true)
    public Page<Catalog> listByYear(int year, Pageable pageable) {
        return catalogRepo.findByYearPaginated(year, pageable);
    }

    @Transactional(value = "pimTransactionManager", readOnly = true)
    public List<Catalog> listAll() {
        return catalogRepo.findAll();
    }

    @Transactional(value = "pimTransactionManager", readOnly = true)
    public Page<Catalog> listAll(Pageable pageable) {
        return catalogRepo.findAllPaginated(pageable);
    }

    @Transactional("pimTransactionManager")
    public Catalog create(String name, int year, String season, String description,
                          UUID schemaId, Map<String, Object> settings, String userId) {
        ProductSchema schema = schemaRepo.findById(schemaId)
                .orElseThrow(() -> new PimNotFoundException("Schema not found: " + schemaId));

        Catalog catalog = new Catalog();
        catalog.setName(name);
        catalog.setYear(year);
        catalog.setSeason(season);
        catalog.setDescription(description);
        catalog.setSchema(schema);
        catalog.setSettings(settings);
        catalog.setCreatedBy(userId);
        return catalogRepo.save(catalog);
    }

    @Transactional("pimTransactionManager")
    public Catalog update(UUID id, String name, String description, Map<String, Object> settings) {
        Catalog catalog = catalogRepo.findById(id)
                .orElseThrow(() -> new PimNotFoundException("Catalog not found: " + id));
        if (name != null) catalog.setName(name);
        if (description != null) catalog.setDescription(description);
        if (settings != null) catalog.setSettings(settings);
        return catalogRepo.save(catalog);
    }

    /**
     * Activate a catalog (DRAFT → ACTIVE).
     * Only DRAFT catalogs can be activated, and only one catalog per year may be
     * ACTIVE at a time — archive the currently active one first.
     */
    @Transactional("pimTransactionManager")
    public Catalog activate(UUID id) {
        Catalog catalog = catalogRepo.findById(id)
                .orElseThrow(() -> new PimNotFoundException("Catalog not found: " + id));
        if (catalog.getStatus() != Catalog.CatalogStatus.DRAFT) {
            throw new PimConflictException("Only DRAFT catalogs can be activated; current status: " + catalog.getStatus());
        }
        boolean anotherActiveForYear = catalogRepo.findByYearAndStatus(catalog.getYear(), Catalog.CatalogStatus.ACTIVE)
                .stream()
                .anyMatch(c -> !c.getId().equals(id));
        if (anotherActiveForYear) {
            throw new PimConflictException("Another catalog is already ACTIVE for year " + catalog.getYear()
                    + "; archive it before activating this one");
        }
        catalog.setStatus(Catalog.CatalogStatus.ACTIVE);
        return catalogRepo.save(catalog);
    }

    /**
     * Archive a catalog (ACTIVE → ARCHIVED).
     * Only ACTIVE catalogs can be archived.
     */
    @Transactional("pimTransactionManager")
    public Catalog archive(UUID id) {
        Catalog catalog = catalogRepo.findById(id)
                .orElseThrow(() -> new PimNotFoundException("Catalog not found: " + id));
        if (catalog.getStatus() != Catalog.CatalogStatus.ACTIVE) {
            throw new PimConflictException("Only ACTIVE catalogs can be archived; current status: " + catalog.getStatus());
        }
        catalog.setStatus(Catalog.CatalogStatus.ARCHIVED);
        return catalogRepo.save(catalog);
    }

    @Transactional("pimTransactionManager")
    public void delete(UUID id) {
        Catalog catalog = catalogRepo.findById(id)
                .orElseThrow(() -> new PimNotFoundException("Catalog not found: " + id));
        if (catalog.getStatus() == Catalog.CatalogStatus.ACTIVE) {
            throw new PimConflictException("Cannot delete an ACTIVE catalog; archive it first");
        }
        catalogRepo.deleteById(id);
    }
}
