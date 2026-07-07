# RT-04 - Demo site end-to-end render — all 61 pages render with components + images

## Summary

- Priority: P1
- Current state: OPEN
- Owner role: qa
- Legacy station: backlog

## Dependencies
- RT-00
- RT-01

## Modules / scope
- `apps/site-nextjs`

## Read first
- `docs/RETEST_PLAN.md`
- `scripts/live_smoke.py`
- `docs/QA_TEST_PLAN.md`

## Acceptance criteria
- All 61 seeded pages return HTTP 200 from site-nextjs and render their expected components (TUT-016→030, SDK-010→019 executed live)
- live_smoke image check passes for every page (0 broken images across the site)
- No React hydration errors in console on the sampled pages
- Per-page screenshots + a site-wide broken-image report (should be empty) saved under docs/retest-runs/RT-04/

## Evidence requirements

- Record exact commands, environment, and results.
- Attach logs/screenshots/traces under this artifact folder when relevant.
- QA must independently verify; PO must accept before DONE.
