# Caching Strategy & Cache Invalidation

## 1. Multi-Layer Cache Architecture

```
Request Flow:

[Client Browser]
     |
     | L0: Browser Cache (Cache-Control headers)
     v
[CDN Edge]
     |
     | L1: CDN Cache (Surrogate-Control / s-maxage)
     v
[Load Balancer]
     |
     v
[Application Server]
     |
     | L2: Redis Cache (shared across instances)
     | L3: Local In-Memory Cache (Caffeine, per-instance)
     v
[Database / Elasticsearch / S3]
```

---

## 2. Cache Layer Details

### 2.1 L0 - Browser Cache

Controlled via `Cache-Control` response headers:

```java
@Component
public class CacheControlFilter implements Filter {

    @Autowired
    private CachePolicy cachePolicy;

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
        throws IOException, ServletException {

        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;

        chain.doFilter(request, response);

        String path = request.getRequestURI();
        CacheDirective directive = cachePolicy.resolve(path, request);

        response.setHeader("Cache-Control", directive.toCacheControlHeader());

        if (directive.getEtag() != null) {
            response.setHeader("ETag", directive.getEtag());
        }

        if (directive.getVary() != null) {
            response.setHeader("Vary", directive.getVary());
        }
    }
}

@Service
public class CachePolicy {

    public CacheDirective resolve(String path, HttpServletRequest request) {
        // Static assets (versioned) -> immutable, 1 year
        if (path.matches("/static/.*\\.[a-f0-9]{8}\\..*")) {
            return CacheDirective.builder()
                .cacheControl("public, max-age=31536000, immutable")
                .build();
        }

        // DAM renditions (versioned via query param) -> long cache
        if (path.startsWith("/dam/renditions/")) {
            return CacheDirective.builder()
                .cacheControl("public, max-age=2592000, s-maxage=31536000") // 30d browser, 1yr CDN
                .vary("Accept")  // WebP/AVIF negotiation
                .build();
        }

        // HTML pages -> short browser cache, longer CDN cache
        if (request.getHeader("Accept") != null &&
            request.getHeader("Accept").contains("text/html")) {
            return CacheDirective.builder()
                .cacheControl("public, max-age=300, s-maxage=3600, stale-while-revalidate=86400")
                .vary("Accept-Language, X-FlexCMS-Site")
                .build();
        }

        // API responses -> moderate cache
        if (path.startsWith("/api/content/")) {
            return CacheDirective.builder()
                .cacheControl("public, max-age=60, s-maxage=300, stale-while-revalidate=3600")
                .vary("Accept, Accept-Language, X-FlexCMS-Site, X-FlexCMS-Locale")
                .build();
        }

        // Author environment -> no cache
        if (path.startsWith("/api/author/") || path.startsWith("/admin/")) {
            return CacheDirective.builder()
                .cacheControl("no-store, no-cache, must-revalidate")
                .build();
        }

        // Default
        return CacheDirective.builder()
            .cacheControl("public, max-age=60")
            .build();
    }
}
```

### 2.2 L1 - CDN Cache

Covered in [06_HEADLESS_API_AND_CDN.md](06_HEADLESS_API_AND_CDN.md). Key points:
- `s-maxage` controls CDN TTL independently of browser TTL
- `Surrogate-Key` headers enable tag-based purge
- `stale-while-revalidate` keeps serving stale content while CDN revalidates

### 2.3 L2 - Redis Distributed Cache

```java
@Configuration
@EnableCaching
public class RedisCacheConfig {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory) {
        // Default config
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(30))
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                    new GenericJackson2JsonRedisSerializer()
                )
            )
            .disableCachingNullValues();

        // Per-cache TTL configuration
        Map<String, RedisCacheConfiguration> cacheConfigs = Map.of(
            // Content nodes: 1 hour (invalidated on publish)
            "content-nodes", defaultConfig.entryTtl(Duration.ofHours(1)),

            // Page renders: 30 min (invalidated on publish)
            "page-renders", defaultConfig.entryTtl(Duration.ofMinutes(30)),

            // Headless API: 5 min
            "headless-pages", defaultConfig.entryTtl(Duration.ofMinutes(5)),

            // Navigation trees: 1 hour
            "navigation", defaultConfig.entryTtl(Duration.ofHours(1)),

            // Component models: 30 min
            "component-models", defaultConfig.entryTtl(Duration.ofMinutes(30)),

            // Site resolution: 24 hours (rarely changes)
            "site-resolution", defaultConfig.entryTtl(Duration.ofHours(24)),

            // DAM metadata: 1 hour
            "dam-metadata", defaultConfig.entryTtl(Duration.ofHours(1)),

            // Search results: 5 min
            "search-results", defaultConfig.entryTtl(Duration.ofMinutes(5)),

            // i18n dictionaries: 24 hours
            "i18n", defaultConfig.entryTtl(Duration.ofHours(24)),

            // External API responses (product catalog, etc): 15 min
            "external-api", defaultConfig.entryTtl(Duration.ofMinutes(15))
        );

        return RedisCacheManager.builder(factory)
            .cacheDefaults(defaultConfig)
            .withInitialCacheConfigurations(cacheConfigs)
            .build();
    }
}
```

