# RT-07 - Admin UI journeys in LIVE mode — tree, DAM, PIM, sites, preview, workflows

## Summary

- Priority: P2
- Current state: OPEN
- Owner role: qa
- Legacy station: backlog

## Dependencies
- RT-00

## Modules / scope
- `apps/admin`
- `apps/admin-e2e`

## Read first
- `docs/RETEST_PLAN.md`
- `docs/QA_TEST_PLAN.md`

## Acceptance criteria
- Re-run UI-001→105 with USE_LIVE_API on (mocks OFF) against the seeded backend
- Every 'No mock data' case (UI-019/051/061/068/086/095) verified for real via network inspection
- Traces for failed/edge journeys saved under docs/retest-runs/RT-07/; failures filed as BUG-xx

## Evidence requirements

- Record exact commands, environment, and results.
- Attach logs/screenshots/traces under this artifact folder when relevant.
- QA must independently verify; PO must accept before DONE.
