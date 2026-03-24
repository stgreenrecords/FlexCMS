package com.flexcms.plugin.spi;

import java.util.List;

/**
 * SPI for CDN provider integration.
 * Implement for CloudFront, Cloudflare, Fastly, Akamai, etc.
 */
public interface CdnProvider {

    String getProviderName();

    void purgeUrls(List<String> urls);

    void purgePaths(List<String> pathPatterns);

    void purgeAll(String siteId);

    void purgeSurrogateKeys(List<String> keys);
}
