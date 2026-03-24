package com.flexcms.app.config;

import com.flexcms.core.exception.ConflictException;
import com.flexcms.core.exception.FlexCmsException;
import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.exception.ValidationException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Global exception handler implementing RFC 7807 Problem Details for all FlexCMS REST APIs.
 *
 * <p>All error responses follow the Problem Details format with additional FlexCMS-specific
 * properties: {@code errorCode} and {@code correlationId} for tracing.</p>
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private static final String CORRELATION_HEADER = "X-Correlation-ID";
    private static final String TYPE_BASE = "https://flexcms.io/errors/";

    // -------------------------------------------------------------------------
    // FlexCMS domain exceptions
    // -------------------------------------------------------------------------

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ProblemDetail> handleNotFound(NotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = buildProblem(HttpStatus.NOT_FOUND, ex, request);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(problem);
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ProblemDetail> handleConflict(ConflictException ex, HttpServletRequest request) {
        ProblemDetail problem = buildProblem(HttpStatus.CONFLICT, ex, request);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(problem);
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ProblemDetail> handleValidation(ValidationException ex, HttpServletRequest request) {
        ProblemDetail problem = buildProblem(HttpStatus.UNPROCESSABLE_ENTITY, ex, request);
        if (!ex.getFieldErrors().isEmpty()) {
            List<Map<String, Object>> fieldErrors = ex.getFieldErrors().stream()
                    .map(ValidationException.FieldError::toMap)
                    .collect(Collectors.toList());
            problem.setProperty("fieldErrors", fieldErrors);
        }
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(problem);
    }

    @ExceptionHandler(FlexCmsException.class)
    public ResponseEntity<ProblemDetail> handleFlexCms(FlexCmsException ex, HttpServletRequest request) {
        ProblemDetail problem = buildProblem(ex.getStatus(), ex, request);
        return ResponseEntity.status(ex.getStatus()).body(problem);
    }

    // -------------------------------------------------------------------------
    // Bean Validation (@Valid) errors
    // -------------------------------------------------------------------------

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        String correlationId = resolveCorrelationId(request);
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setType(URI.create(TYPE_BASE + "validation-error"));
        problem.setTitle("Validation Failed");
        problem.setDetail("Request body contains invalid field values.");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errorCode", "VALIDATION_ERROR");
        problem.setProperty("correlationId", correlationId);
        problem.setProperty("timestamp", Instant.now().toString());

        List<Map<String, Object>> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> Map.<String, Object>of(
                        "field", fe.getField(),
                        "message", fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid value",
                        "rejectedValue", fe.getRejectedValue() != null ? fe.getRejectedValue().toString() : "null"
                ))
                .collect(Collectors.toList());

        problem.setProperty("fieldErrors", fieldErrors);

        log.warn("[{}] Validation error on {}: {} field errors",
                correlationId, request.getRequestURI(), fieldErrors.size());
        return ResponseEntity.badRequest().body(problem);
    }

    // -------------------------------------------------------------------------
    // @Validated @RequestParam / @PathVariable constraint violations
    // -------------------------------------------------------------------------

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ProblemDetail> handleConstraintViolation(
            ConstraintViolationException ex, HttpServletRequest request) {

        String correlationId = resolveCorrelationId(request);
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setType(URI.create(TYPE_BASE + "validation-error"));
        problem.setTitle("Validation Failed");
        problem.setDetail("One or more request parameters are invalid.");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errorCode", "VALIDATION_ERROR");
        problem.setProperty("correlationId", correlationId);
        problem.setProperty("timestamp", Instant.now().toString());

        List<Map<String, Object>> fieldErrors = ex.getConstraintViolations().stream()
                .map(cv -> {
                    // path is like "methodName.paramName" — extract just the param name
                    String path = cv.getPropertyPath().toString();
                    String param = path.contains(".") ? path.substring(path.lastIndexOf('.') + 1) : path;
                    return Map.<String, Object>of(
                            "field", param,
                            "message", cv.getMessage()
                    );
                })
                .collect(Collectors.toList());

        problem.setProperty("fieldErrors", fieldErrors);

        log.warn("[{}] Constraint violation on {}: {} violations",
                correlationId, request.getRequestURI(), fieldErrors.size());
        return ResponseEntity.badRequest().body(problem);
    }

    // -------------------------------------------------------------------------
    // Spring Security exceptions
    // -------------------------------------------------------------------------

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ProblemDetail> handleAuthentication(
            AuthenticationException ex, HttpServletRequest request) {

        String correlationId = resolveCorrelationId(request);
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.UNAUTHORIZED);
        problem.setType(URI.create(TYPE_BASE + "unauthorized"));
        problem.setTitle("Authentication Required");
        problem.setDetail("Valid authentication credentials are required to access this resource.");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errorCode", "UNAUTHORIZED");
        problem.setProperty("correlationId", correlationId);
        problem.setProperty("timestamp", Instant.now().toString());

        log.warn("[{}] Authentication failure on {}", correlationId, request.getRequestURI());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(problem);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ProblemDetail> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest request) {

        String correlationId = resolveCorrelationId(request);
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
        problem.setType(URI.create(TYPE_BASE + "forbidden"));
        problem.setTitle("Access Denied");
        problem.setDetail("You do not have permission to perform this action.");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errorCode", "FORBIDDEN");
        problem.setProperty("correlationId", correlationId);
        problem.setProperty("timestamp", Instant.now().toString());

        log.warn("[{}] Access denied on {}", correlationId, request.getRequestURI());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(problem);
    }

    // -------------------------------------------------------------------------
    // Catch-all
    // -------------------------------------------------------------------------

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleUnexpected(Exception ex, HttpServletRequest request) {
        String correlationId = resolveCorrelationId(request);
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        problem.setType(URI.create(TYPE_BASE + "internal-server-error"));
        problem.setTitle("Internal Server Error");
        problem.setDetail("An unexpected error occurred. Please contact support with the correlation ID.");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errorCode", "INTERNAL_SERVER_ERROR");
        problem.setProperty("correlationId", correlationId);
        problem.setProperty("timestamp", Instant.now().toString());

        log.error("[{}] Unexpected error on {}: {}", correlationId, request.getRequestURI(), ex.getMessage(), ex);
        return ResponseEntity.internalServerError().body(problem);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private ProblemDetail buildProblem(HttpStatus status, FlexCmsException ex, HttpServletRequest request) {
        String correlationId = resolveCorrelationId(request);
        String slug = ex.getErrorCode().toLowerCase().replace('_', '-');

        ProblemDetail problem = ProblemDetail.forStatus(status);
        problem.setType(URI.create(TYPE_BASE + slug));
        problem.setTitle(status.getReasonPhrase());
        problem.setDetail(ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errorCode", ex.getErrorCode());
        problem.setProperty("correlationId", correlationId);
        problem.setProperty("timestamp", Instant.now().toString());

        log.warn("[{}] {} on {}: {}", correlationId, ex.getErrorCode(), request.getRequestURI(), ex.getMessage());
        return problem;
    }

    /**
     * Resolves a correlation ID from (in priority order):
     * 1. Incoming X-Correlation-ID header
     * 2. MDC traceId (set by OpenTelemetry)
     * 3. Newly generated UUID
     */
    private String resolveCorrelationId(HttpServletRequest request) {
        String fromHeader = request.getHeader(CORRELATION_HEADER);
        if (fromHeader != null && !fromHeader.isBlank()) {
            return fromHeader;
        }
        String fromMdc = MDC.get("traceId");
        if (fromMdc != null && !fromMdc.isBlank()) {
            return fromMdc;
        }
        return UUID.randomUUID().toString();
    }
}
