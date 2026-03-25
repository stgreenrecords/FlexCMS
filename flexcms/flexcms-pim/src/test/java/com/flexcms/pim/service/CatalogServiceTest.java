package com.flexcms.pim.service;

import com.flexcms.pim.model.Catalog;
import com.flexcms.pim.model.ProductSchema;
import com.flexcms.pim.repository.CatalogRepository;
import com.flexcms.pim.repository.ProductSchemaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CatalogServiceTest {

    @Mock
    private CatalogRepository catalogRepo;

    @Mock
    private ProductSchemaRepository schemaRepo;

    @InjectMocks
    private CatalogService catalogService;

    private ProductSchema schema() {
        ProductSchema s = new ProductSchema();
        s.setId(UUID.randomUUID());
        return s;
    }

    @Test
    void create_savesAndReturnsCatalog() {
        UUID schemaId = UUID.randomUUID();
        when(schemaRepo.findById(schemaId)).thenReturn(Optional.of(schema()));
        Catalog saved = new Catalog();
        saved.setName("Spring 2026");
        when(catalogRepo.save(any())).thenReturn(saved);

        Catalog result = catalogService.create("Spring 2026", 2026, "SS", "desc",
                schemaId, null, "user1");

        assertThat(result.getName()).isEqualTo("Spring 2026");
    }

    @Test
    void create_throwsWhenSchemaNotFound() {
        UUID schemaId = UUID.randomUUID();
        when(schemaRepo.findById(schemaId)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                catalogService.create("Spring 2026", 2026, null, null, schemaId, null, "user1"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Schema not found");
    }

    @Test
    void activate_transitionsDraftToActive() {
        Catalog catalog = new Catalog();
        catalog.setStatus(Catalog.CatalogStatus.DRAFT);
        UUID id = UUID.randomUUID();
        when(catalogRepo.findById(id)).thenReturn(Optional.of(catalog));
        when(catalogRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Catalog result = catalogService.activate(id);

        assertThat(result.getStatus()).isEqualTo(Catalog.CatalogStatus.ACTIVE);
    }

    @Test
    void activate_throwsWhenAlreadyActive() {
        Catalog catalog = new Catalog();
        catalog.setStatus(Catalog.CatalogStatus.ACTIVE);
        UUID id = UUID.randomUUID();
        when(catalogRepo.findById(id)).thenReturn(Optional.of(catalog));

        assertThatThrownBy(() -> catalogService.activate(id))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Only DRAFT catalogs can be activated");
    }

    @Test
    void archive_transitionsActiveToArchived() {
        Catalog catalog = new Catalog();
        catalog.setStatus(Catalog.CatalogStatus.ACTIVE);
        UUID id = UUID.randomUUID();
        when(catalogRepo.findById(id)).thenReturn(Optional.of(catalog));
        when(catalogRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Catalog result = catalogService.archive(id);

        assertThat(result.getStatus()).isEqualTo(Catalog.CatalogStatus.ARCHIVED);
    }

    @Test
    void archive_throwsWhenNotActive() {
        Catalog catalog = new Catalog();
        catalog.setStatus(Catalog.CatalogStatus.DRAFT);
        UUID id = UUID.randomUUID();
        when(catalogRepo.findById(id)).thenReturn(Optional.of(catalog));

        assertThatThrownBy(() -> catalogService.archive(id))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Only ACTIVE catalogs can be archived");
    }

    @Test
    void delete_throwsWhenCatalogIsActive() {
        Catalog catalog = new Catalog();
        catalog.setStatus(Catalog.CatalogStatus.ACTIVE);
        UUID id = UUID.randomUUID();
        when(catalogRepo.findById(id)).thenReturn(Optional.of(catalog));

        assertThatThrownBy(() -> catalogService.delete(id))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot delete an ACTIVE catalog");
    }

    @Test
    void delete_succeeds_forDraftCatalog() {
        Catalog catalog = new Catalog();
        catalog.setStatus(Catalog.CatalogStatus.DRAFT);
        UUID id = UUID.randomUUID();
        when(catalogRepo.findById(id)).thenReturn(Optional.of(catalog));

        catalogService.delete(id);

        verify(catalogRepo).deleteById(id);
    }
}
