package com.flexcms.pim.exception;

/**
 * Thrown when a requested PIM resource (product, catalog, schema, variant, asset
 * reference, or version) does not exist. Mapped to HTTP 404 by
 * {@code com.flexcms.app.config.GlobalExceptionHandler}.
 *
 * <p>PIM defines its own exception types rather than depending on {@code flexcms-core}'s
 * {@code NotFoundException}/{@code ConflictException} — PIM is a deliberately isolated
 * module (own database, own migrations, own REST API; see {@code CLAUDE.md}), and the
 * shared web-layer handler in {@code flexcms-app} is the natural place to unify HTTP
 * semantics across modules without introducing a PIM → core compile-time dependency.</p>
 */
public class PimNotFoundException extends RuntimeException {

    public PimNotFoundException(String message) {
        super(message);
    }
}
