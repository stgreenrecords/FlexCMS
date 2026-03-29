package com.flexcms.core.service;

import com.flexcms.core.model.TemplateDefinition;
import com.flexcms.core.repository.TemplateDefinitionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TemplateRegistryServiceTest {

    @Mock
    private TemplateDefinitionRepository templateDefinitionRepository;

    @InjectMocks
    private TemplateRegistryService templateRegistryService;

    @Test
    void getTemplate_returnsExplicitTemplateArrays() {
        TemplateDefinition definition = new TemplateDefinition();
        definition.setName("global-home-page");
        definition.setTitle("Global Home Page");
        definition.setDescription("Home");
        definition.setResourceType("flexcms/page");
        definition.setActive(true);
        definition.setStructure(Map.of(
                "embeddedComponents", List.of(Map.of("title", "Navigation", "resourceType", "tut-usa/navigation")),
                "allowedComponents", List.of(Map.of("title", "FAQ", "resourceType", "tut-usa/faq")),
                "embeddedComponentTypes", List.of("tut-usa/navigation"),
                "allowedComponentTypes", List.of("tut-usa/faq")
        ));

        when(templateDefinitionRepository.findByName("global-home-page")).thenReturn(Optional.of(definition));

        TemplateRegistryService.TemplateContract contract = templateRegistryService.getTemplate("global-home-page").orElseThrow();

        assertThat(contract.embeddedComponentTypes()).containsExactly("tut-usa/navigation");
        assertThat(contract.allowedComponentTypes()).containsExactly("tut-usa/faq");
        assertThat(contract.embeddedComponents()).containsExactly(
                new TemplateRegistryService.TemplateComponentRef("Navigation", "tut-usa/navigation")
        );
    }

    @Test
    void getTemplate_fallsBackToLegacyStructureChildren() {
        TemplateDefinition definition = new TemplateDefinition();
        definition.setName("default-page");
        definition.setTitle("Default Page");
        definition.setResourceType("flexcms/page");
        definition.setActive(true);
        definition.setStructure(Map.of(
                "children", List.of(
                        Map.of("name", "header", "resourceType", "flexcms/shared-header"),
                        Map.of("name", "main", "resourceType", "flexcms/container")
                )
        ));

        when(templateDefinitionRepository.findByName("default-page")).thenReturn(Optional.of(definition));

        TemplateRegistryService.TemplateContract contract = templateRegistryService.getTemplate("default-page").orElseThrow();

        assertThat(contract.embeddedComponentTypes()).containsExactly(
                "flexcms/shared-header",
                "flexcms/container"
        );
        assertThat(contract.embeddedComponents()).containsExactly(
                new TemplateRegistryService.TemplateComponentRef("header", "flexcms/shared-header"),
                new TemplateRegistryService.TemplateComponentRef("main", "flexcms/container")
        );
    }
}
