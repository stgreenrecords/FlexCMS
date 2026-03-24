package com.flexcms.pim.config;

import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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

    @Bean
    public LocalContainerEntityManagerFactoryBean pimEntityManagerFactory() {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(pimDataSource());
        em.setPackagesToScan("com.flexcms.pim.model");
        em.setPersistenceUnitName("pim");

        HibernateJpaVendorAdapter vendorAdapter = new HibernateJpaVendorAdapter();
        vendorAdapter.setGenerateDdl(false); // Flyway manages DDL
        em.setJpaVendorAdapter(vendorAdapter);

        Map<String, Object> props = new HashMap<>();
        props.put("hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect");
        props.put("hibernate.hbm2ddl.auto", "validate");
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

