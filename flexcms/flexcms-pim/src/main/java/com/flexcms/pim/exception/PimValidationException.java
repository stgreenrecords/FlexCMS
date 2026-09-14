package com.flexcms.pim.exception;

/**
 * Thrown when the caller's input is invalid: product attributes that fail JSON Schema
 * validation, a missing or unrecognized import {@code sourceType}, and similar
 * caller-correctable request problems. Mapped to HTTP 400 by
 * {@code com.flexcms.app.config.GlobalExceptionHandler}.
 *
 * <p>See {@link PimNotFoundException} for why PIM defines its own exception types
 * instead of reusing {@code flexcms-core}'s.</p>
 */
public class PimValidationException extends RuntimeException {

    public PimValidationException(String message) {
        super(message);
    }
}
