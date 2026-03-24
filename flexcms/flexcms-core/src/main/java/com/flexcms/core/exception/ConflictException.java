package com.flexcms.core.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when an operation conflicts with existing state (maps to HTTP 409).
 * Examples: duplicate path, locked node, concurrent modification.
 */
public class ConflictException extends FlexCmsException {

    public ConflictException(String message) {
        super(HttpStatus.CONFLICT, "CONFLICT", message);
    }

    public ConflictException(String errorCode, String message) {
        super(HttpStatus.CONFLICT, errorCode, message);
    }

    public static ConflictException alreadyExists(String path) {
        return new ConflictException("ALREADY_EXISTS", "Resource already exists at path: " + path);
    }

    public static ConflictException lockedBy(String lockedByUser) {
        return new ConflictException("NODE_LOCKED", "Node is locked by user: " + lockedByUser);
    }
}
