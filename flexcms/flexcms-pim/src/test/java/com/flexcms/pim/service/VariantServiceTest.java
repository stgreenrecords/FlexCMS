package com.flexcms.pim.service;

import com.flexcms.pim.model.Product;
import com.flexcms.pim.model.ProductVariant;
import com.flexcms.pim.repository.ProductRepository;
import com.flexcms.pim.repository.ProductVariantRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VariantServiceTest {

    @Mock
    private ProductVariantRepository variantRepo;

    @Mock
    private ProductRepository productRepo;

    @InjectMocks
    private VariantService variantService;

    private Product product(UUID id) {
        Product p = new Product();
        p.setId(id);
        return p;
    }

    @Test
    void create_savesVariantLinkedToProduct() {
        UUID productId = UUID.randomUUID();
        when(productRepo.findById(productId)).thenReturn(Optional.of(product(productId)));
        when(variantRepo.existsByVariantSku("SKU-S-RED")).thenReturn(false);
        ProductVariant saved = new ProductVariant();
        saved.setVariantSku("SKU-S-RED");
        when(variantRepo.save(any())).thenReturn(saved);

        ProductVariant result = variantService.create(productId, "SKU-S-RED",
                Map.of("size", "S"), Map.of("price", 49.99), null);

        assertThat(result.getVariantSku()).isEqualTo("SKU-S-RED");
        verify(variantRepo).save(any(ProductVariant.class));
    }

    @Test
    void create_throwsWhenProductNotFound() {
        UUID productId = UUID.randomUUID();
        when(productRepo.findById(productId)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                variantService.create(productId, "SKU-X", null, null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Product not found");
    }

    @Test
    void create_throwsOnDuplicateVariantSku() {
        UUID productId = UUID.randomUUID();
        when(productRepo.findById(productId)).thenReturn(Optional.of(product(productId)));
        when(variantRepo.existsByVariantSku("SKU-S-RED")).thenReturn(true);

        assertThatThrownBy(() ->
                variantService.create(productId, "SKU-S-RED", null, null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Variant SKU already exists");
    }

    @Test
    void update_mergesFields() {
        UUID variantId = UUID.randomUUID();
        ProductVariant existing = new ProductVariant();
        existing.setAttributes(Map.of("size", "S"));
        when(variantRepo.findById(variantId)).thenReturn(Optional.of(existing));
        when(variantRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ProductVariant result = variantService.update(variantId,
                Map.of("size", "M"), null, Map.of("qty", 10));

        assertThat(result.getAttributes()).containsEntry("size", "M");
        assertThat(result.getInventory()).containsEntry("qty", 10);
    }

    @Test
    void delete_throwsWhenVariantNotFound() {
        UUID variantId = UUID.randomUUID();
        when(variantRepo.existsById(variantId)).thenReturn(false);

        assertThatThrownBy(() -> variantService.delete(variantId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Variant not found");
    }

    @Test
    void listByProduct_delegatesToRepo() {
        UUID productId = UUID.randomUUID();
        when(variantRepo.findByProductId(productId)).thenReturn(List.of(new ProductVariant()));

        List<ProductVariant> result = variantService.listByProduct(productId);

        assertThat(result).hasSize(1);
    }
}
