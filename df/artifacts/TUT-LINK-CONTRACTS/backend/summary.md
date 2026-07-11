# Backend delivery summary - TUT-LINK-CONTRACTS

## Result

Implementation is complete. All source, migration, focused, full Maven, packaging, PostgreSQL 16, Docker build, and image-runtime checks pass.

## Implementation

- Added forward-only CMS migration `V18__correct_tut_usa_link_contracts.sql`.
- Updated only the affected `data_schema.properties` entries via JSONB merge, preserving unrelated component fields.
- Canonical link objects require non-empty `label` and `url`; optional `openInNewTab` is supported.
- Corrected:
  - navigation `primaryLinks`, `utilityLinks`, and `accountEntry`;
  - footer `footerLinkGroups[].title`, nested `links`, `socialLinks`, and `legalLinks`;
  - featured-content `items`.
- Added automated coverage that parses the actual V18 payload, verifies every changed nested contract, verifies merge preservation, and calls the public component-registry controller through the real registry cache.
- Added a reproducible PostgreSQL 16 validation harness.
- Aligned the Docker builder/runtime with the repository's current Java 26 baseline and replaced removed Spring Boot 4 `layertools` usage with validated `tools` layered-launcher extraction.

## Files changed

- `flexcms/flexcms-app/src/main/resources/db/migration/V18__correct_tut_usa_link_contracts.sql`
- `flexcms/flexcms-app/src/test/java/com/flexcms/app/migration/TutUsaLinkContractMigrationTest.java`
- `flexcms/Dockerfile`
- `df/artifacts/TUT-LINK-CONTRACTS/backend/postgres-validation.sql`
- `df/artifacts/TUT-LINK-CONTRACTS/backend/summary.md`

## Test scenarios

1. V18 contains exactly the navigation, footer, and featured-content updates.
2. Navigation primary and utility collections expose link objects requiring non-empty `label` and `url`.
3. Navigation account entry exposes the same canonical link object.
4. Footer groups match seeded JSON (`title` plus nested `links`) and nested links use the canonical shape.
5. Footer social and legal links use the canonical shape.
6. Featured-content items use the canonical navigable-item shape.
7. Every canonical link permits optional boolean `openInNewTab`.
8. JSONB property merge preserves unrelated schema properties.
9. Public registry output exposes each migrated schema without shape changes.
10. V18 executes successfully against PostgreSQL 16 and updates exactly one row per affected resource type.
11. Full backend tests, clean compile, and clean install/package complete with zero failures/errors.
12. Backend Docker image builds with V18 packaged and runs on Java 26 as the non-root `flexcms` user.

## Evidence

- `mvn -pl flexcms-app -am -Dtest=TutUsaLinkContractMigrationTest -Dsurefire.failIfNoSpecifiedTests=false test` — PASS; 2 tests, 0 failures/errors/skips.
- `mvn test` — PASS; aggregated 495 tests, 0 failures, 0 errors, 0 skipped.
- `mvn clean compile` — PASS; all 16 reactor modules successful.
- `mvn clean install` — PASS; all 16 reactor modules successful; 495 tests, 0 failures/errors/skips; application JAR produced.
- PostgreSQL 16 (`postgres:16-alpine`) harness using `backend/postgres-validation.sql` — PASS; three `UPDATE 1` results and `POSTGRES_V18_VALIDATION=PASS`.
- IDE diagnostics for `TutUsaLinkContractMigrationTest.java` — PASS; no errors.
- `docker build -t flexcms-app:local-test .` — PASS; BuildKit completed all 37 steps and produced image `sha256:6ad0e0b7e0421abad6e666aa25dab52839f6a326b1614dd76f4072a8dff6a83a`.
- Image runtime validation — PASS; Temurin `26.0.1`, configured/running user `flexcms`, Boot launcher present, and `BOOT-INF/classes/db/migration/V18__correct_tut_usa_link_contracts.sql` present.
- `git diff --check` on task-owned source/evidence — PASS.

## Docker resolution

Mandatory command:

```bash
cd flexcms && docker build -t flexcms-app:local-test .
```

Initial attempts:

1. BuildKit: failed resolving `docker.io/docker/dockerfile:1` with `DeadlineExceeded: context deadline exceeded`.
2. Legacy builder (`DOCKER_BUILDKIT=0`): timed out resolving/pulling uncached base images.
3. Explicit pulls for `docker/dockerfile:1`, `maven:3.9-eclipse-temurin-21-alpine`, and `eclipse-temurin:21-jre-alpine`: timed out after 300 seconds before the project build ran.

On retry, Docker Hub connectivity recovered and all original images became available. The build then exposed pre-existing drift from the working tree's Java 26/Spring Boot 4 upgrade: Java 21 could not compile release 26, and Boot 4 no longer supports `layertools`. Official Java 26 builder/runtime images were verified and the actual packaged JAR confirmed `tools extract --layers --launcher` produces the four directories consumed by the runtime image. After those minimal Dockerfile corrections, the exact mandatory build and image-runtime validation passed.

## Risks and rollback

- The generic admin editor has limited nested-object editing; this is documented architecture risk, not a reason to weaken the registry contract.
- V18 is immutable once applied. Rollback must be a new forward migration restoring prior schemas.

