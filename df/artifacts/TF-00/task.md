# TF-00 - Test framework foundation — live fixture (mocks OFF), typed API client, POM base, config projects, reporting

## Summary

- Priority: P0
- Current state: READY_FOR_DEV
- Owner role: devops
- Legacy station: ready

## Dependencies
- RT-00

## Modules / scope
- `apps/admin-e2e`

## Read first
- `docs/TEST_FRAMEWORK.md`
- `docs/RETEST_PLAN.md`
- `frontend/apps/admin-e2e/playwright.config.ts`
- `frontend/apps/admin-e2e/src/pages/BasePage.ts`

## Acceptance criteria
- src/fixtures/live.fixture.ts: real backend, mocks OFF, seed baseline ensured in beforeAll; a stopped backend makes tests FAIL
- src/fixtures/api.ts: typed API client (create/get/update/delete node, publish, upload asset, PIM ops) used to arrange state and assert backend truth
- BasePage + POM conventions documented; specs use only POM methods + data-testid constants (no raw selectors)
- playwright.config.ts exposes projects: chromium/firefox/webkit + a 'live' project; reporters = HTML + JUnit XML + trace-on-failure
- Directory layout matches docs/TEST_FRAMEWORK.md §3 (tests/api, tests/admin, tests/site, tests/visual)
- One end-to-end reference spec proves the stack: create page via API -> open editor -> edit field -> save -> assert via API + UI (mocks OFF)
- Evidence (trace + report) saved under docs/retest-runs/TF-00/

## Evidence requirements

- Record exact commands, environment, and results.
- Attach logs/screenshots/traces under this artifact folder when relevant.
- QA must independently verify; PO must accept before DONE.
