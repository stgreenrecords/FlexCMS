package com.flexcms.pim.service;

import com.flexcms.pim.model.Catalog;
import com.flexcms.pim.model.CarryforwardDeltaReport;
import com.flexcms.pim.model.Product;
import com.flexcms.pim.model.ProductSchema;
import com.flexcms.pim.model.ProductStatus;
import com.flexcms.pim.model.ProductVersion;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for year-over-year carryforward operations in ProductService.
 */
@ExtendWith(MockitoExtension.class)
class CarryforwardServiceTest {

    @Mock private ProductRepository productRepo;
    @Mock private CatalogRepository catalogRepo;
    @Mock private ProductSchemaRepository schemaRepo;
    @Mock private ProductVersionRepository productVersionRepo;
    @Mock private SchemaValidationService schemaValidationService;

    @InjectMocks
    private ProductService productService;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private Catalog catalog(int year) {
        ProductSchema schema = new ProductSchema();
        schema.setId(UUID.randomUUID());
        Catalog c = new Catalog();
        c.setId(UUID.randomUUID());
        c.setYear(year);
        c.setSchema(schema);
        return c;
    }

    private Product product(String sku, Catalog cat) {
        Product p = new Product();
        p.setId(UUID.randomUUID());
        p.setSku(sku);
        p.setCatalog(cat);
        p.setStatus(ProductStatus.DRAFT);
        p.setAttributes(new HashMap<>(Map.of("color", "blue", "size", "M")));
        return p;
    }

    private Product carryforwardProduct(String sku, Product source, Catalog targetCat) {
        Product p = new Product();
        p.setId(UUID.randomUUID());
        p.setSku(sku);
        p.setCatalog(targetCat);
        p.setStatus(ProductStatus.DRAFT);
        p.setAttributes(new HashMap<>());
        p.setSourceProduct(source);
        p.setOverriddenFields(new String[0]);
        return p;
    }

    // -------------------------------------------------------------------------
    // carryforward()
    // -------------------------------------------------------------------------

