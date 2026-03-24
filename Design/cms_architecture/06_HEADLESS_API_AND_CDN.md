# Headless API & CDN Integration

## 1. Headless API Design

FlexCMS is headless-first: all content is accessible via structured APIs, independent of the rendering layer.

### 1.1 REST API

```
Base URL: /api/content/v1

Endpoints:
  GET  /pages/{path}                     # Get page with full component tree
  GET  /pages/{path}/children            # Get child pages (navigation)
  GET  /nodes/{path}                     # Get raw content node
  GET  /nodes/{path}/descendants         # Get subtree
  GET  /search?q={query}&site={siteId}   # Full-text search
  GET  /navigation/{siteId}/{locale}     # Site navigation tree
  GET  /fragments/{fragmentId}           # Content fragment by ID
  GET  /tags/{siteId}                    # Tag taxonomy

Headers:
  X-FlexCMS-Site: corporate              # Site context (or from domain)
  X-FlexCMS-Locale: en                   # Locale override
  Accept: application/json               # Always JSON for headless
```

### 1.2 REST Page Response

```json
GET /api/content/v1/pages/content/corporate/en/homepage

{
  "page": {
    "path": "/content/corporate/en/homepage",
    "title": "Welcome to Corporate",
    "description": "Corporate homepage",
    "template": "marketing-landing-page",
    "locale": "en",
    "lastModified": "2025-01-15T10:30:00Z",
    "seo": {
      "title": "Corporate - Home",
      "description": "Welcome to our corporate website",
      "canonicalUrl": "https://www.corporate.com/",
      "ogImage": "https://assets.cdn.example.com/renditions/uuid/og-image.jpg",
      "robots": "index,follow"
    }
  },
  "components": [
    {
      "name": "header",
      "resourceType": "flexcms/shared-header",
      "data": {
        "logo": "https://assets.cdn.example.com/dam/corporate/logos/logo.svg",
        "navigation": [
          {"title": "Home", "url": "/", "active": true},
          {"title": "About", "url": "/about", "children": [
            {"title": "Team", "url": "/about/team"},
            {"title": "Careers", "url": "/about/careers"}
          ]},
          {"title": "Products", "url": "/products"},
          {"title": "Contact", "url": "/contact"}
        ]
      }
    },
    {
      "name": "hero",
      "resourceType": "flexcms/container",
      "children": [
        {
          "name": "hero-banner",
          "resourceType": "myapp/hero-banner",
          "data": {
            "title": "Innovate With Us",
            "subtitle": "<p>Building the future, together</p>",
            "imageUrl": "https://assets.cdn.example.com/renditions/uuid/hero-desktop.webp",
            "imageMobileUrl": "https://assets.cdn.example.com/renditions/uuid/hero-mobile.webp",
            "ctaLabel": "Learn More",
            "ctaUrl": "/about",
            "theme": "dark"
          }
        }
      ]
    },
    {
      "name": "main",
      "resourceType": "flexcms/container",
      "children": [
        {
          "name": "text-1",
          "resourceType": "flexcms/rich-text",
          "data": {
            "content": "<h2>Our Mission</h2><p>We believe in...</p>"
          }
        },
        {
          "name": "product-carousel-1",
          "resourceType": "myapp/product-carousel",
          "data": {
            "products": [
              {"name": "Product A", "price": 99.99, "image": "..."},
              {"name": "Product B", "price": 149.99, "image": "..."}
            ],
            "layout": "carousel"
          }
        }
      ]
    }
  ],
  "_links": {
    "self": "/api/content/v1/pages/content/corporate/en/homepage",
    "children": "/api/content/v1/pages/content/corporate/en/homepage/children",
    "parent": null,
    "alternateLanguages": {
      "fr": "/api/content/v1/pages/content/corporate/fr/homepage",
      "de": "/api/content/v1/pages/content/corporate/de/homepage"
    }
  }
}
```

### 1.3 GraphQL API

