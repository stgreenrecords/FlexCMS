package com.flexcms.app.config;

import io.micrometer.observation.ObservationRegistry;
import io.micrometer.observation.aop.ObservedAspect;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenTelemetry / Micrometer Tracing configuration for FlexCMS.
 *
 * <p><b>How it works:</b>
 * <ol>
 *   <li>Spring Boot autoconfigures a Micrometer {@link ObservationRegistry} backed by the
 *       {@code micrometer-tracing-bridge-otel} bridge.</li>
 *   <li>The bridge delegates to the OTel SDK which exports spans via the OTLP exporter to
 *       whatever backend is configured at {@code management.otlp.tracing.endpoint}
 *       (default: {@code http://localhost:4318/v1/traces}).</li>
 *   <li>Spring MVC, Spring Data, and Spring AMQP automatically create spans for every
 *       HTTP request, DB query, and RabbitMQ message.</li>
 *   <li>The OTel bridge also writes {@code traceId} and {@code spanId} into SLF4J MDC,
 *       so every log line emitted within a traced request carries those fields automatically
 *       (the {@code logback-spring.xml} includes them in the JSON output).</li>
 * </ol>
 *
 * <p><b>Sampling:</b> Configurable via {@code management.tracing.sampling.probability}
 * (env: {@code FLEXCMS_TRACE_SAMPLE_RATE}, default 1.0).
 *
 * <p><b>Baggage / context propagation:</b> W3C TraceContext + Baggage headers are used
 * by default ({@code traceparent}, {@code tracestate}, {@code baggage}).
 */
@Configuration
public class TracingConfig {

    /**
     * Enables the {@code @Observed} annotation on any Spring bean method.
     * Without this bean the annotation only records metrics but not traces.
     */
    @Bean
    public ObservedAspect observedAspect(ObservationRegistry registry) {
        return new ObservedAspect(registry);
    }
}
