package com.flexcms.app.config;

import org.flywaydb.core.Flyway;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

/**
 * CMS (Content + DAM) primary datasource configuration.
 *
 * <p>Explicitly configures the primary DataSource, Flyway, EntityManagerFactory, and
 * TransactionManager for the CMS database (flexcms_author or flexcms_publish depending
 * on the active Spring profile). This prevents Spring Boot's DataSourceAutoConfiguration
 * from being suppressed by the PIM secondary datasource bean.</p>
 *
 * <p>Database URL is driven by the active profile:
 * <ul>
 *   <li>author profile: {@code spring.datasource.url=jdbc:postgresql://localhost:5432/flexcms_author}</li>
 *   <li>publish profile: {@code spring.datasource.url=jdbc:postgresql://localhost:5432/flexcms_publish}</li>
 * </ul>
 * </p>
 */
@Configuration
@EnableJpaRepositories(
        basePackages = {
                "com.flexcms.core.repository",
                "com.flexcms.clientlibs.repository",
                "com.flexcms.i18n.repository"
        },
        entityManagerFactoryRef = "entityManagerFactory",
        transactionManagerRef = "transactionManager"
)
public class CmsDataSourceConfig {

    // ── DataSource ─────────────────────────────────────────────────────────────

    @Primary
    @Bean
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties cmsDataSourceProperties() {
        return new DataSourceProperties();
    }

    /**
     * Primary CMS DataSource — connects to flexcms_author or flexcms_publish.
     * Named "dataSource" so Spring Boot's JdbcTemplate, actuator, and other
     * auto-configured components pick it up as the primary.
     */
    @Primary
    @Bean("dataSource")
    public DataSource dataSource() {
        return cmsDataSourceProperties()
                .initializeDataSourceBuilder()
                .build();
    }

    // ── Flyway ─────────────────────────────────────────────────────────────────

    /**
     * Runs CMS Flyway migrations (db/migration/) against the primary CMS database.
     * Explicitly configured here because Spring Boot's FlywayAutoConfiguration is
     * disabled (spring.flyway.enabled=false) to prevent interference with PIM Flyway.
     */
    @Primary
    @Bean(name = "cmsFlyway", initMethod = "migrate")
    @DependsOn("dataSource")
    public Flyway cmsFlyway() {
        return Flyway.configure()
                .dataSource(dataSource())
                .locations("classpath:db/migration")
                .baselineOnMigrate(true)
                .baselineVersion("0")   // run all migrations including V1
                .load();
    }

    // ── JPA ────────────────────────────────────────────────────────────────────

    /**
     * Primary EntityManagerFactory for CMS entities (content nodes, DAM assets, i18n, etc.).
     * Depends on cmsFlyway to ensure schema is up-to-date before Hibernate validation.
     */
    @Primary
    @Bean("entityManagerFactory")
    @DependsOn("cmsFlyway")
    public LocalContainerEntityManagerFactoryBean entityManagerFactory() {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource());
        em.setPackagesToScan(
                "com.flexcms.core.model",
                "com.flexcms.clientlibs.model",
                "com.flexcms.i18n.model",
                "com.flexcms.multisite.model",
                "com.flexcms.replication.model",
                "com.flexcms.plugin.model"
        );
        em.setPersistenceUnitName("cms");

        HibernateJpaVendorAdapter vendorAdapter = new HibernateJpaVendorAdapter();
        vendorAdapter.setGenerateDdl(false); // Flyway manages DDL
        em.setJpaVendorAdapter(vendorAdapter);

        Map<String, Object> props = new HashMap<>();
        // Do NOT set hibernate.dialect — Hibernate 6 auto-detects PostgreSQL
        // hbm2ddl.auto=none: Flyway owns the schema; Hibernate must not re-validate or modify it.
        // Validation is skipped because PostgreSQL-specific column types (e.g. text[], ltree)
        // cause false-positive JDBC type mismatches with Hibernate's generic type system.
        props.put("hibernate.hbm2ddl.auto", "none");
        props.put("hibernate.format_sql", "true");
        em.setJpaPropertyMap(props);

        return em;
    }

    /**
     * Primary TransactionManager for CMS JPA operations.
     */
    @Primary
    @Bean("transactionManager")
    public PlatformTransactionManager transactionManager() {
        JpaTransactionManager txManager = new JpaTransactionManager();
        txManager.setEntityManagerFactory(entityManagerFactory().getObject());
        return txManager;
    }
}

