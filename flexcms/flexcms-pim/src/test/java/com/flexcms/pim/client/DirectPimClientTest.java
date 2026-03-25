package com.flexcms.pim.client;

import com.flexcms.plugin.pim.PimProductData;
import com.flexcms.pim.model.Catalog;
import com.flexcms.pim.model.Product;
import com.flexcms.pim.model.ProductSchema;
import com.flexcms.pim.model.ProductStatus;
import com.flexcms.pim.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DirectPimClientTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private DirectPimClient pimClient;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private Product product(String sku) {
        ProductSchema schema = new ProductSchema();
        schema.setId(UUID.randomUUID());
        Catalog catalog = new Catalog();
        catalog.setId(UUID.randomUUID());
        catalog.setSchema(schema);

        Product p = new Product();
        p.setId(UUID.randomUUID());
        p.setSku(sku);
        p.setName("Product " + sku);
        p.setStatus(ProductStatus.PUBLISHED);
        p.setCatalog(catalog);
        p.setSchema(schema);
        p.setAttributes(new HashMap<>(Map.of("color", "blue", "size", "M")));
        p.setOverriddenFields(new String[0]);
        p.setVariants(new ArrayList<>());
        p.setAssetRefs(new ArrayList<>());
        return p;
    }

    // -------------------------------------------------------------------------
    // getProduct
    // -------------------------------------------------------------------------

    @Test
    void getProduct_returnsData_whenFound() {
        Product p = product("SHOE-X1");
        when(productRepository.findBySku("SHOE-X1")).thenReturn(Optional.of(p));

        Optional<PimProductData> result = pimClient.getProduct("SHOE-X1");

        assertThat(result).isPresent();
        PimProductData data = result.get();
        assertThat(data.getSku()).isEqualTo("SHOE-X1");
        assertThat(data.getName()).isEqualTo("Product SHOE-X1");
        assertThat(data.getStatus()).isEqualTo("PUBLISHED");
        assertThat(data.getAttributes()).containsEntry("color", "blue");
    }

    @Test
    void getProduct_returnsEmpty_whenNotFound() {
        when(productRepository.findBySku("MISSING")).thenReturn(Optional.empty());

        assertThat(pimClient.getProduct("MISSING")).isEmpty();
    }

    @Test
    void getProduct_includesResolvedAttributes_forCarryforwardProduct() {
        // Source product has base attributes
        Product source = product("SHOE-X1-2026");
        source.getAttributes().put("color", "red");
        source.getAttributes().put("material", "leather");

        // Carried product only has overridden "color" field
        Product carried = product("SHOE-X1-2026-2027");
        carried.setSourceProduct(source);
        carried.setOverriddenFields(new String[]{"color"});
        carried.setAttributes(new HashMap<>(Map.of("color", "blue")));

        when(productRepository.findBySku("SHOE-X1-2026-2027")).thenReturn(Optional.of(carried));

        PimProductData data = pimClient.getProduct("SHOE-X1-2026-2027").orElseThrow();

        // Resolved: color=blue (override), material=leather (from source)
        assertThat(data.getAttributes()).containsEntry("color", "blue");
        assertThat(data.getAttributes()).containsEntry("material", "leather");
        assertThat(data.getOverriddenFields()).containsExactly("color");
    }

    // -------------------------------------------------------------------------
    // getBulk
    // -------------------------------------------------------------------------

    @Test
    void getBulk_returnsAllFoundProducts() {
        Product p1 = product("SKU-A");
        Product p2 = product("SKU-B");
        when(productRepository.findBySku("SKU-A")).thenReturn(Optional.of(p1));
        when(productRepository.findBySku("SKU-B")).thenReturn(Optional.of(p2));
        when(productRepository.findBySku("SKU-C")).thenReturn(Optional.empty());

        List<PimProductData> results = pimClient.getBulk(List.of("SKU-A", "SKU-B", "SKU-C"));

        assertThat(results).hasSize(2);
        assertThat(results.stream().map(PimProductData::getSku))
                .containsExactlyInAnyOrder("SKU-A", "SKU-B");
    }

    @Test
    void getBulk_returnsEmpty_forEmptyInput() {
        assertThat(pimClient.getBulk(List.of())).isEmpty();
    }

    // -------------------------------------------------------------------------
    // listByCatalog
    // -------------------------------------------------------------------------

    @Test
    void listByCatalog_returnsPublishedProducts() {
        UUID catalogId = UUID.randomUUID();
        Product p1 = product("PROD-1");
        when(productRepository.findByCatalogIdAndStatus(
                eq(catalogId), eq(ProductStatus.PUBLISHED), any()))
                .thenReturn(new PageImpl<>(List.of(p1)));

        List<PimProductData> results = pimClient.listByCatalog(catalogId.toString(), 0, 20);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getSku()).isEqualTo("PROD-1");
    }

    @Test
    void listByCatalog_clampsPageSizeTo100() {
        UUID catalogId = UUID.randomUUID();
        when(productRepository.findByCatalogIdAndStatus(
                eq(catalogId), eq(ProductStatus.PUBLISHED), eq(PageRequest.of(0, 100))))
                .thenReturn(new PageImpl<>(List.of()));

        pimClient.listByCatalog(catalogId.toString(), 0, 999);  // request 999, should clamp to 100
    }

    @Test
    void listByCatalog_returnsEmpty_forInvalidUuid() {
        assertThat(pimClient.listByCatalog("not-a-uuid", 0, 10)).isEmpty();
    }

    // -------------------------------------------------------------------------
    // exists
    // -------------------------------------------------------------------------

    @Test
    void exists_returnsTrueWhenFound() {
        when(productRepository.existsBySku("SHOE-X1")).thenReturn(true);
        assertThat(pimClient.exists("SHOE-X1")).isTrue();
    }

    @Test
    void exists_returnsFalseWhenNotFound() {
        when(productRepository.existsBySku("MISSING")).thenReturn(false);
        assertThat(pimClient.exists("MISSING")).isFalse();
    }
}
