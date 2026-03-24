package com.flexcms.core.exception;

import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Map;

/**
 * Thrown when input data fails domain-level validation (maps to HTTP 422).
 * Carries field-level error details for structured error responses.
 */
public class ValidationException extends FlexCmsException {

    private final List<FieldError> fieldErrors;

    public ValidationException(String message) {
        super(HttpStatus.UNPROCESSABLE_ENTITY, "VALIDATION_ERROR", message);
        this.fieldErrors = List.of();
    }

    public ValidationException(String message, List<FieldError> fieldErrors) {
        super(HttpStatus.UNPROCESSABLE_ENTITY, "VALIDATION_ERROR", message);
        this.fieldErrors = fieldErrors != null ? fieldErrors : List.of();
    }

    public List<FieldError> getFieldErrors() {
        return fieldErrors;
    }

    public record FieldError(String field, String message, Object rejectedValue) {
        public static FieldError of(String field, String message) {
            return new FieldError(field, message, null);
        }
        public Map<String, Object> toMap() {
            return Map.of("field", field, "message", message);
        }
    }
}
