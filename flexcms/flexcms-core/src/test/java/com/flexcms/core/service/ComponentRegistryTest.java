package com.flexcms.core.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.flexcms.core.model.ComponentDefinition;
import com.flexcms.core.repository.ComponentDefinitionRepository;
import com.flexcms.plugin.annotation.FlexCmsComponent;
import com.flexcms.plugin.spi.ComponentModel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationContext;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ComponentRegistryTest {

    @Mock
    private ApplicationContext applicationContext;

    @Mock
    private ComponentDefinitionRepository componentDefRepo;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private ComponentRegistry componentRegistry;

    private Map<String, ComponentModel> modelRegistry;
    private Map<String, ComponentDefinition> definitionCache;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        modelRegistry = (Map<String, ComponentModel>) ReflectionTestUtils.getField(componentRegistry, "modelRegistry");
        definitionCache = (Map<String, ComponentDefinition>) ReflectionTestUtils.getField(componentRegistry, "definitionCache");
    }

    // --- getModel ---

    @Test
    void getModel_returnsEmpty_whenNotRegistered() {
        assertThat(componentRegistry.getModel("flexcms/unknown")).isEmpty();
    }

    @Test
    void getModel_returnsModel_whenRegistered() {
        ComponentModel mockModel = mock(ComponentModel.class);
        modelRegistry.put("flexcms/hero", mockModel);

        assertThat(componentRegistry.getModel("flexcms/hero")).contains(mockModel);
    }

    // --- getDefinition ---

    @Test
    void getDefinition_returnsEmpty_whenNotPresent() {
        assertThat(componentRegistry.getDefinition("flexcms/unknown")).isEmpty();
    }

    @Test
    void getDefinition_returnsDefinition_whenPresent() {
        ComponentDefinition def = new ComponentDefinition("flexcms/hero", "hero", "Hero");
        definitionCache.put("flexcms/hero", def);

        assertThat(componentRegistry.getDefinition("flexcms/hero")).contains(def);
    }

    // --- getAllDefinitions ---

    @Test
    void getAllDefinitions_returnsEmpty_whenCacheIsEmpty() {
        assertThat(componentRegistry.getAllDefinitions()).isEmpty();
    }

    @Test
    void getAllDefinitions_returnsAllCachedDefinitions() {
        ComponentDefinition hero = new ComponentDefinition("flexcms/hero", "hero", "Hero");
        ComponentDefinition text = new ComponentDefinition("flexcms/text", "text", "Text");
        definitionCache.put("flexcms/hero", hero);
        definitionCache.put("flexcms/text", text);

        List<ComponentDefinition> all = componentRegistry.getAllDefinitions();

        assertThat(all).hasSize(2).containsExactlyInAnyOrder(hero, text);
    }

    // --- getDefinitionsByGroup ---

    @Test
    void getDefinitionsByGroup_filtersCorrectly() {
        ComponentDefinition hero = new ComponentDefinition("flexcms/hero", "hero", "Hero");
        hero.setGroupName("media");
        ComponentDefinition text = new ComponentDefinition("flexcms/text", "text", "Text");
        text.setGroupName("content");
        ComponentDefinition image = new ComponentDefinition("flexcms/image", "image", "Image");
        image.setGroupName("media");
        definitionCache.put("flexcms/hero", hero);
        definitionCache.put("flexcms/text", text);
        definitionCache.put("flexcms/image", image);

        List<ComponentDefinition> mediaComponents = componentRegistry.getDefinitionsByGroup("media");

        assertThat(mediaComponents).hasSize(2)
                .extracting(ComponentDefinition::getGroupName)
                .containsOnly("media");
    }

    @Test
    void getDefinitionsByGroup_returnsEmpty_whenNoMatch() {
        ComponentDefinition text = new ComponentDefinition("flexcms/text", "text", "Text");
        text.setGroupName("content");
        definitionCache.put("flexcms/text", text);

        List<ComponentDefinition> result = componentRegistry.getDefinitionsByGroup("nonexistent");

        assertThat(result).isEmpty();
    }

    // --- init ---

    @Test
    void init_loadsDefinitionsFromRepo_intoCache() {
        ComponentDefinition def = new ComponentDefinition("flexcms/hero", "hero", "Hero");
        when(applicationContext.getBeansWithAnnotation(FlexCmsComponent.class)).thenReturn(Map.of());
        when(componentDefRepo.findByActiveTrue()).thenReturn(List.of(def));

        componentRegistry.init();

        assertThat(componentRegistry.getDefinition("flexcms/hero")).contains(def);
    }

    @Test
    void init_withNoBeans_leavesRegistriesEmpty() {
        when(applicationContext.getBeansWithAnnotation(FlexCmsComponent.class)).thenReturn(Map.of());
        when(componentDefRepo.findByActiveTrue()).thenReturn(List.of());

        componentRegistry.init();

        assertThat(componentRegistry.getAllDefinitions()).isEmpty();
        assertThat(componentRegistry.getModel("any/type")).isEmpty();
    }
}