### 2.4 L3 - Local In-Memory Cache (Caffeine)

For hot-path data that shouldn't incur Redis network latency:

```java
@Configuration
public class LocalCacheConfig {

    @Bean
    public CacheManager localCacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager();
        manager.setCacheSpecification("maximumSize=10000,expireAfterWrite=5m");
        return manager;
    }
}

@Service
public class ContentTreeCache {

    // L3: Local Caffeine cache (5 min, per-instance)
    private final Cache<String, ContentNode> localCache = Caffeine.newBuilder()
        .maximumSize(10_000)
        .expireAfterWrite(Duration.ofMinutes(5))
        .recordStats()
        .build();

    // L2: Redis (shared, longer TTL)
    @Autowired
    private RedisTemplate<String, ContentNode> redisTemplate;

    public ContentNode getNode(String path) {
        // Try L3 local cache first
        ContentNode node = localCache.getIfPresent(path);
        if (node != null) return node;

        // Try L2 Redis
        String redisKey = "node:" + path;
        node = redisTemplate.opsForValue().get(redisKey);
        if (node != null) {
            localCache.put(path, node); // Promote to L3
            return node;
        }

        // L2/L3 miss: fetch from database
        node = nodeRepository.findByPath(path).orElse(null);
        if (node != null) {
            redisTemplate.opsForValue().set(redisKey, node, Duration.ofHours(1));
            localCache.put(path, node);
        }

        return node;
    }
}
```

---

## 3. Cache Invalidation Strategy

### 3.1 Invalidation Events

```java
public enum CacheInvalidationScope {
    NODE,           // Single content node
    PAGE,           // Page + all its component children
    SUBTREE,        // Page + all descendant pages
    SITE,           // Entire site
    TEMPLATE,       // All pages using a template
    COMPONENT_TYPE, // All pages containing a component type
    ASSET,          // Asset + all pages referencing it
    NAVIGATION,     // Site navigation cache
    I18N,           // Translation dictionary
    ALL             // Nuclear: everything
}
```

### 3.2 Cache Invalidation Service

```java
@Service
public class CacheInvalidationService {

    @Autowired
    private RedisCacheManager redisCacheManager;

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    @Autowired
    private CdnPurgeService cdnPurgeService;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    /**
     * Central invalidation entry point.
     * Invalidates L2 (Redis), triggers L3 (local) invalidation via event,
     * and triggers L1 (CDN) purge.
     */
    @Async
    public void invalidate(CacheInvalidationRequest request) {

        switch (request.getScope()) {
            case NODE -> invalidateNode(request.getPath());
            case PAGE -> invalidatePage(request.getPath());
            case SUBTREE -> invalidateSubtree(request.getPath());
            case SITE -> invalidateSite(request.getSiteId());
            case TEMPLATE -> invalidateTemplate(request.getTemplateName());
            case COMPONENT_TYPE -> invalidateComponentType(request.getComponentType());
            case ASSET -> invalidateAsset(request.getAssetId());
            case NAVIGATION -> invalidateNavigation(request.getSiteId(), request.getLocale());
            case ALL -> invalidateAll();
        }

        // Notify other app instances to clear their L3 local caches
        publishInvalidationEvent(request);

        // Trigger CDN purge
        if (request.isPurgeCdn()) {
            cdnPurgeService.purgeForContentChange(request.getPath(), request.getSiteId());
        }
    }

    private void invalidateNode(String path) {
        // Clear L2 Redis
        redisTemplate.delete("node:" + path);
        redisTemplate.delete("model:" + path);
    }

    private void invalidatePage(String path) {
        // Clear page render cache
        redisTemplate.delete("page-render:" + path);
        redisTemplate.delete("headless:" + path);

        // Clear all component caches under this page
        Set<String> componentKeys = redisTemplate.keys("model:" + path + ".*");
        if (componentKeys != null && !componentKeys.isEmpty()) {
            redisTemplate.delete(componentKeys);
        }
    }

    private void invalidateSubtree(String rootPath) {
        // Use Redis SCAN to find all keys matching the path prefix
        Set<String> keys = new HashSet<>();
        ScanOptions options = ScanOptions.scanOptions()
            .match("*:" + rootPath + "*")
            .count(1000)
            .build();

        try (Cursor<String> cursor = redisTemplate.scan(options)) {
            cursor.forEachRemaining(keys::add);
        }

        if (!keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }

    private void invalidateSite(String siteId) {
        Set<String> keys = new HashSet<>();
        ScanOptions options = ScanOptions.scanOptions()
            .match("*:content." + siteId + ".*")
            .count(1000)
            .build();

        try (Cursor<String> cursor = redisTemplate.scan(options)) {
            cursor.forEachRemaining(keys::add);
        }

        if (!keys.isEmpty()) {
            redisTemplate.delete(keys);
        }

        // Also clear site-level caches
        redisTemplate.delete("navigation:" + siteId + ":*");
        redisTemplate.delete("site-resolution:" + siteId);
    }

    private void invalidateNavigation(String siteId, String locale) {
        String pattern = "navigation:" + siteId + ":" + (locale != null ? locale : "*");
        Set<String> keys = redisTemplate.keys(pattern);
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }

    /**
     * Publish invalidation event via Redis Pub/Sub
     * so all app instances clear their L3 local caches.
     */
    private void publishInvalidationEvent(CacheInvalidationRequest request) {
        redisTemplate.convertAndSend(
            "flexcms:cache-invalidation",
            objectMapper.writeValueAsString(request)
        );
    }
}
```

