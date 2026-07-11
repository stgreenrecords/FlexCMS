package com.flexcms.app.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.util.Map;
import java.util.stream.Collectors;

import co.elastic.clients.transport.rest5_client.low_level.Request;
import co.elastic.clients.transport.rest5_client.low_level.Response;
import co.elastic.clients.transport.rest5_client.low_level.Rest5Client;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.ReactiveHealthIndicator;

class ElasticsearchHealthConfigurationTest {

    private final ElasticsearchHealthConfiguration configuration = new ElasticsearchHealthConfiguration();

    @Test
    void healthProbeUsesPlainJsonHeadersAndReportsUpForSuccessfulResponse() throws IOException {
        Rest5Client rest5Client = mock(Rest5Client.class);
        Response response = mock(Response.class);
        when(response.getStatusCode()).thenReturn(200);
        when(rest5Client.performRequest(any(Request.class))).thenReturn(response);

        Health health = indicator(rest5Client).health().block();

        assertThat(health.getStatus().getCode()).isEqualTo("UP");
        assertThat(health.getDetails()).containsEntry("status", 200);

        ArgumentCaptor<Request> requestCaptor = ArgumentCaptor.forClass(Request.class);
        verify(rest5Client).performRequest(requestCaptor.capture());
        Map<String, String> headers = requestCaptor.getValue().getOptions().getHeaders().stream()
                .collect(Collectors.toMap(org.apache.hc.core5.http.Header::getName,
                        org.apache.hc.core5.http.Header::getValue));
        assertThat(headers).containsEntry("Accept", "application/json")
                .containsEntry("Content-Type", "application/json");
    }

    @Test
    void healthProbeReportsDownForNonSuccessfulResponse() throws IOException {
        Rest5Client rest5Client = mock(Rest5Client.class);
        Response response = mock(Response.class);
        when(response.getStatusCode()).thenReturn(503);
        when(rest5Client.performRequest(any(Request.class))).thenReturn(response);

        Health health = indicator(rest5Client).health().block();

        assertThat(health.getStatus().getCode()).isEqualTo("DOWN");
        assertThat(health.getDetails()).containsEntry("status", 503)
                .containsEntry("endpoint", "/_cluster/health");
    }

    @Test
    void healthProbeReportsDownWhenTheRequestFails() throws IOException {
        Rest5Client rest5Client = mock(Rest5Client.class);
        when(rest5Client.performRequest(any(Request.class))).thenThrow(new IOException("connection refused"));

        Health health = indicator(rest5Client).health().block();

        assertThat(health.getStatus().getCode()).isEqualTo("DOWN");
        assertThat(health.getDetails()).containsKey("error");
    }

    private ReactiveHealthIndicator indicator(Rest5Client rest5Client) {
        return (ReactiveHealthIndicator) configuration.elasticsearchHealthContributor(rest5Client);
    }
}


