package com.flexcms.pim.service;

import com.flexcms.pim.model.Product;
import com.flexcms.pim.model.ProductAssetRef;
import com.flexcms.pim.repository.ProductAssetRefRepository;
import com.flexcms.pim.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductAssetRefServiceTest {

    @Mock
    private ProductAssetRefRepository assetRefRepo;

    @Mock
    private ProductRepository productRepo;

    @InjectMocks
    private ProductAssetRefService assetRefService;

    private Product product(UUID id) {
        Product p = new Product();
        p.setId(id);
        return p;
    }

    @Test
    void link_createsRefAndReturnsIt() {
        UUID productId = UUID.randomUUID();
        when(productRepo.findById(productId)).thenReturn(Optional.of(product(productId)));
        when(assetRefRepo.findByProductIdAndAssetPathAndRole(productId, "/dam/hero.jpg", "hero"))
                .thenReturn(Optional.empty());
        ProductAssetRef saved = new ProductAssetRef();
        saved.setAssetPath("/dam/hero.jpg");
        when(assetRefRepo.save(any())).thenReturn(saved);

        ProductAssetRef result = assetRefService.link(productId, "/dam/hero.jpg", "hero", 0);

        assertThat(result.getAssetPath()).isEqualTo("/dam/hero.jpg");
        verify(assetRefRepo).save(any(ProductAssetRef.class));
    }

    @Test
    void link_throwsWhenProductNotFound() {
        UUID productId = UUID.randomUUID();
        when(productRepo.findById(productId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> assetRefService.link(productId, "/dam/img.jpg", "gallery", 0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Product not found");
    }

    @Test
    void link_throwsOnDuplicate() {
        UUID productId = UUID.randomUUID();
        when(productRepo.findById(productId)).thenReturn(Optional.of(product(productId)));
        when(assetRefRepo.findByProductIdAndAssetPathAndRole(productId, "/dam/hero.jpg", "hero"))
                .thenReturn(Optional.of(new ProductAssetRef()));

        assertThatThrownBy(() -> assetRefService.link(productId, "/dam/hero.jpg", "hero", 0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Asset already linked");
    }

    @Test
    void unlink_throwsWhenRefNotFound() {
        UUID refId = UUID.randomUUID();
        when(assetRefRepo.existsById(refId)).thenReturn(false);

        assertThatThrownBy(() -> assetRefService.unlink(refId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Asset ref not found");
    }

    @Test
    void unlink_deletesRef() {
        UUID refId = UUID.randomUUID();
        when(assetRefRepo.existsById(refId)).thenReturn(true);

        assetRefService.unlink(refId);

        verify(assetRefRepo).deleteById(refId);
    }

    @Test
    void listByProduct_delegatesToRepo() {
        UUID productId = UUID.randomUUID();
        when(assetRefRepo.findByProductIdOrderByOrderIndex(productId))
                .thenReturn(List.of(new ProductAssetRef()));

        List<ProductAssetRef> result = assetRefService.listByProduct(productId);

        assertThat(result).hasSize(1);
    }
}