```graphql
type Query {
  page(path: String!, site: String, locale: String): Page
  pages(site: String!, locale: String, template: String, limit: Int, offset: Int): PageConnection
  node(path: String!): ContentNode
  search(query: String!, site: String, locale: String, limit: Int): SearchResult
  navigation(site: String!, locale: String!, depth: Int): [NavigationItem!]!
  asset(id: ID!): Asset
  assets(folder: String, tags: [String], limit: Int): AssetConnection
}

type Page {
  path: String!
  title: String!
  description: String
  template: String!
  locale: String!
  lastModified: DateTime!
  seo: SeoData
  components: [Component!]!
  children(limit: Int, offset: Int): PageConnection
  alternateLanguages: [LanguageAlternate!]!
}

type Component {
  name: String!
  resourceType: String!
  data: JSON!          # Flexible JSON from ComponentModel
  children: [Component!]
}

type Asset {
  id: ID!
  path: String!
  title: String
  mimeType: String!
  width: Int
  height: Int
  rendition(profile: String!): RenditionUrl
  renditions: [Rendition!]!
  tags: [String!]!
  metadata: JSON
}

type RenditionUrl {
  url: String!
  width: Int
  height: Int
  format: String
}

type SearchResult {
  totalCount: Int!
  items: [SearchHit!]!
}

type SearchHit {
  path: String!
  title: String!
  excerpt: String
  score: Float!
  type: String!
}

type NavigationItem {
  title: String!
  url: String!
  active: Boolean
  children: [NavigationItem!]
}
```

### 1.4 GraphQL Query Example

```graphql
query GetHomepage {
  page(path: "/content/corporate/en/homepage") {
    title
    seo {
      title
      ogImage
    }
    components {
      name
      resourceType
      data
      children {
        name
        resourceType
        data
      }
    }
    alternateLanguages {
      locale
      path
    }
  }
  navigation(site: "corporate", locale: "en", depth: 2) {
    title
    url
    children {
      title
      url
    }
  }
}
```

### 1.5 Content Delivery Controller

```java
@RestController
@RequestMapping("/api/content/v1")
public class HeadlessContentController {

    @Autowired
    private ContentDeliveryService deliveryService;

    @Autowired
    private SiteResolver siteResolver;

    @GetMapping("/pages/**")
    @Cacheable(value = "headless-pages", key = "#path + ':' + #locale")
    public ResponseEntity<PageResponse> getPage(
        HttpServletRequest request,
        @RequestHeader(value = "X-FlexCMS-Site", required = false) String siteHeader,
        @RequestHeader(value = "X-FlexCMS-Locale", required = false) String localeHeader
    ) {
        String path = extractPath(request);
        SiteContext ctx = siteResolver.resolve(request, siteHeader, localeHeader);

        PageResponse page = deliveryService.renderPageAsJson(path, ctx);

        return ResponseEntity.ok()
            .header("Cache-Control", "public, max-age=300, s-maxage=3600")
            .header("Surrogate-Key", buildSurrogateKeys(page))
            .header("ETag", page.getEtag())
            .body(page);
    }

    @GetMapping("/search")
    public SearchResponse search(
        @RequestParam String q,
        @RequestParam(required = false) String site,
        @RequestParam(required = false) String locale,
        @RequestParam(defaultValue = "0") int offset,
        @RequestParam(defaultValue = "20") int limit
    ) {
        return deliveryService.search(q, site, locale, offset, limit);
    }

    @GetMapping("/navigation/{siteId}/{locale}")
    @Cacheable(value = "navigation", key = "#siteId + ':' + #locale")
    public NavigationResponse getNavigation(
        @PathVariable String siteId,
        @PathVariable String locale,
        @RequestParam(defaultValue = "3") int depth
    ) {
        return deliveryService.buildNavigation(siteId, locale, depth);
    }
}
```

---

## 2. CDN Integration

### 2.1 CDN Provider Abstraction

