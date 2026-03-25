package com.flexcms.headless.graphql;

import com.flexcms.core.model.*;
import com.flexcms.core.service.ContentNodeService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GraphQLFieldResolversTest {

    @Mock
    private ContentNodeService nodeService;

    @InjectMocks
    private GraphQLFieldResolvers resolvers;

    // -------------------------------------------------------------------------
    // ContentNode.children
    // -------------------------------------------------------------------------

    @Test
    void contentNodeChildren_returnsChildrenMappedToMaps() {
        ContentNode child = new ContentNode("content.site.en.about", "about", "flexcms/page");
        child.setStatus(NodeStatus.PUBLISHED);
        when(nodeService.getChildren("content.site.en.home")).thenReturn(List.of(child));

        Map<String, Object> parentNode = Map.of("path", "content.site.en.home");
        List<Map<String, Object>> result = resolvers.contentNodeChildren(parentNode);

        assertThat(result).hasSize(1);
        assertThat(result.get(0)).containsEntry("path", "content.site.en.about");
        assertThat(result.get(0)).containsEntry("name", "about");
        assertThat(result.get(0)).containsEntry("resourceType", "flexcms/page");
        assertThat(result.get(0)).containsEntry("status", "PUBLISHED");
    }

    @Test
    void contentNodeChildren_returnsEmpty_whenPathIsNull() {
        Map<String, Object> parentNode = Map.of("name", "root");
        List<Map<String, Object>> result = resolvers.contentNodeChildren(parentNode);
        assertThat(result).isEmpty();
    }

    @Test
    void contentNodeChildren_returnsEmpty_whenNoChildren() {
        when(nodeService.getChildren("content.site.en.leaf")).thenReturn(List.of());
        List<Map<String, Object>> result = resolvers.contentNodeChildren(Map.of("path", "content.site.en.leaf"));
        assertThat(result).isEmpty();
    }

    // -------------------------------------------------------------------------
    // Asset.renditions
    // -------------------------------------------------------------------------

    @Test
    void assetRenditions_mapsRenditionKeyToKey_andStorageKeyToUrl() {
        AssetRendition rendition = new AssetRendition();
        rendition.setRenditionKey("thumbnail");
        rendition.setStorageKey("s3://bucket/thumb.jpg");
        rendition.setWidth(200);
        rendition.setHeight(150);
        rendition.setFormat("jpeg");

        Asset asset = new Asset();
        asset.setRenditions(List.of(rendition));

        List<Map<String, Object>> result = resolvers.assetRenditions(asset);

        assertThat(result).hasSize(1);
        assertThat(result.get(0)).containsEntry("key", "thumbnail");
        assertThat(result.get(0)).containsEntry("url", "s3://bucket/thumb.jpg");
        assertThat(result.get(0)).containsEntry("width", 200);
        assertThat(result.get(0)).containsEntry("height", 150);
        assertThat(result.get(0)).containsEntry("format", "jpeg");
    }

    @Test
    void assetRenditions_returnsEmpty_whenNoRenditions() {
        Asset asset = new Asset();
        asset.setRenditions(List.of());

        assertThat(resolvers.assetRenditions(asset)).isEmpty();
    }

    // -------------------------------------------------------------------------
    // ComponentDefinition field translations
    // -------------------------------------------------------------------------

    @Test
    void componentDefinitionGroup_returnsGroupName() {
        ComponentDefinition def = new ComponentDefinition();
        def.setGroupName("Layout");

        assertThat(resolvers.componentDefinitionGroup(def)).isEqualTo("Layout");
    }

    @Test
    void componentDefinitionGroup_returnsNull_whenGroupNameIsNull() {
        ComponentDefinition def = new ComponentDefinition();
        assertThat(resolvers.componentDefinitionGroup(def)).isNull();
    }

    @Test
    void componentDefinitionIsContainer_returnsTrue_forContainers() {
        ComponentDefinition def = new ComponentDefinition();
        def.setContainer(true);

        assertThat(resolvers.componentDefinitionIsContainer(def)).isTrue();
    }

    @Test
    void componentDefinitionIsContainer_returnsFalse_forLeafComponents() {
        ComponentDefinition def = new ComponentDefinition();
        def.setContainer(false);

        assertThat(resolvers.componentDefinitionIsContainer(def)).isFalse();
    }
}
