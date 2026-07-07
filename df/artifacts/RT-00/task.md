# RT-00 - Live test harness — make USE_LIVE_API truly disable ALL mocks + add stack-up Playwright project

## Summary

- Priority: P0
- Current state: DEV_IN_PROGRESS
- Owner role: devops
- Legacy station: build

## Dependencies
- none

## Modules / scope
- `apps/admin-e2e`

## Read first
- `docs/RETEST_PLAN.md`
- `frontend/apps/admin-e2e/src/fixtures/api-mocks.ts`
- `frontend/apps/admin-e2e/src/fixtures/base.fixture.ts`
- `frontend/apps/admin-e2e/playwright.config.ts`

## Acceptance criteria
- Every per-spec inline page.route('**/api/**') block is gated on USE_LIVE_API so it is skipped in live mode (currently only base.fixture honors it — 19 specs ignore it)
- A 'live' Playwright project exists that starts admin + real Author backend and runs with mocks OFF
- PROOF the harness catches breakage: with the backend stopped, the live project FAILS (attach trace showing the failure); with it running + seeded, it passes
- Fix the dead 'tutGbEnChildren' reference in api-mocks.ts (undefined import)
- Evidence saved under docs/retest-runs/RT-00/

## Evidence requirements

- Record exact commands, environment, and results.
- Attach logs/screenshots/traces under this artifact folder when relevant.
- QA must independently verify; PO must accept before DONE.
