package com.flexcms.pim.exception;

/**
 * Thrown when a PIM operation conflicts with existing state: a duplicate SKU or schema
 * name+version, an illegal catalog status transition, or a delete blocked by dependent
 * data. Mapped to HTTP 409 by {@code com.flexcms.app.config.GlobalExceptionHandler}.
 *
 * <p>See {@link PimNotFoundException} for why PIM defines its own exception types
 * instead of reusing {@code flexcms-core}'s.</p>
 */
public class PimConflictException extends RuntimeException {

    public PimConflictException(String message) {
        super(message);
    }
}
