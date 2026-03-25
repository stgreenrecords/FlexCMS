package com.flexcms.pim.service;

import com.flexcms.pim.model.ProductSchema;
import com.flexcms.pim.repository.ProductSchemaRepository;
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
class SchemaServiceTest {

    @Mock
    private ProductSchemaRepository schemaRepo;

    @InjectMocks
    private SchemaService schemaService;

    @Test
    void create_savesSchemaAndReturnsIt() {
        when(schemaRepo.findByNameAndVersion("Footwear", "2026")).thenReturn(Optional.empty());
        ProductSchema saved = new ProductSchema();
        saved.setName("Footwear");
        saved.setVersion("2026");
        when(schemaRepo.save(any())).thenReturn(saved);

        ProductSchema result = schemaService.create("Footwear", "2026", "desc",
                Map.of("type", "object"), null, null, "user1");

        assertThat(result.getName()).isEqualTo("Footwear");
        verify(schemaRepo).save(any(ProductSchema.class));
    }

    @Test
    void create_throwsWhenNameVersionExists() {
        when(schemaRepo.findByNameAndVersion("Footwear", "2026"))
                .thenReturn(Optional.of(new ProductSchema()));

        assertThatThrownBy(() ->
                schemaService.create("Footwear", "2026", null, Map.of(), null, null, "user1"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Schema already exists");
    }

    @Test
    void create_withParent_setsParentOnSchema() {
        UUID parentId = UUID.randomUUID();
        ProductSchema parent = new ProductSchema();
        parent.setId(parentId);

        when(schemaRepo.findByNameAndVersion(any(), any())).thenReturn(Optional.empty());
        when(schemaRepo.findById(parentId)).thenReturn(Optional.of(parent));
        when(schemaRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ProductSchema result = schemaService.create("Footwear", "2027", null,
                Map.of(), null, parentId, "user1");

        assertThat(result.getParent()).isEqualTo(parent);
    }

    @Test
    void create_withMissingParent_throws() {
        UUID parentId = UUID.randomUUID();
        when(schemaRepo.findByNameAndVersion(any(), any())).thenReturn(Optional.empty());
        when(schemaRepo.findById(parentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                schemaService.create("Footwear", "2027", null, Map.of(), null, parentId, "user1"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Parent schema not found");
    }

    @Test
    void deactivate_setsActiveFalse() {
        ProductSchema schema = new ProductSchema();
        schema.setActive(true);
        UUID id = UUID.randomUUID();
        when(schemaRepo.findById(id)).thenReturn(Optional.of(schema));
        when(schemaRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        schemaService.deactivate(id);

        assertThat(schema.isActive()).isFalse();
    }

    @Test
    void delete_throwsWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(schemaRepo.existsById(id)).thenReturn(false);

        assertThatThrownBy(() -> schemaService.delete(id))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Schema not found");
    }

    @Test
    void listActive_delegatesToRepo() {
        ProductSchema s = new ProductSchema();
        when(schemaRepo.findByActiveTrue()).thenReturn(List.of(s));

        List<ProductSchema> result = schemaService.listActive();

        assertThat(result).hasSize(1);
    }
}
