# RT-05 - DAM + PIM live retest — upload/renditions/asset ops + catalogs/products/import/schema

## Summary

- Priority: P1
- Current state: OPEN
- Owner role: qa
- Legacy station: backlog

## Dependencies
- RT-00

## Modules / scope
- `flexcms-dam`
- `flexcms-pim`
- `apps/admin-e2e`

## Read first
- `docs/RETEST_PLAN.md`
- `docs/QA_TEST_PLAN.md`

## Acceptance criteria
- DAM-* and PIM-* Critical/High cases executed LIVE (real MinIO + flexcms_pim)
- Admin DAM browser + PIM pages (UI-038→079) exercised with mocks OFF
- 0 Critical failures; failures filed as BUG-xx; evidence under docs/retest-runs/RT-05/

## Evidence requirements

- Record exact commands, environment, and results.
- Attach logs/screenshots/traces under this artifact folder when relevant.
- QA must independently verify; PO must accept before DONE.
