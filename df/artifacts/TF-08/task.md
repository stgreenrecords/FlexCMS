# TF-08 - Reporting + CI stack-up gate + JUnit artifacts + test tagging

## Summary

- Priority: P1
- Current state: OPEN
- Owner role: devops
- Legacy station: backlog

## Dependencies
- TF-01
- TF-02

## Modules / scope
- `.github/workflows`
- `apps/admin-e2e`

## Read first
- `docs/TEST_FRAMEWORK.md`
- `.github/workflows/ci.yml`
- `.github/workflows/e2e.yml`

## Acceptance criteria
- CI job spins up full stack (Postgres/Redis/RabbitMQ/MinIO + Author + Publish + admin + site) and seeds data
- Runs L2 API + L3 UI + L4 site + live_smoke.py; publishes HTML report + JUnit XML + traces as artifacts
- Build FAILS on any test failure or broken image (prove with a deliberate red run)
- Tags wired (@smoke/@regression/@visual/@a11y) so selective runs work
- Evidence (CI run) under docs/retest-runs/TF-08/

## Evidence requirements

- Record exact commands, environment, and results.
- Attach logs/screenshots/traces under this artifact folder when relevant.
- QA must independently verify; PO must accept before DONE.
