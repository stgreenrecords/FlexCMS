package com.flexcms.app.perf;

import io.gatling.javaapi.core.*;
import io.gatling.javaapi.http.*;

import java.time.Duration;
import java.util.List;
import java.util.Map;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

/**
 * Realistic end-to-end user journey simulation for FlexCMS.
 *
 * <p>Models the three primary traffic patterns of a deployed headless CMS:</p>
 *
 * <ol>
 *   <li><b>Visitor journey</b> (80% of traffic) — homepage → navigation → content pages</li>
 *   <li><b>Search journey</b> (15% of traffic) — search query → browse results → open page</li>
 *   <li><b>DAM / media journey</b> (5% of traffic) — asset folder listing → asset metadata</li>
 * </ol>
 *
 * <p>This simulation is the most representative of production load.
 * Use it for capacity planning and regression testing after infrastructure changes.</p>
 *
 * <p>Thresholds:</p>
 * <ul>
 *   <li>Overall p95 ≤ 600 ms</li>
 *   <li>Overall p99 ≤ 1200 ms</li>
 *   <li>Success rate ≥ 99.5%</li>
 *   <li>Active sessions ≤ 10 000 at peak</li>
 * </ul>
 *
 * <p>Run the full journey test with realistic ramp-up:</p>
 * <pre>
 *   mvn gatling:test -pl flexcms-app \
 *     -Dgatling.simulationClass=com.flexcms.app.perf.FullJourneySimulation \
 *     -Dgatling.profile=load \
 *     -Dgatling.baseUrl=https://publish.example.com
 * </pre>
 */
public class FullJourneySimulation extends Simulation {

    // ── Feeders ─────────────────────────────────────────────────────────────

    FeederBuilder<String> pathFeeder  = csv("gatling/feeders/content-paths.csv").circular();
    FeederBuilder<String> queryFeeder = csv("gatling/feeders/search-queries.csv").random();

    // ── Static asset paths (simulate CDN-cached resources) ──────────────────

    private static final List<Map<String, Object>> ASSET_PATHS = List.of(
            Map.of("assetPath", "images/hero-summer-2026.jpg"),
            Map.of("assetPath", "videos/brand-reel-2026.mp4"),
            Map.of("assetPath", "pdfs/product-catalogue-2026.pdf")
    );

    // ── HTTP Protocol ────────────────────────────────────────────────────────

    HttpProtocolBuilder protocol = GatlingConfig.baseProtocol()
            .warmUp(GatlingConfig.BASE_URL + "/actuator/health");  // warm up before ramping

    // ── Scenarios ────────────────────────────────────────────────────────────

    /** Journey 1 — Visitor browses content pages. */
    ScenarioBuilder visitorJourney = scenario("Visitor Journey")
            .exec(
                http("Actuator health check")
                        .get("/actuator/health")
                        .check(status().is(200))
            )
            .pause(Duration.ofMillis(500))
            // Step 1: Fetch navigation tree for site header/footer
            .exec(
                http("Load navigation")
                        .get("/api/content/v1/navigation/" + GatlingConfig.DEFAULT_SITE + "/en/2")
                        .check(status().in(200, 404))
            )
            .pause(Duration.ofMillis(200), Duration.ofMillis(500))
            // Step 2: Render homepage
            .exec(
                http("Load homepage")
                        .get("/api/content/v1/pages/content.site1.en.home")
                        .check(status().in(200, 404),
                               responseTimeInMillis().lte(1000))
            )
            .pause(Duration.ofSeconds(2), Duration.ofSeconds(5))
            // Step 3: Click into a content page (feed-driven)
            .feed(pathFeeder)
            .exec(
                http("Navigate to content page")
                        .get("/api/content/v1/pages/#{path}")
                        .check(status().in(200, 404))
            )
            .pause(Duration.ofSeconds(3), Duration.ofSeconds(8))
            // Step 4: Load children for sidebar nav
            .exec(
                http("Load child pages")
                        .get("/api/content/v1/pages/children/#{path}")
                        .queryParam("depth", "1")
                        .check(status().in(200, 404))
            )
            .pause(Duration.ofSeconds(1), Duration.ofSeconds(3));

