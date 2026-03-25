package com.flexcms.headless.graphql;

import com.flexcms.core.model.AssetRendition;
import com.flexcms.core.model.ComponentDefinition;
import com.flexcms.core.service.ContentNodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.stereotype.Controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Field-level resolvers for GraphQL types whose Java representation does not
 * directly match the schema field names.
 *
 * <p>Spring GraphQL invokes these when a client requests a field that cannot
 * be resolved by simple property access on the parent object.</p>
 */
@Controller
public class GraphQLFieldResolvers {

    @Autowired
    private ContentNodeService nodeService;

    // -------------------------------------------------------------------------
    // ContentNode.children
    // -------------------------------------------------------------------------

    /**
     * Resolves the {@code children} field on {@code ContentNode}.
     *
     * <p>The {@code node} query returns a {@code Map<String, Object>} without
     * a {@code children} key (to keep queries efficient). This resolver is
     * invoked only when the client explicitly requests {@code children}, loading
     * them lazily from the content tree.</p>
     */
    @SchemaMapping(typeName = "ContentNode", field = "children")
    public List<Map<String, Object>> contentNodeChildren(Map<String, Object> node) {
        String path = (String) node.get("path");
        if (path == null) return List.of();

        return nodeService.getChildren(path).stream()
                .map(child -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("path", child.getPath());
                    map.put("name", child.getName());
                    map.put("resourceType", child.getResourceType());
                    map.put("properties", child.getProperties());
                    map.put("status", child.getStatus() != null ? child.getStatus().name() : null);
                    map.put("version", child.getVersion());
                    map.put("locale", child.getLocale());
                    map.put("siteId", child.getSiteId());
                    return map;
                })
                .toList();
    }

    // -------------------------------------------------------------------------
    // Asset.renditions
    // -------------------------------------------------------------------------

    /**
     * Maps {@link AssetRendition} entities to the {@code Rendition} GraphQL type.
     *
     * <p>The entity uses {@code renditionKey} and {@code storageKey} while the
     * GraphQL schema uses {@code key} and {@code url} respectively. This resolver
     * performs the field name translation.</p>
     */
    @SchemaMapping(typeName = "Asset", field = "renditions")
    public List<Map<String, Object>> assetRenditions(
            com.flexcms.core.model.Asset asset) {
        return asset.getRenditions().stream()
                .map(r -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("key", r.getRenditionKey());
                    map.put("url", r.getStorageKey()); // storageKey serves as the URL/path
                    map.put("width", r.getWidth());
                    map.put("height", r.getHeight());
                    map.put("format", r.getFormat());
                    return map;
                })
                .toList();
    }

    // -------------------------------------------------------------------------
    // ComponentDefinition field name translation
    // -------------------------------------------------------------------------

    /**
     * Maps {@link ComponentDefinition#getGroupName()} to the {@code group} field.
     * The entity uses {@code groupName} but the schema exposes {@code group}.
     */
    @SchemaMapping(typeName = "ComponentDefinition", field = "group")
    public String componentDefinitionGroup(ComponentDefinition def) {
        return def.getGroupName();
    }

    /**
     * Maps {@link ComponentDefinition#isContainer()} to the {@code isContainer} field.
     * Spring GraphQL resolves boolean getters by convention ({@code isXxx()}), but
     * the field is stored as {@code container} internally — this explicit resolver
     * guarantees the correct mapping without relying on naming conventions.
     */
    @SchemaMapping(typeName = "ComponentDefinition", field = "isContainer")
    public boolean componentDefinitionIsContainer(ComponentDefinition def) {
        return def.isContainer();
    }
}
