package com.flexcms.core.util;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * The public URL contract for DAM assets, in one place.
 *
 * <p>Content used to reference assets by the only URL the platform issued,
 * {@code /api/author/assets/{id}/content} — an author-only, role-guarded endpoint that
 * does not exist on the publish tier. A published page therefore rendered dead images
 * for every visitor ({@code R-REB-21-003}). The canonical form below is served by both
 * tiers ({@code AssetDeliveryController}); the legacy form is still recognised so content
 * authored before the change keeps working, and is rewritten on delivery rather than in
 * stored content (see {@code DEC-ECMS-002}).</p>
 *
 * <p>URLs are relative on purpose: each tier serves them for whatever host the client
 * called, so a draft preview against author and a live page against publish both resolve
 * without the content knowing which tier it is on.</p>
 */
public final class AssetUrls {

    /** Prefix of every canonical asset URL. Mirrors the path {@code SecurityConfig} permits. */
    public static final String CANONICAL_PREFIX = "/dam/renditions/";

    private static final String UUID_RE =
            "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";

    /** Rendition keys are lowercase words joined by hyphens ({@code web-small}, {@code og-image}). */
    public static final Pattern RENDITION_KEY = Pattern.compile("[a-z0-9]+(?:-[a-z0-9]+)*");

    /**
     * Legacy author streaming URL, relative or absolute. Group 1 is the whole matched URL
     * (for replacement), group 2 the id.
     */
    private static final Pattern LEGACY = Pattern.compile(
            "((?:https?://[^\\s\"'/]+)?/api/author/assets/(" + UUID_RE + ")/content)");

    /** Canonical URL; group 1 is the id. */
    private static final Pattern CANONICAL = Pattern.compile(
            Pattern.quote(CANONICAL_PREFIX) + "(" + UUID_RE + ")(?:/[a-z0-9-]+)?");

    private AssetUrls() {}

    /** Canonical URL of an asset's original binary. */
    public static String original(UUID assetId) {
        return CANONICAL_PREFIX + assetId;
    }

    /**
     * Canonical URL of a rendition. The delivery endpoint falls back to the original when
     * the rendition does not exist, so this is always a resolvable URL for an active asset.
     */
    public static String rendition(UUID assetId, String renditionKey) {
        if (renditionKey == null || renditionKey.isBlank()) {
            return original(assetId);
        }
        return CANONICAL_PREFIX + assetId + "/" + renditionKey;
    }

    /** True when the key is safe to use as a rendition key. */
    public static boolean isValidRenditionKey(String renditionKey) {
        return renditionKey != null && RENDITION_KEY.matcher(renditionKey).matches();
    }

    /**
     * Every asset id referenced by {@code value}, in canonical or legacy form.
     *
     * <p>Walks maps and lists recursively, because component properties nest structures
     * (a card list holding image objects, a CTA holding a link). Order of first
     * appearance is preserved and duplicates removed.</p>
     */
    public static Set<UUID> extractAssetIds(Object value) {
        Set<UUID> ids = new LinkedHashSet<>();
        collect(value, ids);
        return ids;
    }

    private static void collect(Object value, Set<UUID> ids) {
        if (value instanceof String s) {
            if (s.indexOf("/api/author/assets/") < 0 && s.indexOf(CANONICAL_PREFIX) < 0) {
                return;
            }
            Matcher legacy = LEGACY.matcher(s);
            while (legacy.find()) {
                ids.add(UUID.fromString(legacy.group(2)));
            }
            Matcher canonical = CANONICAL.matcher(s);
            while (canonical.find()) {
                ids.add(UUID.fromString(canonical.group(1)));
            }
        } else if (value instanceof Map<?, ?> map) {
            for (Object nested : map.values()) {
                collect(nested, ids);
            }
        } else if (value instanceof Iterable<?> list) {
            for (Object nested : list) {
                collect(nested, ids);
            }
        }
    }

    /**
     * A deep copy of {@code value} in which every legacy author asset URL is replaced by
     * its canonical URL. Maps keep their key order; non-string leaves are returned as-is.
     * Strings are rewritten wherever the URL occurs, so a URL embedded in rich-text HTML
     * ({@code <img src="...">}) is rewritten too.
     */
    @SuppressWarnings("unchecked")
    public static <T> T rewriteLegacyReferences(T value) {
        return (T) rewrite(value);
    }

    private static Object rewrite(Object value) {
        if (value instanceof String s) {
            if (s.indexOf("/api/author/assets/") < 0) {
                return s;
            }
            return LEGACY.matcher(s).replaceAll(m -> Matcher.quoteReplacement(CANONICAL_PREFIX + m.group(2)));
        }
        if (value instanceof Map<?, ?> map) {
            Map<Object, Object> copy = new LinkedHashMap<>(map.size());
            for (Map.Entry<?, ?> e : map.entrySet()) {
                copy.put(e.getKey(), rewrite(e.getValue()));
            }
            return copy;
        }
        if (value instanceof List<?> list) {
            List<Object> copy = new ArrayList<>(list.size());
            for (Object nested : list) {
                copy.add(rewrite(nested));
            }
            return copy;
        }
        return value;
    }
}