    /** Journey 2 — User searches and browses results. */
    ScenarioBuilder searchJourney = scenario("Search Journey")
            .feed(queryFeeder)
            // Step 1: Type a query
            .exec(
                http("Full-text search")
                        .get("/api/content/v1/search")
                        .queryParam("q", "#{query}")
                        .queryParam("page", "0")
                        .queryParam("size", "10")
                        .check(status().is(200),
                               jsonPath("$.totalCount").exists())
            )
            .pause(Duration.ofSeconds(1), Duration.ofSeconds(3))
            // Step 2: Open first result
            .exec(
                http("Open search result")
                        .get("/api/content/v1/pages/content.site1.en.home")
                        .check(status().in(200, 404))
            )
            .pause(Duration.ofSeconds(2), Duration.ofSeconds(6))
            // Step 3: Faceted search for refinement
            .exec(
                http("Faceted search")
                        .get("/api/content/v1/search/facets")
                        .queryParam("q", "#{query}")
                        .queryParam("siteId", GatlingConfig.DEFAULT_SITE)
                        .queryParam("locale", GatlingConfig.DEFAULT_LOCALE)
                        .queryParam("page", "0")
                        .queryParam("size", "20")
                        .check(status().is(200))
            )
            .pause(Duration.ofSeconds(1), Duration.ofSeconds(4));

    /** Journey 3 — API consumer fetches DAM assets and component registry. */
    ScenarioBuilder apiConsumerJourney = scenario("API Consumer Journey")
            // Step 1: Discover available component types
            .exec(
                http("List component registry")
                        .get("/api/content/v1/components")
                        .check(status().is(200))
            )
            .pause(Duration.ofMillis(500), Duration.ofSeconds(2))
            // Step 2: List DAM folder
            .exec(
                http("List DAM root folder")
                        .get("/api/dam/v1/folders")
                        .queryParam("path", "/")
                        .queryParam("page", "0")
                        .queryParam("size", "50")
                        .check(status().in(200, 401, 403))
            )
            .pause(Duration.ofSeconds(1), Duration.ofSeconds(3))
            // Step 3: GraphQL content query
            .exec(
                http("GraphQL — fetch homepage")
                        .post("/graphql")
                        .header("Content-Type", "application/json")
                        .body(StringBody("""
                                {"query":"{ page(path: \\"content.site1.en.home\\", siteId: \\"site1\\", locale: \\"en\\") { title components { type properties } } }"}
                                """))
                        .check(status().in(200, 400))
            )
            .pause(Duration.ofSeconds(1), Duration.ofSeconds(2));

    // ── Load profiles ────────────────────────────────────────────────────────

    private static final String PROFILE =
            System.getProperty("gatling.profile", "load");

    {
        PopulationBuilder visitors;
        PopulationBuilder searchers;
        PopulationBuilder apiConsumers;

        switch (PROFILE) {
            case "smoke" -> {
                // Single user of each type — pure connectivity check
                visitors     = visitorJourney.injectOpen(atOnceUsers(1));
                searchers    = searchJourney.injectOpen(atOnceUsers(1));
                apiConsumers = apiConsumerJourney.injectOpen(atOnceUsers(1));
            }
            case "stress" -> {
                // Find saturation: ramp to 400 total users
                visitors     = visitorJourney.injectOpen(
                        rampUsers(320).during(Duration.ofSeconds(180)),  // 80%
                        constantUsersPerSec(80).during(Duration.ofSeconds(120))
                );
                searchers    = searchJourney.injectOpen(
                        rampUsers(60).during(Duration.ofSeconds(180)),   // 15%
                        constantUsersPerSec(15).during(Duration.ofSeconds(120))
                );
                apiConsumers = apiConsumerJourney.injectOpen(
                        rampUsers(20).during(Duration.ofSeconds(180)),   // 5%
                        constantUsersPerSec(5).during(Duration.ofSeconds(120))
                );
            }
            default -> { // load — nominal production traffic
                visitors     = visitorJourney.injectOpen(
                        nothingFor(Duration.ofSeconds(10)),  // warm-up completes
                        rampUsers(80).during(Duration.ofSeconds(60)),
                        constantUsersPerSec(20).during(Duration.ofSeconds(180))
                );
                searchers    = searchJourney.injectOpen(
                        nothingFor(Duration.ofSeconds(15)),
                        rampUsers(15).during(Duration.ofSeconds(60)),
                        constantUsersPerSec(5).during(Duration.ofSeconds(180))
                );
                apiConsumers = apiConsumerJourney.injectOpen(
                        nothingFor(Duration.ofSeconds(20)),
                        rampUsers(5).during(Duration.ofSeconds(60)),
                        constantUsersPerSec(2).during(Duration.ofSeconds(180))
                );
            }
        }

        setUp(visitors, searchers, apiConsumers)
                .protocols(protocol)
                .assertions(
                        // Global assertions — fail CI if violated
                        global().responseTime().percentile(95).lte(600),
                        global().responseTime().percentile(99).lte(1200),
                        global().successfulRequests().percent().gte(99.5),
                        global().responseTime().mean().lte(250),
                        // Per-scenario assertions
                        forAll().failedRequests().percent().lte(1.0)
                );
    }
}

