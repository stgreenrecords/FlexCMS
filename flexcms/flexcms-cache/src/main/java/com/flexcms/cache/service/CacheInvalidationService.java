package com.flexcms.cache.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Set;

/**
 * Central service for cache invalidation across all cache layers.
 */
@Service
public class CacheInvalidationService {

    private static final Logger log = LoggerFactory.getLogger(CacheInvalidationService.class);

    @Autowired
    private CacheManager cacheManager;

    @Autowired(required = false)
    private RedisTemplate<String, Object> redisTemplate;

    /**
     * Invalidate all cache entries related to a content path.
     */
    public void invalidate(String contentPath) {
        log.debug("Invalidating caches for path: {}", contentPath);

        // Invalidate known caches that may contain this path
        evictFromCache("content-nodes", contentPath);
        evictFromCache("page-renders", contentPath);
        evictFromCache("headless-pages", contentPath);
        evictFromCache("component-models", contentPath);

        // Invalidate navigation (site-wide)
        clearCache("navigation");
    }

    /**
     * Invalidate caches matching a site and path pattern.
     */
    public void invalidatePatterns(String siteId, String pathPrefix) {
        log.debug("Invalidating cache patterns for site={}, pathPrefix={}", siteId, pathPrefix);

        if (redisTemplate != null) {
            // Use Redis SCAN to find and delete matching keys
            List<String> patterns = List.of(
                    "content-nodes::" + pathPrefix + "*",
                    "page-renders::" + pathPrefix + "*",
                    "headless-pages::" + pathPrefix + "*",
                    "component-models::" + pathPrefix + "*"
            );

            for (String pattern : patterns) {
                Set<String> keys = redisTemplate.keys(pattern);
                if (keys != null && !keys.isEmpty()) {
                    redisTemplate.delete(keys);
                    log.debug("Deleted {} Redis keys matching pattern: {}", keys.size(), pattern);
                }
            }
        }

        // Always clear navigation for the site
        evictFromCache("navigation", siteId);
    }

    /**
     * Invalidate all caches for a site (e.g., during full site replication).
     */
    public void invalidateSite(String siteId) {
        log.info("Invalidating all caches for site: {}", siteId);
        clearCache("content-nodes");
        clearCache("page-renders");
        clearCache("headless-pages");
        clearCache("navigation");
        clearCache("component-models");
        evictFromCache("site-resolution", siteId);
    }

    /**
     * Invalidate i18n dictionary cache for a locale.
     */
    public void invalidateI18n(String siteId, String locale) {
        evictFromCache("i18n", siteId + ":" + locale);
    }

    /**
     * Invalidate DAM metadata cache for an asset.
     */
    public void invalidateAsset(String assetPath) {
        evictFromCache("dam-metadata", assetPath);
    }

    /**
     * Clear an entire named cache.
     */
    public void clearCache(String cacheName) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache != null) {
            cache.clear();
            log.debug("Cleared cache: {}", cacheName);
        }
    }

    /**
     * Evict a specific key from a named cache.
     */
    public void evictFromCache(String cacheName, String key) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache != null) {
            cache.evict(key);
        }
    }

    /**
     * Get all cache names managed by the system.
     */
    public Collection<String> getCacheNames() {
        return cacheManager.getCacheNames();
    }
}

