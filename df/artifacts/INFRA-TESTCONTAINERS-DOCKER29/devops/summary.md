# INFRA-TESTCONTAINERS-DOCKER29 — devops summary

Migrated the repository off the pinned Testcontainers 1.19.8 line onto the
Spring Boot-managed 2.x line, and bound the four `*IT` suites to a build stage
that actually gates. All four now run and pass on Docker Engine 29+, where the old
line could not start a container at all.

## Run of record

| | |
|---|---|
| Date | 2026-08-22 local (CEDT) |
| Command | `cd flexcms && mvn clean verify` |
| Result | **BUILD SUCCESS** — 552 tests, 0 failures, 0 errors |
| Unit tests (surefire) | 505 |
| Integration tests (failsafe) | **47** |
| Docker | Engine **29.7.2**, API 1.55, min 1.40 — the version that rejected 1.19.8's docker-java |
| Testcontainers | **2.0.5**, inherited from `spring-boot-starter-parent:4.1.0` |
| JDK | 26 (`JAVA_HOME` must point at JDK 26 — see `hints_for_agent.md`) |

## AC1 — all four suites run and pass on Docker 29+

From the `mvn clean verify` run of record:

| Suite | Tests | Failures | Errors | Time |
|---|---:|---:|---:|---:|
| `ContentNodeRepositoryIT` (`flexcms-core`) | 19 | 0 | 0 | 6.3 s |
| `ProductRepositoryIT` (`flexcms-pim`) | 13 | 0 | 0 | 7.0 s |
| `ReplicationAgentIT` (`flexcms-replication`) | 8 | 0 | 0 | 19.5 s |
| `ReplicationReceiverIT` (`flexcms-replication`) | 7 | 0 | 0 | 16.3 s |
| **Total** | **47** | **0** | **0** | |

Every one of these was executing for the **first time**; none had ever run in this
repository.

## AC2 — the stage gates, proven by deliberate breakage

`ContentNodeRepository.deleteSubtree` was temporarily reduced to delete only the
named node, dropping the descendant clause — i.e. exactly the regression
`BUG-CONTENT-DELETE` was:

```java
// probe (reverted): @Query("DELETE FROM content_nodes WHERE path::text = :pathPrefix")
// real:             @Query("DELETE FROM content_nodes WHERE path::text = :pathPrefix
//                          OR path::text LIKE :pathPrefix || '.%'")
```

`mvn verify -pl flexcms-core` then failed, naming three tests:

```
[ERROR] Tests run: 19, Failures: 3, Errors: 0 -- in ContentNodeRepositoryIT
[ERROR]   ContentNodeRepositoryIT.deleteSubtree_removesNodeAndAllDescendants:191
[ERROR]   ContentNodeRepositoryIT.deleteSubtree_returnsTheNumberOfRowsRemoved:206
[ERROR]   ContentNodeRepositoryIT.deleteSubtree_leavesSiblingsWithASharedNamePrefixUntouched:221
[INFO] BUILD FAILURE
[ERROR] Failed to execute goal maven-failsafe-plugin:3.5.6:verify … There are test failures.
```

`deleteSubtree_removesNodeAndAllDescendants` is the test the task description
predicted "would have caught `BUG-CONTENT-DELETE` long ago". It now does.

The probe was reverted from a byte-level backup and re-verified:
`live == pre-probe backup == HEAD`, `@Modifying` and the descendant clause intact,
`mvn verify -pl flexcms-core` → 19/19, **BUILD SUCCESS**.

## AC3 — pre-push validation documents the stage

`CLAUDE.md` now carries the integration stage as its own step:

- **Step 2** relabelled to "Backend unit tests", with an explicit note that
  surefire's default includes never match `*IT`, so `mvn test` runs no integration
  test at all. The previous label read "Backend unit + integration tests", which
  was false and is part of why these suites went unnoticed.
- **Step 3 (new)** — "Backend integration tests (`*IT`, Testcontainers — Docker
  must be running)": `cd flexcms && mvn verify`, naming all four suites and noting
  that `verify` re-runs the unit tests, and that each suite starts its own
  container so the local compose stack need not be up.
- Steps 3–5 renumbered to 4–6.
- The Mandatory Workflow table gained row **6b. Integration Tests**.

## AC4 — the 1.19.8 constraint is gone

The parent pom's `testcontainers-bom` entry and its `KNOWN CONSTRAINT` comment were
removed outright rather than version-bumped, so Testcontainers is now whatever the
Spring Boot parent manages (2.0.5 for Boot 4.1.0) and cannot drift from it.

## What the migration actually required

Verified against the artifacts rather than assumed:

