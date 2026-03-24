package com.flexcms.app.config;

import com.flexcms.author.controller.AuthorContentController;
import com.flexcms.author.controller.AuthorWorkflowController;
import com.flexcms.author.controller.ReplicationMonitorController;
import com.flexcms.author.controller.SiteAdminController;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies that every public controller method in author modules carries a
 * {@code @PreAuthorize} annotation, preventing accidental unprotected endpoints.
 *
 * <p>This test does NOT start a Spring context — it uses reflection to inspect
 * the bytecode annotations, making it fast and dependency-free.
 */
class RbacAnnotationsTest {

    @Test
    void authorContentController_allPublicMethods_havePreAuthorize() {
        assertAllPublicMethodsAnnotated(AuthorContentController.class);
    }

    @Test
    void siteAdminController_allPublicMethods_havePreAuthorize() {
        assertAllPublicMethodsAnnotated(SiteAdminController.class);
    }

    @Test
    void authorWorkflowController_allPublicMethods_havePreAuthorize() {
        assertAllPublicMethodsAnnotated(AuthorWorkflowController.class);
    }

    @Test
    void replicationMonitorController_allPublicMethods_havePreAuthorize() {
        assertAllPublicMethodsAnnotated(ReplicationMonitorController.class);
    }

    @Test
    void siteAdminController_createSite_requiresAdminOnly() {
        PreAuthorize annotation = getAnnotation(SiteAdminController.class, "createSite");
        assertThat(annotation.value())
                .contains("ADMIN")
                .doesNotContain("CONTENT_AUTHOR");
    }

    @Test
    void siteAdminController_addDomain_requiresAdminOnly() {
        PreAuthorize annotation = getAnnotation(SiteAdminController.class, "addDomain");
        assertThat(annotation.value())
                .contains("ADMIN")
                .doesNotContain("CONTENT_AUTHOR");
    }

    @Test
    void replicationMonitor_requiresAdminOnly() {
        PreAuthorize status = getAnnotation(ReplicationMonitorController.class, "getStatus");
        PreAuthorize log = getAnnotation(ReplicationMonitorController.class, "getLog");
        assertThat(status.value()).contains("ADMIN").doesNotContain("CONTENT_AUTHOR");
        assertThat(log.value()).contains("ADMIN").doesNotContain("CONTENT_AUTHOR");
    }

    @Test
    void authorContentController_createNode_requiresContentAuthor() {
        PreAuthorize annotation = getAnnotation(AuthorContentController.class, "createNode");
        assertThat(annotation.value()).contains("CONTENT_AUTHOR");
    }

    @Test
    void authorContentController_updateStatus_allowsContentPublisher() {
        PreAuthorize annotation = getAnnotation(AuthorContentController.class, "updateStatus");
        assertThat(annotation.value()).contains("CONTENT_PUBLISHER");
    }

    @Test
    void authorWorkflowController_advance_requiresReviewerOrPublisher() {
        PreAuthorize annotation = getAnnotation(AuthorWorkflowController.class, "advance");
        assertThat(annotation.value())
                .contains("CONTENT_REVIEWER")
                .contains("CONTENT_PUBLISHER");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void assertAllPublicMethodsAnnotated(Class<?> controllerClass) {
        List<Method> requestMappingMethods = Arrays.stream(controllerClass.getDeclaredMethods())
                .filter(m -> java.lang.reflect.Modifier.isPublic(m.getModifiers()))
                .filter(m -> !m.isSynthetic())
                // Exclude record component accessors (inner record classes)
                .filter(m -> !m.getDeclaringClass().isRecord())
                .toList();

        for (Method method : requestMappingMethods) {
            PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);
            assertThat(annotation)
                    .as("Method %s#%s must have @PreAuthorize",
                            controllerClass.getSimpleName(), method.getName())
                    .isNotNull();

            // Every @PreAuthorize must grant access to ADMIN
            assertThat(annotation.value())
                    .as("@PreAuthorize on %s#%s must include ADMIN role",
                            controllerClass.getSimpleName(), method.getName())
                    .contains("ADMIN");
        }
    }

    private PreAuthorize getAnnotation(Class<?> clazz, String methodName) {
        return Arrays.stream(clazz.getDeclaredMethods())
                .filter(m -> m.getName().equals(methodName))
                .findFirst()
                .map(m -> m.getAnnotation(PreAuthorize.class))
                .orElseThrow(() -> new AssertionError(
                        "Method not found: " + clazz.getSimpleName() + "#" + methodName));
    }
}
