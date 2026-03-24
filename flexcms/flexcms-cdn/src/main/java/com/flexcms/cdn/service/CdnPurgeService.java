package com.flexcms.cdn.service;

import com.flexcms.plugin.spi.CdnProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Orchestrates CDN purge operations across all registered CDN providers.
 */
@Service
public class CdnPurgeService {

    private static final Logger log = LoggerFactory.getLogger(CdnPurgeService.class);

    @Autowired(required = false)
    private List<CdnProvider> cdnProviders = new ArrayList<>();

    /**
     * Purge specific URLs from all CDN providers.
     */
    @Async
    public void purgeUrls(List<String> urls) {
        if (urls == null || urls.isEmpty()) return;
        log.info("Purging {} URLs from CDN", urls.size());
        for (CdnProvider provider : cdnProviders) {
            try {
                provider.purgeUrls(urls);
                log.debug("Purged URLs via {}", provider.getProviderName());
            } catch (Exception e) {
                log.error("CDN purge failed for provider {}: {}", provider.getProviderName(), e.getMessage());
            }
        }
    }

    /**
     * Purge path patterns from all CDN providers.
     */
    @Async
    public void purgePaths(List<String> pathPatterns) {
        if (pathPatterns == null || pathPatterns.isEmpty()) return;
        log.info("Purging {} path patterns from CDN", pathPatterns.size());
        for (CdnProvider provider : cdnProviders) {
            try {
                provider.purgePaths(pathPatterns);
            } catch (Exception e) {
                log.error("CDN path purge failed for {}: {}", provider.getProviderName(), e.getMessage());
            }
        }
    }

    /**
     * Purge all content for a site.
     */
    @Async
    public void purgeAll(String siteId) {
        log.info("Purging all CDN cache for site: {}", siteId);
        for (CdnProvider provider : cdnProviders) {
            try {
                provider.purgeAll(siteId);
            } catch (Exception e) {
                log.error("CDN full purge failed for {}: {}", provider.getProviderName(), e.getMessage());
            }
        }
    }

    /**
     * Purge by surrogate keys (tag-based invalidation).
     */
    @Async
    public void purgeSurrogateKeys(List<String> keys) {
        if (keys == null || keys.isEmpty()) return;
        log.info("Purging {} surrogate keys from CDN", keys.size());
        for (CdnProvider provider : cdnProviders) {
            try {
                provider.purgeSurrogateKeys(keys);
            } catch (Exception e) {
                log.error("CDN surrogate key purge failed for {}: {}", provider.getProviderName(), e.getMessage());
            }
        }
    }

    /**
     * Check if any CDN providers are configured.
     */
    public boolean isEnabled() {
        return !cdnProviders.isEmpty();
    }
}