| Question | Answer |
|---|---|
| Does Boot 4.1 manage Testcontainers? | Yes — `spring-boot-dependencies-4.1.0.pom` sets `testcontainers.version=2.0.5` and imports `testcontainers-bom` |
| What renames? | Every module artifactId gains a `testcontainers-` prefix (`junit-jupiter` → `testcontainers-junit-jupiter`, `postgresql` → `testcontainers-postgresql`, `rabbitmq` → `testcontainers-rabbitmq`). The base artifact stays `org.testcontainers:testcontainers` |
| Do the Java packages move? | 2.x keeps `org.testcontainers.containers.*` as **`Deprecated: true`** aliases and adds `org.testcontainers.postgresql` / `org.testcontainers.rabbitmq`. Confirmed by `javap` on the 2.0.5 jars |
| API differences? | The new classes drop the `SELF` self-type generic, so `PostgreSQLContainer<?>` becomes `PostgreSQLContainer` and `new PostgreSQLContainer<>(…)` becomes `new PostgreSQLContainer(…)` |

## Files changed

| File | Change |
|---|---|
| `flexcms/pom.xml` | Removed the `testcontainers-bom` 1.19.8 pin and its constraint comment; added `maven-failsafe-plugin` bound to `integration-test` + `verify` with a `**/*IT.java` include |
| `flexcms/flexcms-core/pom.xml` | Coordinates renamed to the 2.x names |
| `flexcms/flexcms-pim/pom.xml` | Coordinates renamed to the 2.x names |
| `flexcms/flexcms-replication/pom.xml` | Coordinates renamed to the 2.x names |
| `ContentNodeRepositoryIT`, `ProductRepositoryIT`, `ReplicationAgentIT`, `ReplicationReceiverIT` | Imports moved to the non-deprecated 2.x packages; self-type generics dropped |
| `flexcms-pim/src/test/resources/db/it/pim-extensions.sql` | **New** — provisions `uuid-ossp` + `pg_trgm` in the IT container, mirroring `ci.yml` and `init-db.sql` |
| `ProductRepositoryIT` | Container `.withInitScript(...)`; `@BeforeEach` purge switched to `deleteAllInBatch()` so the suite does not hydrate seeded rows |
| `PimTestApplication` | Component scan narrowed to `com.flexcms.pim.config` |
| `ReplicationTestApplication` | Added `@EntityScan` + `@EnableJpaRepositories` for the core packages and a Jackson 2 `ObjectMapper` bean mirroring `JacksonConfig` |
| `ReplicationAgentIT` | Three queue reads use the typed `receiveAndConvert(…, ParameterizedTypeReference)` overload |
| `CLAUDE.md` | Pre-push validation step 3 + workflow row 6b; step 2 mislabel corrected |

`maven-failsafe-plugin` is declared without an explicit version, taking the
`3.5.6` the Spring Boot parent manages, consistent with how the other plugins in
this pom are declared.

## Findings

One product defect and four test-context gaps, all detailed with evidence in
[`blockers.md`](blockers.md):

| ID | Summary | Lane |
|---|---|---|
| `I29-1` | **The PIM sample seed writes `products.status = 'ACTIVE'`, which `ProductStatus` does not define** — all 4 seeded TUT products are unreadable through JPA in the live database, not just in tests. Will also block `REB-23`. | `backend-dev` + `sa` |
| `G-1` | PIM IT container had no `uuid-ossp`/`pg_trgm` (extensions are provisioned per-environment here, and nobody did it for a bare container) | fixed here |
| `G-2` | Library-module test slices booted the whole module, failing on `DamClient` then `ObjectMapper` | fixed here |
| `G-3` | Replication slice lacked the core JPA layer, and Boot 4.1 auto-configures **Jackson 3** while the codebase injects **Jackson 2** | fixed here |
| `G-4` | `ReplicationAgentIT` read the queue untyped, tripping AMQP trusted-package checks that production avoids via `@RabbitListener` | fixed here |

## Reruns and corrections

The four suites needed seven runs to go green. Every failure was either a real
defect or a gap in test wiring — none was flakiness, and no check was skipped:

1. **Run 1** — `ContentNodeRepositoryIT` passed immediately (19/19), proving the
   2.x migration itself. `ProductRepositoryIT` errored 13/13 on
   `uuid_generate_v4()`; the build failed, which already demonstrated the gate.
2. **Runs 2–4** (PIM) — extensions (`G-1`), then `DamClient` (`G-2` first attempt,
   too shallow: excluding only the component models let the scan reach the service
   graph and fail on `ObjectMapper`), then the narrowed scan, then `I29-1` via
   `deleteAll()` hydration.
3. **Runs 5–6** (replication) — core repositories and Jackson 2 (`G-3`), including
   two mistakes of mine: `@EntityScan` imported from its pre-Boot-4 package, and
   `RabbitTemplate` never imported because the file uses a wildcard
   `org.springframework.amqp.core.*` that does not cover `rabbit.core`. The first
   surfaced as a *runtime* "Unresolved compilation problems" because a stale
   IDE-compiled class shadowed the change — hence `clean verify` thereafter.
4. **Run 7** — `mvn clean verify`, whole reactor: 552 tests, 0 failures.
5. **AC2 probe** — deliberate break → `BUILD FAILURE`; reverted → green.

## Reproducing

```bash
# Docker Desktop must be running (Engine 29+ is fine).
export JAVA_HOME="/c/Program Files/Java/jdk-26.0.2.1"
cd flexcms && mvn clean verify
```

No local compose stack is required: each suite starts its own
`postgres:16-alpine` / `rabbitmq:3.13-management-alpine` container.