    @Test
    void carryforward_createsProductsWithYearSuffix() {
        Catalog src = catalog(2026);
        Catalog tgt = catalog(2027);
        Product srcProd = product("SHOE-X1-2026", src);

        when(catalogRepo.findById(tgt.getId())).thenReturn(Optional.of(tgt));
        when(productRepo.findByCatalogId(eq(src.getId()), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(srcProd)));
        when(productRepo.existsBySku("SHOE-X1-2026-2027")).thenReturn(false);
        when(productRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        int count = productService.carryforward(src.getId(), tgt.getId(), "user1");

        assertThat(count).isEqualTo(1);
        ArgumentCaptor<Product> captor = ArgumentCaptor.forClass(Product.class);
        verify(productRepo).save(captor.capture());
        Product saved = captor.getValue();
        assertThat(saved.getSku()).isEqualTo("SHOE-X1-2026-2027");
        assertThat(saved.getSourceProduct()).isSameAs(srcProd);
        assertThat(saved.getOverriddenFields()).isEmpty();
        assertThat(saved.getAttributes()).isEmpty();
    }

    @Test
    void carryforward_skipsDuplicateSku() {
        Catalog src = catalog(2026);
        Catalog tgt = catalog(2027);
        Product srcProd = product("SHOE-X1-2026", src);

        when(catalogRepo.findById(tgt.getId())).thenReturn(Optional.of(tgt));
        when(productRepo.findByCatalogId(eq(src.getId()), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(srcProd)));
        when(productRepo.existsBySku("SHOE-X1-2026-2027")).thenReturn(true);  // already exists

        int count = productService.carryforward(src.getId(), tgt.getId(), "user1");

        assertThat(count).isEqualTo(0);
        verify(productRepo, org.mockito.Mockito.never()).save(any());
    }

    @Test
    void carryforward_throwsIllegalArgument_whenTargetCatalogNotFound() {
        UUID missingId = UUID.randomUUID();
        when(catalogRepo.findById(missingId)).thenReturn(Optional.empty());

        org.assertj.core.api.Assertions.assertThatThrownBy(
                () -> productService.carryforward(UUID.randomUUID(), missingId, "user1"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Target catalog not found");
    }

    // -------------------------------------------------------------------------
    // mergeInheritedAttributes()
    // -------------------------------------------------------------------------

    @Test
    void mergeInherited_copiesResolvedAttrsAndBreaksChain() {
        Catalog cat = catalog(2026);
        Product src = product("SHOE-X1-2026", cat);
        src.getAttributes().put("color", "blue");
        src.getAttributes().put("size", "M");

        Catalog tgt = catalog(2027);
        Product carried = carryforwardProduct("SHOE-X1-2026-2027", src, tgt);
        carried.setOverriddenFields(new String[]{"size"});
        carried.getAttributes().put("size", "L");   // only size overridden

        when(productRepo.findBySku("SHOE-X1-2026-2027")).thenReturn(Optional.of(carried));
        when(productRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Product merged = productService.mergeInheritedAttributes("SHOE-X1-2026-2027", "user1");

        // Should have all resolved attributes baked in
        assertThat(merged.getAttributes()).containsEntry("color", "blue");
        assertThat(merged.getAttributes()).containsEntry("size", "L");  // override wins
        // Chain is broken
        assertThat(merged.getSourceProduct()).isNull();
        assertThat(merged.getOverriddenFields()).isEmpty();
        assertThat(merged.getUpdatedBy()).isEqualTo("user1");

        // A version snapshot should be saved
        ArgumentCaptor<ProductVersion> vCaptor = ArgumentCaptor.forClass(ProductVersion.class);
        verify(productVersionRepo).save(vCaptor.capture());
        assertThat(vCaptor.getValue().getChangeSummary()).contains("inheritance chain broken");
    }

    @Test
    void mergeInherited_returnsProductUnchanged_whenAlreadyStandalone() {
        Catalog cat = catalog(2026);
        Product standalone = product("SHOE-X1", cat);   // no sourceProduct

        when(productRepo.findBySku("SHOE-X1")).thenReturn(Optional.of(standalone));

        Product result = productService.mergeInheritedAttributes("SHOE-X1", "user1");

        assertThat(result.getSourceProduct()).isNull();
        verify(productRepo, org.mockito.Mockito.never()).save(any());
    }

    @Test
    void mergeInherited_throwsIllegalArgument_whenSkuNotFound() {
        when(productRepo.findBySku("MISSING")).thenReturn(Optional.empty());

        org.assertj.core.api.Assertions.assertThatThrownBy(
                () -> productService.mergeInheritedAttributes("MISSING", "user1"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Product not found");
    }

    // -------------------------------------------------------------------------
    // getCarryforwardDelta()
    // -------------------------------------------------------------------------

    @Test
    void delta_identifiesModifiedAndNotCarried() {
        Catalog src = catalog(2026);
        Catalog tgt = catalog(2027);

        Product srcA = product("A-2026", src);
        Product srcB = product("B-2026", src);

        // A was carried forward and modified
        Product tgtA = carryforwardProduct("A-2026-2027", srcA, tgt);
        tgtA.setOverriddenFields(new String[]{"color"});

        // B was NOT carried forward — it's absent in target

        // C is brand-new in target (no source)
        Product tgtC = product("C-2027", tgt);

        when(productRepo.findByCatalogId(eq(src.getId()), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(srcA, srcB)));
        when(productRepo.findByCatalogId(eq(tgt.getId()), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(tgtA, tgtC)));

        CarryforwardDeltaReport report = productService.getCarryforwardDelta(src.getId(), tgt.getId());

        assertThat(report.getSourceTotalCount()).isEqualTo(2);
        assertThat(report.getTargetTotalCount()).isEqualTo(2);
        assertThat(report.getCarriedForwardCount()).isEqualTo(1);  // only tgtA

        // A was modified
        assertThat(report.getModifiedProducts()).hasSize(1);
        assertThat(report.getModifiedProducts().get(0).getTargetSku()).isEqualTo("A-2026-2027");
        assertThat(report.getModifiedProducts().get(0).getSourceSku()).isEqualTo("A-2026");
        assertThat(report.getModifiedProducts().get(0).getOverriddenFields()).containsExactly("color");

        // C is brand-new
        assertThat(report.getNewProductSkus()).containsExactly("C-2027");

        // B was not carried forward
        assertThat(report.getNotCarriedForwardSkus()).containsExactly("B-2026");
    }

    @Test
    void delta_emptyTarget_allSourceSkusNotCarried() {
        Catalog src = catalog(2026);
        Catalog tgt = catalog(2027);

        Product srcA = product("A-2026", src);
        Product srcB = product("B-2026", src);

        when(productRepo.findByCatalogId(eq(src.getId()), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(srcA, srcB)));
        when(productRepo.findByCatalogId(eq(tgt.getId()), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        CarryforwardDeltaReport report = productService.getCarryforwardDelta(src.getId(), tgt.getId());

        assertThat(report.getNotCarriedForwardSkus()).containsExactlyInAnyOrder("A-2026", "B-2026");
        assertThat(report.getModifiedProducts()).isEmpty();
        assertThat(report.getNewProductSkus()).isEmpty();
    }
}
