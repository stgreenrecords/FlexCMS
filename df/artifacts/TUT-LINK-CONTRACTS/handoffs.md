# Handoffs - TUT-LINK-CONTRACTS

## 2026-07-11 21:21 CEST - backend-dev to data-engineer

- Task id: `TUT-LINK-CONTRACTS`
- Current state: `DONE`
- Previous role result: backend-dev completed V18 canonical link schemas, actual-migration/public-registry coverage, PostgreSQL 16 proof, all Maven gates, and Docker image/runtime verification.
- Files changed: `flexcms/flexcms-app/src/main/resources/db/migration/V18__correct_tut_usa_link_contracts.sql`, `flexcms/flexcms-app/src/test/java/com/flexcms/app/migration/TutUsaLinkContractMigrationTest.java`, `flexcms/Dockerfile`, and `df/artifacts/TUT-LINK-CONTRACTS/backend/` evidence.
- Checks performed: focused test 2/2 PASS; full Maven tests 495/495 PASS; clean compile/install PASS; PostgreSQL 16 migration harness PASS; Docker build 37/37 PASS; Java 26/non-root/launcher/V18 image validation PASS; scoped diff check PASS.
- Known risk/blocker: the generic admin editor has limited nested-object editing, but this does not block seed generation or the public contract. No remaining delivery blocker.
- Next role instructions: data-engineer starts `TUT-LINK-SEED`, authors every navigable seed value as the V18 `{label,url,openInNewTab?}` shape, creates/validates all internal destinations before writes, and captures idempotent live reseed evidence. Preserve V18 and do not weaken its non-empty constraints.

## 2026-07-11 18:20 CEST - backend-dev to factory/human

- Task id: `TUT-LINK-CONTRACTS`
- Current state: `BLOCKED`
- Previous role result: backend-dev completed V18, automated migration/public-registry coverage, PostgreSQL 16 execution proof, and all Maven build/test/package gates.
- Files changed: `flexcms/flexcms-app/src/main/resources/db/migration/V18__correct_tut_usa_link_contracts.sql`, `flexcms/flexcms-app/src/test/java/com/flexcms/app/migration/TutUsaLinkContractMigrationTest.java`, and `df/artifacts/TUT-LINK-CONTRACTS/backend/` evidence.
- Checks performed: focused test 2/2 PASS; full Maven tests 495/495 PASS; clean compile PASS; clean install PASS; PostgreSQL 16 migration harness PASS; IDE diagnostics PASS.
- Known risk/blocker: mandatory `docker build -t flexcms-app:local-test .` cannot reach Docker Hub. BuildKit failed with `DeadlineExceeded`; legacy and explicit base-image pulls timed out. Required uncached images are `docker/dockerfile:1`, `maven:3.9-eclipse-temurin-21-alpine`, and `eclipse-temurin:21-jre-alpine`.
- Next role instructions: restore Docker Hub connectivity and rerun `cd flexcms && docker build -t flexcms-app:local-test .`. If it passes, backend-dev may transition `BLOCKED -> DEV_IN_PROGRESS -> DONE`, refresh runtime evidence, and unblock data-engineer task `TUT-LINK-SEED`. Do not start `TUT-LINK-SEED` while this dependency remains blocked.

