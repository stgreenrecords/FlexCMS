package com.flexcms.headless.graphql;

import com.flexcms.core.model.Asset;
import com.flexcms.core.model.ComponentDefinition;
import com.flexcms.core.model.ContentNode;
import com.flexcms.core.repository.AssetRepository;
import com.flexcms.core.service.ComponentRegistry;
import com.flexcms.core.service.ContentDeliveryService;
import com.flexcms.core.service.ContentNodeService;
import com.flexcms.plugin.model.RenderContext;
import com.flexcms.search.service.SearchIndexService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.*;

/**
 * GraphQL query resolvers for the FlexCMS headless API.
 */
@Controller
public class ContentQueryResolver {

    @Autowired
    private ContentNodeService nodeService;

    @Autowired
    private ContentDeliveryService deliveryService;

    @Autowired
    private ComponentRegistry componentRegistry;

    @Autowired
    private SearchIndexService searchService;

    @Autowired
    private AssetRepository assetRepository;

    @QueryMapping
    public Map<String, Object> page(@Argument String path,
                                     @Argument String site,
                                     @Argument String locale) {
        String contentPath = path.startsWith("content.") ? path : path.replace("/", ".");
        RenderContext ctx = new RenderContext(site,
                locale != null ? Locale.forLanguageTag(locale) : Locale.ENGLISH,
                path, "publish");

        return deliveryService.renderPage(contentPath, ctx);
    }

    @QueryMapping
    public Map<String, Object> node(@Argument String path) {
        String contentPath = path.replace("/", ".");
        return nodeService.getByPath(contentPath)
                .map(this::nodeToMap)
                .orElse(null);
    }

    @QueryMapping
    public SearchIndexService.SearchResult search(@Argument String query,
                                                    @Argument String site,
                                                    @Argument String locale,
                                                    @Argument Integer limit) {
        int pageSize = limit != null ? limit : 20;
        return searchService.search(query, site, locale, PageRequest.of(0, pageSize));
    }

    @QueryMapping
    public List<Map<String, Object>> navigation(@Argument String site,
                                                  @Argument String locale,
                                                  @Argument Integer depth) {
        return deliveryService.buildNavigation(site, locale, depth != null ? depth : 3);
    }

    @QueryMapping
    public Asset asset(@Argument String id) {
        return assetRepository.findById(UUID.fromString(id)).orElse(null);
    }

    @QueryMapping
    public List<ComponentDefinition> components() {
        return componentRegistry.getAllDefinitions();
    }

    private Map<String, Object> nodeToMap(ContentNode node) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("path", node.getPath());
        map.put("name", node.getName());
        map.put("resourceType", node.getResourceType());
        map.put("properties", node.getProperties());
        map.put("status", node.getStatus() != null ? node.getStatus().name() : null);
        map.put("version", node.getVersion());
        map.put("locale", node.getLocale());
        map.put("siteId", node.getSiteId());
        return map;
    }
}

