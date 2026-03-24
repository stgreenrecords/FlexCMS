package com.flexcms.cdn.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Generates Surrogate-Key header values for tag-based CDN invalidation.
 */
@Service
public class SurrogateKeyService {

    /**
     * Generate surrogate keys for a content path.
     */
    public List<String> generateKeys(String contentPath, String siteId, String locale) {
        List<String> keys = new ArrayList<>();

        // Path-based key
        keys.add("path:" + contentPath.replace(".", "/"));

        // Site key
        if (siteId != null) {
            keys.add("site:" + siteId);
        }

        // Locale key
        if (locale != null) {
            keys.add("locale:" + siteId + ":" + locale);
        }

        // Page key (for navigation invalidation)
        keys.add("page:" + contentPath);

        return keys;
    }

    /**
     * Format keys into a Surrogate-Key header value.
     */
    public String toHeaderValue(List<String> keys) {
        return String.join(" ", keys);
    }
}

