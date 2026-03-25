package com.flexcms.app.perf;

import io.gatling.javaapi.core.*;
import io.gatling.javaapi.http.*;

import java.time.Duration;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

/**
 * Gatling simulation for the full-text search API.
 *
 * <p>Tests {@code GET /api/content/v1/search} and
 * {@code GET /api/content/v1/search/facets} under realistic search traffic.</p>
 *
 * <p>Search workloads tend to be bursty (users type then pause).
 * This simulation models that with short think times and a warm-up ramp.</p>
 *
 * <p>Assertions:</p>
 * <ul>
 *   <li>p95 ≤ 800 ms (search is heavier than page delivery)</li>
 *   <li>Success rate ≥ 99%</li>
 * </ul>
 */
public class SearchApiSimulation extends Simulation {

    // ── Feeders ─────────────────────────────────────────────────────────────

    FeederBuilder<String> queryFeeder =
            csv("gatling/feeders/search-queries.csv").random();

    // ── HTTP Protocol ────────────────────────────────────────────────────────

    HttpProtocolBuilder protocol = GatlingConfig.baseProtocol();

    // ── Scenarios ────────────────────────────────────────────────────────────

    ScenarioBuilder basicSearchScenario = scenario("Basic Search")
            .feed(queryFeeder)
            .exec(
                http("GET search")
                        .get("/api/content/v1/search")
                        .queryParam("q", "#{query}")
                        .queryParam("page", "0")
                        .queryParam("size", "20")
                        .check(
                                status().is(200),
                                jsonPath("$.totalCount").exists(),
                                responseTimeInMillis().lte(3000)
                        )
            )
            .pause(Duration.ofMillis(500), Duration.ofSeconds(2));

    ScenarioBuilder facetedSearchScenario = scenario("Faceted Search")
            .feed(queryFeeder)
            .exec(
                http("GET search with facets")
                        .get("/api/content/v1/search/facets")
                        .queryParam("q", "#{query}")
                        .queryParam("siteId", GatlingConfig.DEFAULT_SITE)
                        .queryParam("locale", GatlingConfig.DEFAULT_LOCALE)
                        .queryParam("page", "0")
                        .queryParam("size", "20")
                        .check(
                                status().is(200),
                                jsonPath("$.totalCount").exists()
                        )
            )
            .pause(Duration.ofSeconds(1), Duration.ofSeconds(3));

    ScenarioBuilder pimSearchScenario = scenario("PIM Product Search")
            .feed(queryFeeder)
            .exec(
                http("GET PIM products")
                        .get("/api/pim/v1/products")
                        .queryParam("search", "#{query}")
                        .queryParam("page", "0")
                        .queryParam("size", "25")
                        .check(status().in(200, 401))  // 401 if auth required
            )
            .pause(Duration.ofMillis(800), Duration.ofSeconds(2));

    // ── Load profiles ────────────────────────────────────────────────────────

    private static final String PROFILE =
            System.getProperty("gatling.profile", "load");

    {
        PopulationBuilder basic;
        PopulationBuilder faceted;
        PopulationBuilder pim;

        switch (PROFILE) {
            case "smoke" -> {
                basic   = basicSearchScenario.injectOpen(atOnceUsers(1));
                faceted = facetedSearchScenario.injectOpen(atOnceUsers(1));
                pim     = pimSearchScenario.injectOpen(atOnceUsers(1));
            }
            case "stress" -> {
                basic   = basicSearchScenario.injectOpen(
                        rampUsers(100).during(Duration.ofSeconds(60)),
                        constantUsersPerSec(30).during(Duration.ofSeconds(120))
                );
                faceted = facetedSearchScenario.injectOpen(
                        rampUsers(30).during(Duration.ofSeconds(60)),
                        constantUsersPerSec(10).during(Duration.ofSeconds(120))
                );
                pim     = pimSearchScenario.injectOpen(
                        rampUsers(20).during(Duration.ofSeconds(60))
                );
            }
            default -> { // load
                basic   = basicSearchScenario.injectOpen(
                        nothingFor(Duration.ofSeconds(5)),
                        rampUsers(30).during(Duration.ofSeconds(60)),
                        constantUsersPerSec(10).during(Duration.ofSeconds(90))
                );
                faceted = facetedSearchScenario.injectOpen(
                        nothingFor(Duration.ofSeconds(10)),
                        rampUsers(10).during(Duration.ofSeconds(60))
                );
                pim     = pimSearchScenario.injectOpen(
                        nothingFor(Duration.ofSeconds(5)),
                        rampUsers(10).during(Duration.ofSeconds(60))
                );
            }
        }

        setUp(basic, faceted, pim)
                .protocols(protocol)
                .assertions(
                        global().responseTime().percentile(95).lte(800),
                        global().successfulRequests().percent().gte(99.0),
                        global().responseTime().mean().lte(300)
                );
    }
}

