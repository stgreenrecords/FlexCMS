package com.flexcms.replication;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * Minimal Spring Boot entry point for {@code flexcms-replication} test slices.
 * Required by {@code @SpringBootTest} to locate auto-configuration in a library module.
 *
 * <p>Two things this class must supply, because the replication beans depend on them
 * but they are contributed by modules a library module does not (and should not)
 * depend on:
 *
 * <ul>
 *   <li><strong>The core JPA layer.</strong> {@code ReplicationAgent},
 *       {@code ReplicationReceiver}, and {@code ProductPublishListener} inject
 *       {@code ContentNodeRepository} and {@code ReplicationLogRepository} from
 *       {@code flexcms-core}. Those live outside this module's package, so neither
 *       Boot's repository scan nor its entity scan — both anchored at this class's
 *       package — would find them, and the context fails with "No qualifying bean of
 *       type ContentNodeRepository". Hibernate creates the schema here
 *       ({@code ddl-auto=create-drop} in {@code application-replication-it.properties}),
 *       so the entity scan matters as much as the repository scan.</li>
 *   <li><strong>A Jackson 2 {@code ObjectMapper}.</strong> {@code AuthorNodeClient}
 *       takes one as a constructor argument. Spring Boot 4.1 auto-configures
 *       <em>Jackson 3</em> — {@code JacksonAutoConfiguration} produces a
 *       {@code tools.jackson.databind.json.JsonMapper} — and never registers the
 *       Jackson 2 {@code com.fasterxml.jackson.databind.ObjectMapper} this codebase
 *       injects in a dozen places. The running application gets one from
 *       {@code com.flexcms.app.config.JacksonConfig}; this mirrors that bean so the
 *       slice wires the same way production does.</li>
 * </ul>
 */
@SpringBootApplication
@EntityScan(basePackages = "com.flexcms.core.model")
@EnableJpaRepositories(basePackages = "com.flexcms.core.repository")
class ReplicationTestApplication {

    /** Mirrors {@code com.flexcms.app.config.JacksonConfig#flexCmsObjectMapper()}. */
    @Bean
    ObjectMapper flexCmsObjectMapper() {
        return new ObjectMapper().registerModule(new JavaTimeModule());
    }
}
