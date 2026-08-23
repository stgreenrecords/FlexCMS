package com.flexcms.pim;

import org.springframework.boot.autoconfigure.AutoConfigurationExcludeFilter;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.TypeExcludeFilter;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;

/**
 * Minimal Spring Boot entry point for {@code flexcms-pim} integration test slices.
 * Required by {@code @SpringBootTest} to locate auto-configuration in a library module.
 *
 * <p><strong>The scan is deliberately limited to {@code com.flexcms.pim.config}.</strong>
 * That package holds {@code PimDataSourceConfig}, which is all a repository
 * integration test needs: it builds the PIM datasource, runs the PIM Flyway
 * migrations, declares the entity manager over {@code com.flexcms.pim.model}, and
 * registers the repositories itself through
 * {@code @EnableJpaRepositories(basePackages = "com.flexcms.pim.repository")}.
 *
 * <p>Scanning the whole {@code com.flexcms.pim} package instead boots the module's
 * entire bean graph — controllers, services, importers, and the
 * {@code @FlexCmsComponent} render-time models — and each one drags in a
 * collaborator the persistence slice has no reason to provide. In practice the
 * context then fails before a single test runs, first on
 * {@code No qualifying bean of type DamClient} (from the component models) and then
 * on {@code No qualifying bean of type ObjectMapper} (from the service graph).
 * Widening this scan re-introduces that whole chase.
 *
 * <p>{@code TypeExcludeFilter} and {@code AutoConfigurationExcludeFilter} are
 * restated because declaring {@code @ComponentScan} directly overrides the filters
 * {@code @SpringBootApplication} would otherwise contribute; dropping them would
 * break Boot's test-slice annotations and pull {@code @AutoConfiguration} classes in
 * as regular beans.
 */
@SpringBootApplication
@ComponentScan(
        basePackages = "com.flexcms.pim.config",
        excludeFilters = {
                @ComponentScan.Filter(type = FilterType.CUSTOM, classes = TypeExcludeFilter.class),
                @ComponentScan.Filter(type = FilterType.CUSTOM, classes = AutoConfigurationExcludeFilter.class)
        })
class PimTestApplication {
}
