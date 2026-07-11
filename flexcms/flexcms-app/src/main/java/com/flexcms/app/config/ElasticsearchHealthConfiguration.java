package com.flexcms.app.config;

import java.io.IOException;

import co.elastic.clients.transport.rest5_client.low_level.Request;
import co.elastic.clients.transport.rest5_client.low_level.RequestOptions;
import co.elastic.clients.transport.rest5_client.low_level.Response;
import co.elastic.clients.transport.rest5_client.low_level.Rest5Client;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.ReactiveHealthContributor;
import org.springframework.boot.health.contributor.ReactiveHealthIndicator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Provides the Elasticsearch health probe used by the aggregate actuator health endpoint.
 *
 * <p>Spring Boot 4 uses the Elasticsearch 9 client, whose typed health request emits
 * versioned compatibility media types. The local and currently supported Elasticsearch
 * service is 8.x, which rejects those headers. The low-level probe intentionally uses
 * ordinary JSON headers while retaining a real connectivity check.</p>
 */
@Configuration(proxyBeanMethods = false)
public class ElasticsearchHealthConfiguration {

    private static final String HEALTH_ENDPOINT = "/_cluster/health";
    private static final String JSON_MEDIA_TYPE = "application/json";

    @Bean(name = "elasticsearchHealthContributor")
    ReactiveHealthContributor elasticsearchHealthContributor(Rest5Client rest5Client) {
        return (ReactiveHealthIndicator) () -> Mono.fromCallable(() -> checkHealth(rest5Client))
                .subscribeOn(Schedulers.boundedElastic())
                .onErrorResume(exception -> Mono.just(Health.down(exception).build()));
    }

    private Health checkHealth(Rest5Client rest5Client) throws IOException {
        Request request = new Request("GET", HEALTH_ENDPOINT);
        request.setOptions(jsonRequestOptions());
        Response response = rest5Client.performRequest(request);
        int statusCode = response.getStatusCode();
        EntityUtils.consumeQuietly(response.getEntity());

        if (statusCode >= 200 && statusCode < 300) {
            return Health.up().withDetail("status", statusCode).build();
        }
        return Health.down()
                .withDetail("status", statusCode)
                .withDetail("endpoint", HEALTH_ENDPOINT)
                .build();
    }

    static RequestOptions.Builder jsonRequestOptions() {
        return RequestOptions.DEFAULT.toBuilder()
                .removeHeader("Accept")
                .addHeader("Accept", JSON_MEDIA_TYPE)
                .removeHeader("Content-Type")
                .addHeader("Content-Type", JSON_MEDIA_TYPE);
    }
}

