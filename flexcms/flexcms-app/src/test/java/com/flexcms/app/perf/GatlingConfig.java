package com.flexcms.app.perf;

import io.gatling.javaapi.http.HttpProtocolBuilder;

import static io.gatling.javaapi.http.HttpDsl.http;

/**
 * Shared Gatling configuration for all FlexCMS load test simulations.
 *
 * <p>Override target URL via system property: {@code -Dgatling.baseUrl=http://...}</p>
 *
 * <p>Simulations are in the same package — run all with:</p>
 * <pre>
 *   mvn gatling:test -pl flexcms-app
 * </pre>
 *
 * <p>Run a single simulation:</p>
 * <pre>
 *   mvn gatling:test -pl flexcms-app \
 *     -Dgatling.simulationClass=com.flexcms.app.perf.ContentDeliverySimulation
 * </pre>
 */
public final class GatlingConfig {

    private GatlingConfig() {}

    /** Target server — defaults to local author instance on :8080. */
    public static final String BASE_URL =
            System.getProperty("gatling.baseUrl", "http://localhost:8080");

    /** Default site header sent with headless requests. */
    public static final String DEFAULT_SITE = "site1";

    /** Default locale header. */
    public static final String DEFAULT_LOCALE = "en";

    /**
     * Base HTTP protocol shared by all simulations.
     * Override auth header via {@code -Dgatling.bearerToken=...}
     */
    public static HttpProtocolBuilder baseProtocol() {
        String token = System.getProperty("gatling.bearerToken", "");
        HttpProtocolBuilder builder = http
                .baseUrl(BASE_URL)
                .acceptHeader("application/json")
                .acceptEncodingHeader("gzip, deflate")
                .userAgentHeader("FlexCMS-GatlingLoadTest/1.0")
                .header("X-FlexCMS-Site", DEFAULT_SITE)
                .header("X-FlexCMS-Locale", DEFAULT_LOCALE)
                .shareConnections()
                .maxConnectionsPerHost(20);

        if (!token.isBlank()) {
            builder = builder.authorizationHeader("Bearer " + token);
        }
        return builder;
    }
}

