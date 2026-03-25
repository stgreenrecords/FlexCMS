package com.flexcms.pim.service;

import com.flexcms.pim.model.Catalog;
import com.flexcms.pim.model.Product;
import com.flexcms.pim.model.ProductSchema;
import com.flexcms.pim.model.ProductStatus;
import com.flexcms.pim.repository.CatalogRepository;
import com.flexcms.pim.repository.ProductRepository;
import com.flexcms.pim.repository.ProductSchemaRepository;
import com.flexcms.pim.repository.ProductVersionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepo;

    @Mock
    private CatalogRepository catalogRepo;

    @Mock
    private ProductSchemaRepository schemaRepo;

    @Mock
    private ProductVersionRepository productVersionRepo;

    @Mock
    private SchemaValidationService schemaValidationService;

    @InjectMocks
    private ProductService productService;

    private Catalog catalog(UUID schemaId) {
        ProductSchema schema = new ProductSchema();
        schema.setId(schemaId);
        Catalog c = new Catalog();
        c.setId(UUID.randomUUID());
        c.setSchema(schema);
        return c;
    }

    private Product product(String sku) {
        Product p = new Product();
        p.setId(UUID.randomUUID());
        p.setSku(sku);
        p.setStatus(ProductStatus.DRAFT);
        p.setAttributes(new java.util.HashMap<>());
        return p;
    }

    // --- create ---

    @Test
    void create_savesProductWithCatalogAndSchema() {
        UUID catalogId = UUID.randomUUID();
        Catalog c = catalog(UUID.randomUUID());
        when(catalogRepo.findById(catalogId)).thenReturn(Optional.of(c));
        when(productRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Product result = productService.create("SKU-001", "Blue Shoe", catalogId,
                Map.of("color", "blue"), "user1");

        assertThat(result.getSku()).isEqualTo("SKU-001");
        assertThat(result.getCatalog()).isEqualTo(c);
        assertThat(result.getSchema()).isEqualTo(c.getSchema());
        verify(productRepo).save(any(Product.class));
    }

    @Test
    void create_throwsWhenCatalogNotFound() {
        UUID catalogId = UUID.randomUUID();
        when(catalogRepo.findById(catalogId)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                productService.create("SKU-001", "Blue Shoe", catalogId, Map.of(), "user1"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Catalog not found");
    }

    // --- update ---

    @Test
    void update_mergesAttributes() {
        Product existing = product("SKU-001");
        existing.getAttributes().put("color", "blue");
        when(productRepo.findBySku("SKU-001")).thenReturn(Optional.of(existing));
        when(productRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Product result = productService.update("SKU-001", Map.of("size", "42"), "user1");

        assertThat(result.getAttributes()).containsEntry("color", "blue");
        assertThat(result.getAttributes()).containsEntry("size", "42");
    }

    @Test
    void update_tracksOverriddenFieldsForCarryforwardProducts() {
        Product source = product("SKU-SRC");
        Product carried = product("SKU-001");
        carried.setSourceProduct(source);
        carried.setOverriddenFields(new String[0]);
        when(productRepo.findBySku("SKU-001")).thenReturn(Optional.of(carried));
        when(productRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        productService.update("SKU-001", Map.of("color", "red"), "user1");

        assertThat(carried.getOverriddenFields()).contains("color");
    }

    @Test
    void update_throwsWhenProductNotFound() {
        when(productRepo.findBySku("MISSING")).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                productService.update("MISSING", Map.of(), "user1"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Product not found");
    }

    // --- delete ---

    @Test
    void delete_removesProduct() {
        Product p = product("SKU-001");
        when(productRepo.findBySku("SKU-001")).thenReturn(Optional.of(p));

        productService.delete("SKU-001");

        verify(productRepo).delete(p);
    }

    @Test
    void delete_throwsWhenProductNotFound() {
        when(productRepo.findBySku("MISSING")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.delete("MISSING"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Product not found");
    }

    // --- updateStatus ---

    @Test
    void updateStatus_changesProductStatus() {
        Product p = product("SKU-001");
        when(productRepo.findBySku("SKU-001")).thenReturn(Optional.of(p));
        when(productRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Product result = productService.updateStatus("SKU-001", ProductStatus.PUBLISHED, "user1");

        assertThat(result.getStatus()).isEqualTo(ProductStatus.PUBLISHED);
        assertThat(result.getUpdatedBy()).isEqualTo("user1");
    }

    @Test
    void updateStatus_throwsWhenProductNotFound() {
        when(productRepo.findBySku("MISSING")).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                productService.updateStatus("MISSING", ProductStatus.PUBLISHED, "user1"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Product not found");
    }

    // --- getResolvedProduct ---

    @Test
    void getResolvedProduct_returnsEmptyWhenNotFound() {
        when(productRepo.findBySku("MISSING")).thenReturn(Optional.empty());

        assertThat(productService.getResolvedProduct("MISSING")).isEmpty();
    }

    @Test
    void getResolvedProduct_includesVariantsAndAssets() {
        Product p = product("SKU-001");
        Catalog c = catalog(UUID.randomUUID());
        p.setCatalog(c);
        p.setSchema(c.getSchema());
        when(productRepo.findBySku("SKU-001")).thenReturn(Optional.of(p));

        Optional<Map<String, Object>> resolved = productService.getResolvedProduct("SKU-001");

        assertThat(resolved).isPresent();
        assertThat(resolved.get()).containsKey("sku");
        assertThat(resolved.get()).containsKey("variants");
        assertThat(resolved.get()).containsKey("assets");
    }

    // --- search ---

    @Test
    void search_delegatesToRepo() {
        Page<Product> page = new PageImpl<>(List.of(product("SKU-001")));
        when(productRepo.searchGlobal(eq("shoe"), any(Pageable.class))).thenReturn(page);

        Page<Product> result = productService.search("shoe", PageRequest.of(0, 10));

        assertThat(result.getTotalElements()).isEqualTo(1);
    }
}
