# Elasticsearch actuator health remediation

## Scope

Fix the local Elasticsearch 8 / Spring Boot 4.1 Elasticsearch Java client 9.4.2 media-type incompatibility that made aggregate `/actuator/health` return `503` while liveness/readiness remained `UP`. This is independent of REB-09/REB-10 frontend rendering.

## Implementation

- Added `flexcms/flexcms-app/src/main/java/com/flexcms/app/config/ElasticsearchHealthConfiguration.java`.
- The bean intentionally replaces Boot's auto-configured `elasticsearchHealthContributor` by name.
- It probes `/_cluster/health` with the configured low-level `Rest5Client` and plain `application/json` request headers, avoiding the client 9 versioned media type rejected by Elasticsearch 8.
- It preserves dependency semantics: 2xx is `UP`, non-2xx and transport exceptions are `DOWN`.
- Response entities are consumed to allow HTTP connection reuse.
- Added unit coverage in `flexcms/flexcms-app/src/test/java/com/flexcms/app/config/ElasticsearchHealthConfigurationTest.java`.

## Validation scenarios

1. Successful cluster-health response produces `UP` and sends plain JSON headers.
2. Non-2xx response produces `DOWN` with the status detail.
3. Transport failure produces `DOWN` with the exception.
4. Live Author and Publish aggregate, liveness, and readiness actuator endpoints are queried after rebuild/restart.

## Evidence

- `mvn -pl flexcms-app -am -Dtest=ElasticsearchHealthConfigurationTest -Dsurefire.failIfNoSpecifiedTests=false test`: PASS, 3 tests.
- `mvn clean compile`: PASS, all 16 Maven modules.
- Live Author (`8080`): aggregate/liveness/readiness all HTTP 200.
- Live Publish (`8081`): aggregate/liveness/readiness all HTTP 200.
- Elasticsearch `8.13.4` `/_cluster/health`: HTTP 200.

## 2026-07-11 12:43 local recheck

- Rebuilt processes are running from `mvn spring-boot:run -pl flexcms-app -am` with `author,local` on `8080` and `publish,local` on `8081`.
- Focused Maven test rerun: `3` tests, `0` failures, `0` errors; `BUILD SUCCESS`.
- Bounded live probe: all six Author/Publish actuator endpoints returned HTTP `200`.
- Direct Elasticsearch probe with `Accept: application/json` and `Content-Type: application/json` returned HTTP `200`, cluster status `yellow`.
- Fresh `.dev-logs/author.log` and `.dev-logs/publish.log` contain no `media_type_header_exception` or invalid-media-type error.

## Resolved validation blocker

The previously reported `flexcms-core` `ContentNodeServiceTest` blocker was resolved in the backend lane by supplying the missing transaction-manager test dependency and removing an unused strict stub. Production Elasticsearch health code was unaffected. The repository-wide `mvn test` gate now passes with exit code `0`.

