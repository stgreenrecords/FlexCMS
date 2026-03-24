package com.flexcms.app.config;

import com.flexcms.core.exception.ConflictException;
import com.flexcms.core.exception.ForbiddenException;
import com.flexcms.core.exception.NotFoundException;
import com.flexcms.core.exception.ValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for GlobalExceptionHandler — verifies RFC 7807 ProblemDetail structure
 * for each exception type without loading a full Spring context.
 */
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;
    private MockHttpServletRequest request;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
        request = new MockHttpServletRequest("GET", "/api/test/resource");
    }

    // -------------------------------------------------------------------------
    // NotFoundException → 404
    // -------------------------------------------------------------------------

    @Test
    void notFound_returns404WithProblemDetail() {
        NotFoundException ex = new NotFoundException("Content node not found at path: content.home");

        ResponseEntity<ProblemDetail> response = handler.handleNotFound(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        ProblemDetail body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.getStatus()).isEqualTo(404);
        assertThat(body.getDetail()).isEqualTo("Content node not found at path: content.home");
        assertThat(body.getProperties()).containsKey("errorCode");
        assertThat(body.getProperties().get("errorCode")).isEqualTo("NOT_FOUND");
        assertThat(body.getProperties()).containsKey("correlationId");
        assertThat(body.getProperties()).containsKey("timestamp");
    }

    @Test
    void notFound_correlationIdFromHeader() {
        request.addHeader("X-Correlation-ID", "test-trace-123");
        NotFoundException ex = NotFoundException.forPath("content.missing");

        ResponseEntity<ProblemDetail> response = handler.handleNotFound(ex, request);

        assertThat(response.getBody().getProperties().get("correlationId")).isEqualTo("test-trace-123");
    }

    // -------------------------------------------------------------------------
    // ConflictException → 409
    // -------------------------------------------------------------------------

    @Test
    void conflict_returns409WithProblemDetail() {
        ConflictException ex = ConflictException.alreadyExists("content.home.about");

        ResponseEntity<ProblemDetail> response = handler.handleConflict(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        ProblemDetail body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.getStatus()).isEqualTo(409);
        assertThat(body.getProperties().get("errorCode")).isEqualTo("ALREADY_EXISTS");
    }

    @Test
    void conflict_lockedBy_returns409() {
        ConflictException ex = ConflictException.lockedBy("alice");

        ResponseEntity<ProblemDetail> response = handler.handleConflict(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().getProperties().get("errorCode")).isEqualTo("NODE_LOCKED");
        assertThat(response.getBody().getDetail()).contains("alice");
    }

    // -------------------------------------------------------------------------
    // ValidationException → 422
    // -------------------------------------------------------------------------

    @Test
    void validation_returns422WithFieldErrors() {
        List<ValidationException.FieldError> fieldErrors = List.of(
                ValidationException.FieldError.of("name", "must not be blank"),
                ValidationException.FieldError.of("resourceType", "invalid resource type")
        );
        ValidationException ex = new ValidationException("Request validation failed", fieldErrors);

        ResponseEntity<ProblemDetail> response = handler.handleValidation(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
        ProblemDetail body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.getStatus()).isEqualTo(422);
        assertThat(body.getProperties().get("errorCode")).isEqualTo("VALIDATION_ERROR");
        assertThat(body.getProperties()).containsKey("fieldErrors");
    }

    @Test
    void validation_noFieldErrors_returns422WithoutFieldErrorsProperty() {
        ValidationException ex = new ValidationException("Domain validation failed");

        ResponseEntity<ProblemDetail> response = handler.handleValidation(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
        // fieldErrors property should not be present when the list is empty
        assertThat(response.getBody().getProperties()).doesNotContainKey("fieldErrors");
    }

    // -------------------------------------------------------------------------
    // ForbiddenException → 403 (via base FlexCmsException handler)
    // -------------------------------------------------------------------------

    @Test
    void forbidden_returns403WithProblemDetail() {
        ForbiddenException ex = new ForbiddenException("User lacks CONTENT_PUBLISHER role");

        ResponseEntity<ProblemDetail> response = handler.handleFlexCms(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        ProblemDetail body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.getStatus()).isEqualTo(403);
        assertThat(body.getProperties().get("errorCode")).isEqualTo("FORBIDDEN");
    }

    // -------------------------------------------------------------------------
    // Unexpected exception → 500
    // -------------------------------------------------------------------------

    @Test
    void unexpectedException_returns500WithCorrelationId() {
        RuntimeException ex = new RuntimeException("Something went very wrong");

        ResponseEntity<ProblemDetail> response = handler.handleUnexpected(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        ProblemDetail body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.getStatus()).isEqualTo(500);
        assertThat(body.getProperties().get("errorCode")).isEqualTo("INTERNAL_SERVER_ERROR");
        assertThat(body.getProperties()).containsKey("correlationId");
        // Detail must NOT expose raw exception message to clients
        assertThat(body.getDetail()).doesNotContain("Something went very wrong");
    }

    // -------------------------------------------------------------------------
    // Instance URI
    // -------------------------------------------------------------------------

    @Test
    void problemDetail_instanceReflectsRequestUri() {
        request = new MockHttpServletRequest("GET", "/api/content/v1/pages/site/page");
        NotFoundException ex = NotFoundException.forPath("content.site.page");

        ResponseEntity<ProblemDetail> response = handler.handleNotFound(ex, request);

        assertThat(response.getBody().getInstance().toString()).isEqualTo("/api/content/v1/pages/site/page");
    }
}