```java
public interface CdnProvider {
    String getProviderName();
    void purgeUrls(List<String> urls);
    void purgePaths(List<String> pathPatterns);  // Wildcard: "/products/*"
    void purgeAll(String siteId);
    void purgeSurrogateKeys(List<String> keys);
    CdnStatus getStatus();
}

@Service
@ConditionalOnProperty(name = "flexcms.cdn.provider", havingValue = "cloudfront")
public class CloudFrontCdnProvider implements CdnProvider {

    @Autowired
    private CloudFrontClient cloudFrontClient;

    @Value("${flexcms.cdn.cloudfront.distribution-id}")
    private String distributionId;

    @Override
    public String getProviderName() { return "cloudfront"; }

    @Override
    public void purgeUrls(List<String> urls) {
        CreateInvalidationRequest request = CreateInvalidationRequest.builder()
            .distributionId(distributionId)
            .invalidationBatch(InvalidationBatch.builder()
                .paths(Paths.builder()
                    .items(urls)
                    .quantity(urls.size())
                    .build())
                .callerReference(UUID.randomUUID().toString())
                .build())
            .build();

        cloudFrontClient.createInvalidation(request);
    }

    @Override
    public void purgePaths(List<String> patterns) {
        purgeUrls(patterns); // CloudFront supports wildcards natively
    }

    @Override
    public void purgeAll(String siteId) {
        purgeUrls(List.of("/*"));
    }

    @Override
    public void purgeSurrogateKeys(List<String> keys) {
        // CloudFront doesn't support tag-based purge natively
        // Use CloudFront Functions + Lambda@Edge for this
        throw new UnsupportedOperationException("Use path-based purge for CloudFront");
    }
}

@Service
@ConditionalOnProperty(name = "flexcms.cdn.provider", havingValue = "cloudflare")
public class CloudflareCdnProvider implements CdnProvider {

    @Value("${flexcms.cdn.cloudflare.zone-id}")
    private String zoneId;

    @Value("${flexcms.cdn.cloudflare.api-token}")
    private String apiToken;

    @Override
    public String getProviderName() { return "cloudflare"; }

    @Override
    public void purgeUrls(List<String> urls) {
        // POST /zones/{zone_id}/purge_cache {"files": [...]}
        webClient.post()
            .uri("/zones/{zoneId}/purge_cache", zoneId)
            .header("Authorization", "Bearer " + apiToken)
            .bodyValue(Map.of("files", urls))
            .retrieve()
            .toBodilessEntity()
            .block();
    }

    @Override
    public void purgeSurrogateKeys(List<String> keys) {
        // Cloudflare Enterprise supports Cache-Tag purge
        webClient.post()
            .uri("/zones/{zoneId}/purge_cache", zoneId)
            .header("Authorization", "Bearer " + apiToken)
            .bodyValue(Map.of("tags", keys))
            .retrieve()
            .toBodilessEntity()
            .block();
    }
}

@Service
@ConditionalOnProperty(name = "flexcms.cdn.provider", havingValue = "fastly")
public class FastlyCdnProvider implements CdnProvider {

    @Override
    public String getProviderName() { return "fastly"; }

    @Override
    public void purgeSurrogateKeys(List<String> keys) {
        // Fastly excels at surrogate-key-based purge
        for (String key : keys) {
            webClient.post()
                .uri("/service/{serviceId}/purge/{key}", serviceId, key)
                .header("Fastly-Key", apiToken)
                .retrieve()
                .toBodilessEntity()
                .block();
        }
    }
}

@Service
@ConditionalOnProperty(name = "flexcms.cdn.provider", havingValue = "akamai")
public class AkamaiCdnProvider implements CdnProvider {

    @Override
    public String getProviderName() { return "akamai"; }

    @Override
    public void purgeUrls(List<String> urls) {
        // Akamai Fast Purge API
        // POST /ccu/v3/invalidate/url/{network}
    }

    @Override
    public void purgeSurrogateKeys(List<String> keys) {
        // POST /ccu/v3/invalidate/tag/{network}
    }
}
```

### 2.2 CDN Configuration

