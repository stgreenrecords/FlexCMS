package com.flexcms.core.service;

import com.flexcms.core.model.ContentNode;
import com.flexcms.plugin.model.RenderContext;
import com.flexcms.plugin.spi.ComponentModel;
import com.flexcms.plugin.spi.ContentNodeData;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContentDeliveryServiceTest {

    @Mock
    private ContentNodeService nodeService;

    @Mock
    private ComponentRegistry componentRegistry;

    @InjectMocks
    private ContentDeliveryService contentDeliveryService;

    private RenderContext buildContext() {
        return new RenderContext("corporate", Locale.ENGLISH, "/home", "publish");
    }

    private ContentNode buildPage(String path, String title) {
        ContentNode page = new ContentNode(path, "home", "flexcms/page");
        page.setSiteId("corporate");
        page.setLocale("en");
        page.setProperties(new HashMap<>());
        page.setProperty("jcr:title", title);
        page.setProperty("template", "landing");
        page.setChildren(new ArrayList<>());
        return page;
    }

    // --- renderPage ---

    @Test
    void renderPage_throwsIllegalArgument_whenPageNotFound() {
        when(nodeService.getWithChildren("content.corporate.en.missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                contentDeliveryService.renderPage("content.corporate.en.missing", buildContext()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("content.corporate.en.missing");
    }

    @Test
    @SuppressWarnings("unchecked")
    void renderPage_returnsPageMeta_withEmptyComponents() {
        ContentNode page = buildPage("content.corporate.en.home", "Home Page");
        when(nodeService.getWithChildren("content.corporate.en.home")).thenReturn(Optional.of(page));

        Map<String, Object> result = contentDeliveryService.renderPage("content.corporate.en.home", buildContext());

        assertThat(result).containsKeys("page", "components");

        Map<String, Object> pageMeta = (Map<String, Object>) result.get("page");
        assertThat(pageMeta)
                .containsEntry("title", "Home Page")
                .containsEntry("path", "content.corporate.en.home")
                .containsEntry("template", "landing")
                .containsEntry("locale", "en");

        List<?> components = (List<?>) result.get("components");
        assertThat(components).isEmpty();
    }

    @Test
    @SuppressWarnings("unchecked")
    void renderPage_adaptsComponents_viaRegisteredModel() throws Exception {
        ContentNode page = buildPage("content.corporate.en.home", "Home");
        ContentNode hero = new ContentNode("content.corporate.en.home.hero", "hero", "flexcms/hero");
        hero.setProperties(new HashMap<>(Map.of("headline", "Welcome")));
        hero.setChildren(new ArrayList<>());
        page.setChildren(List.of(hero));

        ComponentModel mockModel = mock(ComponentModel.class);
        when(mockModel.adapt(any(ContentNodeData.class), any(RenderContext.class)))
                .thenReturn(Map.of("adapted", "data"));
        when(nodeService.getWithChildren("content.corporate.en.home")).thenReturn(Optional.of(page));
        when(componentRegistry.getModel("flexcms/hero")).thenReturn(Optional.of(mockModel));

        Map<String, Object> result = contentDeliveryService.renderPage("content.corporate.en.home", buildContext());

        List<Map<String, Object>> components = (List<Map<String, Object>>) result.get("components");
        assertThat(components).hasSize(1);
        assertThat(components.get(0))
                .containsEntry("name", "hero")
                .containsEntry("resourceType", "flexcms/hero");
        Map<String, Object> data = (Map<String, Object>) components.get(0).get("data");
        assertThat(data).containsEntry("adapted", "data");
    }

    @Test
    @SuppressWarnings("unchecked")
    void renderPage_usesRawProperties_whenNoModelRegistered() {
        ContentNode page = buildPage("content.corporate.en.home", "Home");
        ContentNode text = new ContentNode("content.corporate.en.home.text", "text", "flexcms/text");
        text.setProperties(new HashMap<>(Map.of("content", "<p>Hello</p>")));
        text.setChildren(new ArrayList<>());
        page.setChildren(List.of(text));

        when(nodeService.getWithChildren("content.corporate.en.home")).thenReturn(Optional.of(page));
        when(componentRegistry.getModel("flexcms/text")).thenReturn(Optional.empty());

        Map<String, Object> result = contentDeliveryService.renderPage("content.corporate.en.home", buildContext());

        List<Map<String, Object>> components = (List<Map<String, Object>>) result.get("components");
        assertThat(components).hasSize(1);
        Map<String, Object> textData = (Map<String, Object>) components.get(0).get("data");
        assertThat(textData).containsEntry("content", "<p>Hello</p>");
        assertThat(components.get(0)).doesNotContainKey("_error");
    }

    @Test
    @SuppressWarnings("unchecked")
    void renderPage_handlesComponentModelException_gracefully() throws Exception {
        ContentNode page = buildPage("content.corporate.en.home", "Home");
        ContentNode broken = new ContentNode("content.corporate.en.home.broken", "broken", "flexcms/broken");
        broken.setProperties(new HashMap<>());
        broken.setChildren(new ArrayList<>());
        page.setChildren(List.of(broken));

        ComponentModel failingModel = mock(ComponentModel.class);
        when(failingModel.adapt(any(), any())).thenThrow(new RuntimeException("model exploded"));
        when(nodeService.getWithChildren("content.corporate.en.home")).thenReturn(Optional.of(page));
        when(componentRegistry.getModel("flexcms/broken")).thenReturn(Optional.of(failingModel));

        Map<String, Object> result = contentDeliveryService.renderPage("content.corporate.en.home", buildContext());

        List<Map<String, Object>> components = (List<Map<String, Object>>) result.get("components");
        assertThat(components.get(0)).containsKey("_error");
        assertThat((String) components.get(0).get("_error")).contains("model exploded");
    }

    @Test
    @SuppressWarnings("unchecked")
    void renderPage_processesNestedChildren_recursively() {
        ContentNode page = buildPage("content.corporate.en.home", "Home");
        ContentNode container = new ContentNode("content.corporate.en.home.container", "container", "flexcms/container");
        ContentNode child = new ContentNode("content.corporate.en.home.container.text", "text", "flexcms/text");
        child.setProperties(new HashMap<>());
        child.setChildren(new ArrayList<>());
        container.setProperties(new HashMap<>());
        container.setChildren(List.of(child));
        page.setChildren(List.of(container));

        when(nodeService.getWithChildren("content.corporate.en.home")).thenReturn(Optional.of(page));
        when(componentRegistry.getModel(any())).thenReturn(Optional.empty());

        Map<String, Object> result = contentDeliveryService.renderPage("content.corporate.en.home", buildContext());

        List<Map<String, Object>> components = (List<Map<String, Object>>) result.get("components");
        assertThat(components.get(0)).containsKey("children");
        List<Map<String, Object>> nestedChildren = (List<Map<String, Object>>) components.get(0).get("children");
        assertThat(nestedChildren).hasSize(1);
        assertThat(nestedChildren.get(0).get("name")).isEqualTo("text");
    }

    @Test
    @SuppressWarnings("unchecked")
    void renderPage_doesNotAddChildrenKey_whenNodeHasNoChildren() {
        ContentNode page = buildPage("content.corporate.en.home", "Home");
        ContentNode leaf = new ContentNode("content.corporate.en.home.text", "text", "flexcms/text");
        leaf.setProperties(new HashMap<>());
        leaf.setChildren(new ArrayList<>()); // explicitly empty
        page.setChildren(List.of(leaf));

        when(nodeService.getWithChildren("content.corporate.en.home")).thenReturn(Optional.of(page));
        when(componentRegistry.getModel("flexcms/text")).thenReturn(Optional.empty());

        Map<String, Object> result = contentDeliveryService.renderPage("content.corporate.en.home", buildContext());

        List<Map<String, Object>> components = (List<Map<String, Object>>) result.get("components");
        assertThat(components.get(0)).doesNotContainKey("children");
    }
}
