package com.flexcms.core.exception;

import org.springframework.http.HttpStatus;

/**
 * Base exception for all FlexCMS domain errors.
 * Carries an HTTP status and a machine-readable error code for RFC 7807 responses.
 */
public abstract class FlexCmsException extends RuntimeException {

    private final HttpStatus status;
    private final String errorCode;

    protected FlexCmsException(HttpStatus status, String errorCode, String message) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }

    protected FlexCmsException(HttpStatus status, String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.status = status;
        this.errorCode = errorCode;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