```yaml
flexcms:
  cdn:
    provider: cloudflare   # cloudfront | cloudflare | fastly | akamai
    enabled: true

    # Response headers for CDN caching
    cache-control:
      pages:
        default: "public, max-age=300, s-maxage=3600"      # 5min browser, 1hr CDN
        static-pages: "public, max-age=3600, s-maxage=86400" # 1hr browser, 24hr CDN
        dynamic: "public, max-age=60, s-maxage=300"          # 1min browser, 5min CDN
        api: "public, max-age=60, s-maxage=300"
      assets:
        immutable: "public, max-age=31536000, immutable"     # 1 year for versioned assets
        mutable: "public, max-age=86400, s-maxage=604800"

    # Domain mappings
    domains:
      content: "https://www.corporate.com"
      assets: "https://assets.corporate.com"
      api: "https://api.corporate.com"

    # Surrogate keys (for tag-based purge)
    surrogate-keys:
      enabled: true
      strategy: hierarchical  # page path segments become tags

    # Cloudflare-specific
    cloudflare:
      zone-id: "abc123"
      api-token: "${CLOUDFLARE_API_TOKEN}"

    # CloudFront-specific
    cloudfront:
      distribution-id: "EDFDVBD6EXAMPLE"
      region: "us-east-1"
```

### 2.3 Surrogate Key Strategy

Every response includes `Surrogate-Key` headers that enable granular cache purging:

```java
@Component
public class SurrogateKeyBuilder {

    /**
     * Build surrogate keys for a page response.
     * When any related content changes, we can purge by key.
     */
    public String buildKeys(PageResponse page) {
        Set<String> keys = new LinkedHashSet<>();

        // Page path segments (hierarchical)
        // /content/corporate/en/products/product-a
        // Keys: "site:corporate", "locale:en", "page:products", "page:products/product-a"
        keys.add("site:" + page.getSiteId());
        keys.add("locale:" + page.getLocale());
        keys.add("page:" + page.getPath());

        // Template key (purge all pages using this template)
        keys.add("template:" + page.getTemplate());

        // Component type keys (purge all pages containing this component type)
        for (ComponentData comp : page.getAllComponents()) {
            keys.add("component:" + comp.getResourceType());
        }

        // Asset reference keys (purge when asset changes)
        for (String assetId : page.getReferencedAssetIds()) {
            keys.add("asset:" + assetId);
        }

        return String.join(" ", keys);
    }
}
```

---

## 3. CDN Purge Service

```java
@Service
public class CdnPurgeService {

    @Autowired
    private CdnProvider cdnProvider;

    @Autowired
    private UrlMappingService urlMapping;

    /**
     * Called after content replication to purge affected CDN entries.
     */
    @Async
    public void purgeForContentChange(String contentPath, String siteId) {
        // Strategy 1: Surrogate-key purge (preferred - Fastly, Cloudflare Enterprise)
        if (cdnProvider.getProviderName().equals("fastly") ||
            cdnProvider.getProviderName().equals("cloudflare")) {
            List<String> keys = List.of(
                "page:" + contentPath,
                "site:" + siteId
            );
            cdnProvider.purgeSurrogateKeys(keys);
            return;
        }

        // Strategy 2: URL-based purge (CloudFront, Akamai, standard Cloudflare)
        List<String> publicUrls = urlMapping.getPublicUrlsForContent(contentPath);
        if (!publicUrls.isEmpty()) {
            cdnProvider.purgeUrls(publicUrls);
        }

        // Also purge API endpoints
        cdnProvider.purgePaths(List.of(
            "/api/content/v1/pages/" + contentPath,
            "/api/content/v1/pages/" + contentPath + "/*"
        ));
    }

    /**
     * Purge when a DAM asset is updated.
     */
    @Async
    public void purgeForAssetChange(UUID assetId, List<String> renditionKeys) {
        // Purge asset URLs
        List<String> assetUrls = renditionKeys.stream()
            .map(key -> "/dam/renditions/" + assetId + "/" + key)
            .collect(Collectors.toList());
        cdnProvider.purgeUrls(assetUrls);

        // Purge pages referencing this asset (via surrogate keys)
        cdnProvider.purgeSurrogateKeys(List.of("asset:" + assetId));
    }
}
```
