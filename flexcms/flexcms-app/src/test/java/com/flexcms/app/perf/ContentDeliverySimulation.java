package com.flexcms.app.perf;

import io.gatling.javaapi.core.*;
import io.gatling.javaapi.http.*;

import java.time.Duration;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

/**
 * Gatling simulation for the headless content-delivery API.
 *
 * <p>Tests {@code GET /api/content/v1/pages/{path}} and
 * {@code GET /api/content/v1/pages/children/{path}} under three load profiles:</p>
 * <ul>
 *   <li><b>Smoke</b>   — 1 user, quick sanity check</li>
 *   <li><b>Load</b>    — ramp to 50 concurrent users over 60 s, sustain 120 s</li>
 *   <li><b>Stress</b>  — ramp to 200 users over 120 s to find saturation point</li>
 * </ul>
 *
 * <p>Thresholds (assertions) fail the build if violated:</p>
 * <ul>
 *   <li>p95 response time ≤ 500 ms</li>
 *   <li>Success rate ≥ 99%</li>
 * </ul>
 */
public class ContentDeliverySimulation extends Simulation {

    // ── Feeders ─────────────────────────────────────────────────────────────

    FeederBuilder<String> pathFeeder = csv("gatling/feeders/content-paths.csv").circular();

    // ── HTTP Protocol ────────────────────────────────────────────────────────

    HttpProtocolBuilder protocol = GatlingConfig.baseProtocol();

    // ── Scenarios ────────────────────────────────────────────────────────────

    ScenarioBuilder getPageScenario = scenario("Get Page")
            .feed(pathFeeder)
            .exec(
                http("GET page by path")
                        .get("/api/content/v1/pages/#{path}")
                        .header("X-FlexCMS-Site", GatlingConfig.DEFAULT_SITE)
                        .check(
                                status().in(200, 404),     // 404 is valid for missing content
                                responseTimeInMillis().lte(2000)
                        )
            )
            .pause(Duration.ofMillis(200), Duration.ofMillis(800));

    ScenarioBuilder browseChildrenScenario = scenario("Browse Children")
            .feed(pathFeeder)
            .exec(
                http("GET children")
                        .get("/api/content/v1/pages/children/#{path}")
                        .queryParam("depth", "2")
                        .check(status().in(200, 404))
            )
            .pause(Duration.ofMillis(100), Duration.ofMillis(500));

    ScenarioBuilder navigationScenario = scenario("Navigation")
            .exec(
                http("GET navigation tree")
                        .get("/api/content/v1/navigation/" + GatlingConfig.DEFAULT_SITE + "/en/3")
                        .check(status().in(200, 404))
            )
            .pause(Duration.ofMillis(500), Duration.ofMillis(1500));

    // ── Load profile (select via -Dgatling.profile=smoke|load|stress) ────────

    private static final String PROFILE =
            System.getProperty("gatling.profile", "load");

    {
        PopulationBuilder pages;
        PopulationBuilder children;
        PopulationBuilder nav;

        switch (PROFILE) {
            case "smoke" -> {
                pages    = getPageScenario.injectOpen(atOnceUsers(1));
                children = browseChildrenScenario.injectOpen(atOnceUsers(1));
                nav      = navigationScenario.injectOpen(atOnceUsers(1));
            }
            case "stress" -> {
                pages    = getPageScenario.injectOpen(
                        rampUsers(200).during(Duration.ofSeconds(120)),
                        constantUsersPerSec(50).during(Duration.ofSeconds(60))
                );
                children = browseChildrenScenario.injectOpen(
                        rampUsers(50).during(Duration.ofSeconds(60))
                );
                nav      = navigationScenario.injectOpen(
                        constantUsersPerSec(10).during(Duration.ofSeconds(120))
                );
            }
            default -> { // load
                pages    = getPageScenario.injectOpen(
                        nothingFor(Duration.ofSeconds(5)),
                        rampUsers(50).during(Duration.ofSeconds(60)),
                        constantUsersPerSec(20).during(Duration.ofSeconds(120))
                );
                children = browseChildrenScenario.injectOpen(
                        nothingFor(Duration.ofSeconds(10)),
                        rampUsers(20).during(Duration.ofSeconds(60))
                );
                nav      = navigationScenario.injectOpen(
                        nothingFor(Duration.ofSeconds(5)),
                        constantUsersPerSec(5).during(Duration.ofSeconds(120))
                );
            }
        }

        setUp(pages, children, nav)
                .protocols(protocol)
                // Assertions — fail the test if thresholds are breached
                .assertions(
                        global().responseTime().percentile(95).lte(500),
                        global().successfulRequests().percent().gte(99.0),
                        global().responseTime().mean().lte(200),
                        forAll().responseTime().percentile(99).lte(1000)
                );
    }
}

