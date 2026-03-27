package com.flexcms.core.exception;

/**
 * Thrown when a CMS content node cannot be found by path or ID (maps to HTTP 404).
 * Specialization of {@link NotFoundException} for content-tree lookups.
 */
public class ContentNotFoundException extends NotFoundException {

    public ContentNotFoundException(String message) {
        super(message);
    }

    public static ContentNotFoundException forPath(String path) {
        return new ContentNotFoundException("Content node not found at path: " + path);
    }

    public static ContentNotFoundException forId(Object id) {
        return new ContentNotFoundException("Content node not found with id: " + id);
    }
}