### 3.3 L3 Local Cache Invalidation (Cross-Instance)

```java
@Component
public class LocalCacheInvalidationListener {

    @Autowired
    private ContentTreeCache contentTreeCache;

    @Autowired
    private CaffeineCacheManager localCacheManager;

    /**
     * Listen for invalidation events from Redis Pub/Sub.
     * When another instance invalidates Redis (L2), we also need
     * to clear our local Caffeine cache (L3).
     */
    @RedisListener(channel = "flexcms:cache-invalidation")
    public void onInvalidation(CacheInvalidationRequest request) {
        switch (request.getScope()) {
            case NODE -> contentTreeCache.evictLocal(request.getPath());
            case PAGE -> contentTreeCache.evictLocalSubtree(request.getPath());
            case SITE -> localCacheManager.getCache("site-" + request.getSiteId()).clear();
            case ALL -> localCacheManager.getCacheNames()
                .forEach(name -> localCacheManager.getCache(name).clear());
        }
    }
}
```

### 3.4 Automatic Invalidation on Replication

```java
@Component
public class ReplicationCacheHook {

    @Autowired
    private CacheInvalidationService cacheService;

    /**
     * Automatically invalidate caches when content is replicated to publish.
     */
    @EventListener
    public void onContentReplicated(ContentReplicatedEvent event) {
        CacheInvalidationRequest request = CacheInvalidationRequest.builder()
            .scope(event.getType() == ReplicationType.TREE
                ? CacheInvalidationScope.SUBTREE
                : CacheInvalidationScope.PAGE)
            .path(event.getPath())
            .siteId(event.getSiteId())
            .locale(event.getLocale())
            .purgeCdn(true)
            .build();

        cacheService.invalidate(request);
    }

    @EventListener
    public void onAssetReplicated(AssetReplicatedEvent event) {
        cacheService.invalidate(CacheInvalidationRequest.builder()
            .scope(CacheInvalidationScope.ASSET)
            .assetId(event.getAssetId())
            .purgeCdn(true)
            .build());
    }
}
```

---

## 4. Cache Warming

```java
@Service
public class CacheWarmingService {

    @Autowired
    private ContentDeliveryService deliveryService;

    @Autowired
    private ContentNodeRepository nodeRepository;

    /**
     * Pre-warm caches after deployment or full invalidation.
     * Prioritizes high-traffic pages.
     */
    @Async
    public void warmCaches(String siteId) {
        // 1. Warm homepage and top-level pages
        List<ContentNode> topPages = nodeRepository.findTopLevelPages(siteId);
        for (ContentNode page : topPages) {
            deliveryService.renderPageAsJson(page.getPath(), buildContext(page));
        }

        // 2. Warm navigation
        Site site = siteRepository.findById(siteId).orElseThrow();
        for (String locale : site.getSupportedLocales()) {
            deliveryService.buildNavigation(siteId, locale, 3);
        }

        // 3. Warm high-traffic pages from analytics
        List<String> hotPages = analyticsService.getTopPages(siteId, 100);
        for (String path : hotPages) {
            deliveryService.renderPageAsJson(path, buildContext(siteId));
        }
    }

    /**
     * Scheduled warm: keep caches fresh before they expire.
     */
    @Scheduled(fixedRate = 1800000) // Every 30 min
    public void scheduledWarm() {
        List<String> activeSites = siteRepository.findAllActiveSiteIds();
        for (String siteId : activeSites) {
            warmCaches(siteId);
        }
    }
}
```

---

## 5. Cache Monitoring

```java
@RestController
@RequestMapping("/api/admin/cache")
@PreAuthorize("hasRole('ADMIN')")
public class CacheMonitorController {

    @GetMapping("/stats")
    public CacheStats getStats() {
        return CacheStats.builder()
            .redis(getRedisStats())
            .caffeine(getCaffeineStats())
            .hitRate(calculateOverallHitRate())
            .build();
    }

    @PostMapping("/invalidate")
    public void invalidate(@RequestBody CacheInvalidationRequest request) {
        cacheInvalidationService.invalidate(request);
    }

    @PostMapping("/warm/{siteId}")
    public void warmCache(@PathVariable String siteId) {
        cacheWarmingService.warmCaches(siteId);
    }

    @DeleteMapping("/all")
    public void clearAll() {
        cacheInvalidationService.invalidate(
            CacheInvalidationRequest.builder().scope(CacheInvalidationScope.ALL).build()
        );
    }
}
```
