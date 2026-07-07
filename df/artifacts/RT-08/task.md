# RT-08 - Evidence gate — wire live_smoke.py into CI stack-up job + factory validate usage

## Summary

- Priority: P2
- Current state: OPEN
- Owner role: devops
- Legacy station: backlog

## Dependencies
- RT-00

## Modules / scope
- `.github/workflows`
- `scripts`

## Read first
- `docs/RETEST_PLAN.md`
- `scripts/live_smoke.py`
- `.github/workflows/ci.yml`

## Acceptance criteria
- A CI job starts Postgres/Redis/RabbitMQ/MinIO + Author + admin/site, seeds data, and runs scripts/live_smoke.py
- The job FAILS the build on any broken image or failed edit round-trip (prove with a deliberate red run)
- docs/RETEST_PLAN.md §5 and FACTORY.md Definition of Done reference the gate
- Evidence (CI run link/log) under docs/retest-runs/RT-08/

## Evidence requirements

- Record exact commands, environment, and results.
- Attach logs/screenshots/traces under this artifact folder when relevant.
- QA must independently verify; PO must accept before DONE.
