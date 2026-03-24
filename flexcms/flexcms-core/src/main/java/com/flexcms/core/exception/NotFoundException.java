package com.flexcms.core.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when a requested resource does not exist (maps to HTTP 404).
 */
public class NotFoundException extends FlexCmsException {

    public NotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, "NOT_FOUND", message);
    }

    public static NotFoundException forPath(String path) {
        return new NotFoundException("Resource not found at path: " + path);
    }

    public static NotFoundException forId(String type, Object id) {
        return new NotFoundException(type + " not found with id: " + id);
    }
}
