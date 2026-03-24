package com.flexcms.publish.service;

import com.flexcms.core.model.ContentNode;
import com.flexcms.core.service.ContentDeliveryService;
import com.flexcms.core.service.ContentNodeService;
import com.flexcms.multisite.model.SiteContext;
import com.flexcms.multisite.service.SiteResolver;
import com.flexcms.plugin.model.RenderContext;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * Resolves an incoming HTTP request URL to a content node in the tree.
 * Pipeline: URL → Site Resolution → Locale Resolution → Content Tree Lookup.
 */
@Service
public class PageResolver {

    private static final Logger log = LoggerFactory.getLogger(PageResolver.class);

    @Autowired
    private SiteResolver siteResolver;

    @Autowired
    private ContentNodeService nodeService;

    @Autowired
    private ContentDeliveryService deliveryService;

    /**
     * Resolve a request to a renderable page.
     */
    public Optional<ResolvedPage> resolve(HttpServletRequest request) {
        // 1. Resolve site context
        SiteContext siteContext = siteResolver.resolve(request);
        if (siteContext == null) {
            log.debug("No site context for request: {}", request.getRequestURI());
            return Optional.empty();
        }

        // 2. Build content path from URL
        String urlPath = request.getRequestURI();
        String contentPath = urlToContentPath(urlPath, siteContext);

        // 3. Lookup content node
        Optional<ContentNode> node = nodeService.getWithChildren(contentPath);
        if (node.isEmpty()) {
            // Try without trailing segment (homepage)
            contentPath = siteContext.getContentRoot().replace("/", ".").substring(1); // Strip leading /
            node = nodeService.getWithChildren(contentPath);
        }

        if (node.isEmpty()) {
            log.debug("Content not found for path: {}", contentPath);
            return Optional.empty();
        }

        // 4. Build render context
        RenderContext renderContext = new RenderContext(
                siteContext.getSiteId(),
                Locale.forLanguageTag(siteContext.getLocale()),
                request.getRequestURI(),
                "publish"
        );
        renderContext.setDomain(siteContext.getDomain());

        // 5. Build page data
        Map<String, Object> pageData = deliveryService.renderPage(node.get().getPath(), renderContext);

        return Optional.of(new ResolvedPage(node.get(), siteContext, renderContext, pageData));
    }

    private String urlToContentPath(String urlPath, SiteContext siteContext) {
        // Strip leading slash
        if (urlPath.startsWith("/")) urlPath = urlPath.substring(1);
        if (urlPath.isEmpty()) urlPath = "homepage";

        // Strip locale prefix if present
        String locale = siteContext.getLocale();
        if (urlPath.startsWith(locale + "/")) {
            urlPath = urlPath.substring(locale.length() + 1);
        }

        // Build full content tree path: content.{siteId}.{locale}.{urlSegments}
        String pathSegments = urlPath.replace("/", ".");
        return "content." + siteContext.getSiteId() + "." + locale + "." + pathSegments;
    }

    public record ResolvedPage(
            ContentNode node,
            SiteContext siteContext,
            RenderContext renderContext,
            Map<String, Object> pageData
    ) {}
}

