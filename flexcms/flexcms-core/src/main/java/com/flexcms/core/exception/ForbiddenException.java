package com.flexcms.core.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when an authenticated user lacks permission to perform an action (maps to HTTP 403).
 */
public class ForbiddenException extends FlexCmsException {

    public ForbiddenException(String message) {
        super(HttpStatus.FORBIDDEN, "FORBIDDEN", message);
    }
}
