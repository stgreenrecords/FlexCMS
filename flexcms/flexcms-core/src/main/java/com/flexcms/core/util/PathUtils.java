package com.flexcms.core.util;

/**
 * Utility methods for converting between URL-style paths and content-tree paths.
 *
 * <p>The content tree uses {@code .} as separator (e.g. {@code content.mysite.en.homepage}).
 * REST APIs receive URL-style paths with {@code /} separators (e.g. {@code /mysite/en/homepage}).
 *
 * <p>All controllers that accept path parameters <em>must</em> use {@link #toContentPath(String)}
 * to guarantee consistent conversion behaviour across the entire API surface.
 */
public final class PathUtils {

    private PathUtils() {}

    /**
     * Converts a URL-style path to a content-tree dot-path.
     *
     * <p>Examples:
     * <pre>
     * toContentPath("/mysite/en/homepage")         → "content.mysite.en.homepage"
     * toContentPath("mysite/en/homepage")          → "content.mysite.en.homepage"
     * toContentPath("/content/mysite/en/homepage") → "content.mysite.en.homepage"
     * toContentPath("content.mysite.en.homepage")  → "content.mysite.en.homepage"
     * </pre>
     *
     * @param path URL-style path (with {@code /} separators) or already-dot-separated path
     * @return dot-separated content-tree path, always prefixed with {@code content.}
     */
    public static String toContentPath(String path) {
        if (path == null || path.isEmpty()) return "content";
        String p = path.startsWith("/") ? path.substring(1) : path;
        p = p.replace("/", ".");
        return p.startsWith("content.") ? p : "content." + p;
    }
}
