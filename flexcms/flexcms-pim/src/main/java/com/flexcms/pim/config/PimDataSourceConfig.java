package com.flexcms.pim.config;

import org.flywaydb.core.Flyway;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

/**
 * PIM database configuration — completely separate from the CMS database.
 *
 * <p>PIM connects to its own PostgreSQL database (flexcms_pim) with its own
 * connection pool, entity manager, and transaction manager. This ensures
 * PIM outage never affects CMS content delivery.</p>
 *
 * <p>Configuration in application.yml:</p>
 * <pre>
 * flexcms:
 *   pim:
 *     datasource:
 *       url: jdbc:postgresql://localhost:5432/flexcms_pim
 *       username: flexcms
 *       password: flexcms
 * </pre>
 */
@Configuration
@EnableJpaRepositories(
        basePackages = "com.flexcms.pim.repository",
        entityManagerFactoryRef = "pimEntityManagerFactory",
        transactionManagerRef = "pimTransactionManager"
)
public class PimDataSourceConfig {

    @Bean
    @ConfigurationProperties("flexcms.pim.datasource")
    public DataSourceProperties pimDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean
    public DataSource pimDataSource() {
        return pimDataSourceProperties()
                .initializeDataSourceBuilder()
                .build();
    }

    /**
     * Flyway migration for the PIM database.
     * Runs migrations from {@code classpath:db/pim/} before Hibernate validation.
     * This bean MUST initialize before {@code pimEntityManagerFactory}.
     * baselineOnMigrate=true with baselineVersion=0 ensures V1+ migrations all run.
     * If the schema already exists (e.g. manually applied), Flyway will baseline
     * and skip already-applied scripts.
     */
    @Bean(initMethod = "migrate")
    public Flyway pimFlyway() {
        return Flyway.configure()
                .dataSource(pimDataSource())
                .locations("classpath:db/pim")
                .baselineOnMigrate(true)
                .baselineVersion("0")
                .validateOnMigrate(false)   // skip checksum check for pre-seeded history
                .load();
    }

    @Bean
    @DependsOn("pimFlyway")
    public LocalContainerEntityManagerFactoryBean pimEntityManagerFactory() {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(pimDataSource());
        em.setPackagesToScan("com.flexcms.pim.model");
        em.setPersistenceUnitName("pim");

        HibernateJpaVendorAdapter vendorAdapter = new HibernateJpaVendorAdapter();
        vendorAdapter.setGenerateDdl(false); // Flyway manages DDL
        em.setJpaVendorAdapter(vendorAdapter);

        Map<String, Object> props = new HashMap<>();
        // Do NOT set hibernate.dialect — auto-detected from PostgreSQL driver
        // hbm2ddl.auto=none: Flyway manages PIM schema; Hibernate must not validate or modify it.
        props.put("hibernate.hbm2ddl.auto", "none");
        em.setJpaPropertyMap(props);

        return em;
    }

    @Bean
    public PlatformTransactionManager pimTransactionManager() {
        JpaTransactionManager txManager = new JpaTransactionManager();
        txManager.setEntityManagerFactory(pimEntityManagerFactory().getObject());
        return txManager;
    }
}

