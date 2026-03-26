package com.flexcms.app;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

/**
 * Smoke test: verifies the ApplicationContext loads without errors.
 *
 * <p>This catches startup failures that unit tests miss:
 * <ul>
 *   <li>Missing @Autowired beans (wrong scan packages, missing @EnableXxxRepositories packages)</li>
 *   <li>Invalid Spring MVC path patterns (e.g. {*varName} followed by more path)</li>
 *   <li>Misconfigured @Value properties</li>
 *   <li>Flyway migration errors</li>
 * </ul>
 *
 * <p>Uses the "local" profile to bypass Keycloak/JWT and a test properties override
 * to use an in-memory H2 or Testcontainers Postgres — whichever is configured.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles({"author", "local"})
@TestPropertySource(properties = {
        // Use the same local DB as dev — Flyway validates schema at startup
        "spring.datasource.url=jdbc:postgresql://localhost:5432/flexcms_author",
        "flexcms.pim.datasource.url=jdbc:postgresql://localhost:5432/flexcms_pim",
        // Suppress OTLP trace export in tests
        "management.tracing.sampling.probability=0",
})
class ApplicationContextSmokeTest {

    @Test
    void contextLoads() {
        // If the context fails to start, Spring throws before this method runs.
        // No assertions needed — a passing test means the context is healthy.
    }
}
