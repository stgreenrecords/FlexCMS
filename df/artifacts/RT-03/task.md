# RT-03 - Live API/DB retest — Content, Author CRUD, Headless REST, GraphQL against real stack + seed

## Summary

- Priority: P1
- Current state: OPEN
- Owner role: qa
- Legacy station: backlog

## Dependencies
- none

## Modules / scope
- `flexcms-core`
- `flexcms-author`
- `flexcms-headless`

## Read first
- `docs/RETEST_PLAN.md`
- `docs/QA_TEST_PLAN.md`

## Acceptance criteria
- Execute QA_TEST_PLAN Critical cases for CMS-*, AUTH-*, HEAD-*, GQL-* LIVE (not mocked)
- Each executed case has a saved request+response transcript; state-changing cases include before/after SQL
- 0 Critical failures; every failure filed as BUG-xx in 'ready'
- Evidence saved under docs/retest-runs/RT-03/

## Evidence requirements

- Record exact commands, environment, and results.
- Attach logs/screenshots/traces under this artifact folder when relevant.
- QA must independently verify; PO must accept before DONE.
