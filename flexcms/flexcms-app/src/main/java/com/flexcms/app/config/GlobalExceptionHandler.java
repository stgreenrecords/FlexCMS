package com.flexcms.app.config;

import com.flexcms.core.exception.ConflictException;
import com.flexcms.core.exception.FlexCmsException;
import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.exception.ValidationException;
import com.flexcms.pim.exception.PimConflictException;
import com.flexcms.pim.exception.PimNotFoundException;
import com.flexcms.pim.exception.PimValidationException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

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

    /**
     * PIM is a deliberately isolated module (own database, own migrations, own REST
     * API) with no dependency on {@code flexcms-core}, so it cannot throw {@link
     * NotFoundException} directly. {@link PimNotFoundException} is its equivalent;
     * unhandled, it fell to the catch-all below and every "product/catalog/schema/
     * variant not found" answered 500 instead of 404.
     */
    @ExceptionHandler(PimNotFoundException.class)
    public ResponseEntity<ProblemDetail> handlePimNotFound(PimNotFoundException ex, HttpServletRequest request) {
        return problemResponse(HttpStatus.NOT_FOUND, "NOT_FOUND", ex.getMessage(), request);
    }

    /**
     * PIM's equivalent of {@link ConflictException} — see {@link #handlePimNotFound}.
     * Covers duplicate SKUs/schema versions and illegal catalog status transitions
     * (e.g. activating a non-DRAFT catalog), which previously answered 500.
     */
    @ExceptionHandler(PimConflictException.class)
    public ResponseEntity<ProblemDetail> handlePimConflict(PimConflictException ex, HttpServletRequest request) {
        return problemResponse(HttpStatus.CONFLICT, "CONFLICT", ex.getMessage(), request);
    }

    /**
     * PIM's equivalent of a simple caller-input error (schema validation failures,
     * a missing/unrecognized import {@code sourceType}) — see {@link #handlePimNotFound}.
     * Previously answered 500 for what is always a mistake in the request, never a
     * server fault.
     */
    @ExceptionHandler(PimValidationException.class)
    public ResponseEntity<ProblemDetail> handlePimValidation(PimValidationException ex, HttpServletRequest request) {
        return problemResponse(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", ex.getMessage(), request);
    }

    /**
     * A request body the framework cannot read is the caller's mistake, not a fault.
     *
     * <p>Unhandled, this fell to the catch-all below and every malformed body — a
     * string where an array was expected, a truncated payload, the wrong content type —
     * answered 500 with nothing but a correlation ID. That is unactionable for the
     * caller and indistinguishable from a real server failure in the logs, on every
     * endpoint that accepts a body.</p>
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ProblemDetail> handleUnreadableBody(HttpMessageNotReadableException ex,
                                                              HttpServletRequest request) {
        String correlationId = resolveCorrelationId(request);
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setType(URI.create(TYPE_BASE + "malformed-request-body"));
        problem.setTitle("Malformed Request Body");
        // The parser's own message names the offending field and token, which is the
        // part a caller can act on; the framework wraps it with class detail that is
        // not useful over the wire.
        problem.setDetail("The request body could not be read: "
                + (ex.getMostSpecificCause() != null
                        ? ex.getMostSpecificCause().getMessage()
                        : ex.getMessage()));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errorCode", "MALFORMED_REQUEST_BODY");
        problem.setProperty("correlationId", correlationId);
        problem.setProperty("timestamp", Instant.now().toString());

        log.warn("[{}] Malformed request body on {}: {}", correlationId, request.getRequestURI(),
                ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(problem);
    }

    /**
     * A database integrity rule the caller tripped, not a server fault.
     *
     * <p>These reached the catch-all and answered 500 with a correlation ID, hiding
     * rules the caller could act on: deleting a PIM catalog that still holds products,
     * or a product another was carried forward from, both surfaced as "an unexpected
     * error occurred". The constraint name is included because it is the only part
     * that says *which* rule was broken.</p>
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ProblemDetail> handleDataIntegrityViolation(DataIntegrityViolationException ex,
                                                                      HttpServletRequest request) {
        String correlationId = resolveCorrelationId(request);
        String cause = ex.getMostSpecificCause() != null
                ? ex.getMostSpecificCause().getMessage()
                : ex.getMessage();

        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        problem.setType(URI.create(TYPE_BASE + "conflict"));
        problem.setTitle("Conflict");
        problem.setDetail("The request conflicts with existing data: " + cause);
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errorCode", "DATA_INTEGRITY_VIOLATION");
        problem.setProperty("correlationId", correlationId);
        problem.setProperty("timestamp", Instant.now().toString());

        log.warn("[{}] Data integrity violation on {}: {}", correlationId, request.getRequestURI(), cause);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(problem);
    }

    /**
     * A required query parameter the caller omitted.
     *
     * <p>Unhandled, this reached the catch-all and answered 500 — so calling an endpoint
     * without one of its required parameters looked like a server fault instead of a
     * missing argument. Found on `POST /api/pim/v1/imports/infer-schema`, which needs a
     * `sourceType`; the same applied to every endpoint with a required parameter.</p>
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ProblemDetail> handleMissingParameter(MissingServletRequestParameterException ex,
                                                                HttpServletRequest request) {
        String correlationId = resolveCorrelationId(request);
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setType(URI.create(TYPE_BASE + "missing-parameter"));
        problem.setTitle("Missing Request Parameter");
        problem.setDetail("Required parameter '" + ex.getParameterName() + "' of type "
                + ex.getParameterType() + " is missing.");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errorCode", "MISSING_PARAMETER");
        problem.setProperty("parameterName", ex.getParameterName());
        problem.setProperty("correlationId", correlationId);
        problem.setProperty("timestamp", Instant.now().toString());

        log.warn("[{}] Missing request parameter '{}' on {}", correlationId, ex.getParameterName(),
                request.getRequestURI());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(problem);
    }

    /**
     * No handler mapping matched the request path — most often a trailing slash on a
     * collection endpoint (e.g. {@code GET /api/pim/v1/products/}), or a genuinely wrong
     * path.
     *
     * <p>Unhandled, this reached the catch-all below: Spring's own default handling for
     * an unmatched path is a plain 404, but since {@code Exception.class} here intercepts
     * everything before that default ever runs, every unmapped path answered 500 with
     * nothing but a correlation ID — indistinguishable from a real server fault, and
     * misleading for the extremely common trailing-slash typo.</p>
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ProblemDetail> handleNoResourceFound(NoResourceFoundException ex,
                                                                HttpServletRequest request) {
        String correlationId = resolveCorrelationId(request);
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
        problem.setType(URI.create(TYPE_BASE + "not-found"));
        problem.setTitle("Not Found");
        problem.setDetail("No resource found for " + request.getMethod() + " " + request.getRequestURI()
                + ". If this path ends in '/', try it without the trailing slash.");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errorCode", "NOT_FOUND");
        problem.setProperty("correlationId", correlationId);
        problem.setProperty("timestamp", Instant.now().toString());

        log.warn("[{}] No resource found for {} {}", correlationId, request.getMethod(), request.getRequestURI());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(problem);
    }

    /**
     * A query parameter or path variable the framework could not convert to its
     * declared type — most often an invalid enum constant (e.g. {@code status=NOT_A_STATUS}
     * against {@code @RequestParam NodeStatus status}), or a malformed UUID/number.
     *
     * <p>Unhandled, this reached the catch-all below and answered 500 for what is
     * always a caller mistake, never a server fault — found on
     * {@code POST /api/author/content/node/status} with an invalid status value, but
     * it applies to every {@code @RequestParam}/{@code @PathVariable} typed as an enum,
     * UUID, or number across every controller.</p>
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ProblemDetail> handleTypeMismatch(MethodArgumentTypeMismatchException ex,
                                                             HttpServletRequest request) {
        String correlationId = resolveCorrelationId(request);
        String expectedType = ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "the expected type";
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setType(URI.create(TYPE_BASE + "validation-error"));
        problem.setTitle("Validation Failed");
        problem.setDetail("Parameter '" + ex.getName() + "' with value '" + ex.getValue()
                + "' could not be converted to " + expectedType + ".");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errorCode", "VALIDATION_ERROR");
        problem.setProperty("correlationId", correlationId);
        problem.setProperty("timestamp", Instant.now().toString());

        log.warn("[{}] Type mismatch on {}: parameter '{}' value '{}' is not a valid {}",
                correlationId, request.getRequestURI(), ex.getName(), ex.getValue(), expectedType);
        return ResponseEntity.badRequest().body(problem);
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

    /**
     * Same RFC 7807 shape as {@link #buildProblem}, for exceptions that carry only a
     * message rather than a {@link FlexCmsException} (e.g. the PIM-specific types,
     * which cannot extend it without a PIM → core dependency).
     */
    private ResponseEntity<ProblemDetail> problemResponse(HttpStatus status, String errorCode, String message,
                                                           HttpServletRequest request) {
        String correlationId = resolveCorrelationId(request);
        String slug = errorCode.toLowerCase().replace('_', '-');

        ProblemDetail problem = ProblemDetail.forStatus(status);
        problem.setType(URI.create(TYPE_BASE + slug));
        problem.setTitle(status.getReasonPhrase());
        problem.setDetail(message);
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errorCode", errorCode);
        problem.setProperty("correlationId", correlationId);
        problem.setProperty("timestamp", Instant.now().toString());

        log.warn("[{}] {} on {}: {}", correlationId, errorCode, request.getRequestURI(), message);
        return ResponseEntity.status(status).body(problem);
    }

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
