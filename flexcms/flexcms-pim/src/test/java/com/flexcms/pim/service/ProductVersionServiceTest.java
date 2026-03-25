package com.flexcms.pim.service;

import com.flexcms.pim.model.*;
import com.flexcms.pim.repository.CatalogRepository;
import com.flexcms.pim.repository.ProductRepository;
import com.flexcms.pim.repository.ProductSchemaRepository;
import com.flexcms.pim.repository.ProductVersionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductVersionServiceTest {

    @Mock private ProductRepository productRepo;
    @Mock private CatalogRepository catalogRepo;
    @Mock private ProductSchemaRepository schemaRepo;
    @Mock private ProductVersionRepository productVersionRepo;
    @Mock private SchemaValidationService schemaValidationService;

    @InjectMocks
    private ProductService productService;

    // ── Fixtures ───────────────────────────────────────────────────────────────

    private Product product(UUID id) {
        ProductSchema schema = new ProductSchema();
        schema.setId(UUID.randomUUID());
        Catalog catalog = new Catalog();
        catalog.setId(UUID.randomUUID());
        catalog.setSchema(schema);

        Product p = new Product();
        p.setId(id);
        p.setSku("SKU-001");
        p.setName("Test Product");
        p.setCatalog(catalog);
        p.setSchema(schema);
        p.setStatus(ProductStatus.DRAFT);
        p.setAttributes(new HashMap<>(Map.of("color", "red")));
        p.setVersion(3L);
        return p;
    }

    private ProductVersion versionSnapshot(UUID productId, long num) {
        ProductVersion v = new ProductVersion();
        v.setId(UUID.randomUUID());
        v.setProductId(productId);
        v.setVersionNumber(num);
        v.setSku("SKU-001");
        v.setName("Test Product v" + num);
        v.setAttributes(Map.of("color", "blue-v" + num));
        v.setStatus(ProductStatus.DRAFT);
        return v;
    }

    // ── Snapshot on create ─────────────────────────────────────────────────────

    @Test
    void create_savesVersionSnapshot() {
        UUID catalogId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        ProductSchema schema = new ProductSchema();
        schema.setId(UUID.randomUUID());
        Catalog catalog = new Catalog();
        catalog.setId(catalogId);
        catalog.setSchema(schema);

        Product saved = new Product();
        saved.setId(productId);
        saved.setSku("SKU-NEW");
        saved.setName("New Product");
        saved.setCatalog(catalog);
        saved.setSchema(schema);
        saved.setAttributes(Map.of("size", "M"));
        saved.setStatus(ProductStatus.DRAFT);
        saved.setVersion(1L);

        when(catalogRepo.findById(catalogId)).thenReturn(Optional.of(catalog));
        when(productRepo.save(any())).thenReturn(saved);

        productService.create("SKU-NEW", "New Product", catalogId, Map.of("size", "M"), "alice");

        verify(productVersionRepo).save(any(ProductVersion.class));
    }

    // ── Snapshot on update ─────────────────────────────────────────────────────

    @Test
    void update_savesVersionSnapshot() {
        UUID id = UUID.randomUUID();
        Product p = product(id);
        when(productRepo.findBySku("SKU-001")).thenReturn(Optional.of(p));
        when(productRepo.save(any())).thenReturn(p);

        productService.update("SKU-001", Map.of("color", "green"), "bob");

        verify(productVersionRepo).save(any(ProductVersion.class));
    }

    // ── getVersionHistory ──────────────────────────────────────────────────────

    @Test
    void getVersionHistory_returnsVersionsNewestFirst() {
        UUID id = UUID.randomUUID();
        List<ProductVersion> versions = List.of(versionSnapshot(id, 3), versionSnapshot(id, 2), versionSnapshot(id, 1));
        when(productVersionRepo.findByProductIdOrderByVersionNumberDesc(id)).thenReturn(versions);

        List<ProductVersion> result = productService.getVersionHistory(id);

        assertThat(result).hasSize(3);
        assertThat(result.get(0).getVersionNumber()).isEqualTo(3L);
        assertThat(result.get(2).getVersionNumber()).isEqualTo(1L);
    }

    // ── restoreVersion ─────────────────────────────────────────────────────────

    @Test
    void restoreVersion_appliesSnapshotAttributesAndName() {
        UUID id = UUID.randomUUID();
        Product p = product(id);
        ProductVersion snapshot = versionSnapshot(id, 2L);

        when(productRepo.findById(id)).thenReturn(Optional.of(p));
        when(productVersionRepo.findByProductIdAndVersionNumber(id, 2L)).thenReturn(Optional.of(snapshot));
        when(productRepo.save(any())).thenReturn(p);

        productService.restoreVersion(id, 2L, "admin");

        assertThat(p.getAttributes()).isEqualTo(snapshot.getAttributes());
        assertThat(p.getName()).isEqualTo(snapshot.getName());
        assertThat(p.getUpdatedBy()).isEqualTo("admin");
    }

    @Test
    void restoreVersion_savesNewSnapshotWithChangeSummary() {
        UUID id = UUID.randomUUID();
        Product p = product(id);
        ProductVersion snapshot = versionSnapshot(id, 1L);

        when(productRepo.findById(id)).thenReturn(Optional.of(p));
        when(productVersionRepo.findByProductIdAndVersionNumber(id, 1L)).thenReturn(Optional.of(snapshot));
        when(productRepo.save(any())).thenReturn(p);

        productService.restoreVersion(id, 1L, "admin");

        ArgumentCaptor<ProductVersion> captor = ArgumentCaptor.forClass(ProductVersion.class);
        verify(productVersionRepo, times(1)).save(captor.capture());
        assertThat(captor.getValue().getChangeSummary()).contains("Restored from version 1");
    }

    @Test
    void restoreVersion_productNotFound_throws() {
        UUID id = UUID.randomUUID();
        when(productRepo.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.restoreVersion(id, 1L, "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Product not found");
        verify(productVersionRepo, never()).save(any());
    }

    @Test
    void restoreVersion_versionNotFound_throws() {
        UUID id = UUID.randomUUID();
        Product p = product(id);
        when(productRepo.findById(id)).thenReturn(Optional.of(p));
        when(productVersionRepo.findByProductIdAndVersionNumber(id, 99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.restoreVersion(id, 99L, "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Version 99 not found");
        verify(productVersionRepo, never()).save(any());
    }
}
