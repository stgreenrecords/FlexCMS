## 2026-07-11 local - frontend-dev handoff

- Task: `CONTENT-PUBLISH-DOUBLECLICK`
- State: `DEV_IN_PROGRESS` (implementation complete; browser verification blocked by local Playwright browser installation)
- Result: Added page-only double-click publish-tab behavior and focused E2E coverage.
- Files changed: `frontend/apps/admin/src/app/(admin)/content/page.tsx`, `frontend/apps/admin-e2e/tests/phase1-critical/content-tree.spec.ts`.
- Evidence: Full `cd frontend && pnpm build` passed. Focused Playwright suite could not launch because the Chromium executable is absent; two install attempts exceeded the terminal timeout.
- Risks: Default target is the documented Publish API at `http://localhost:8081`; deployments can set `NEXT_PUBLIC_PUBLISH_URL`. The backend publish service is headless JSON-only per architecture, so a browser-rendered publish frontend should be supplied through that environment variable if required.
- Next action: Install/restore the Playwright Chromium runtime and rerun the focused suite, then run the required admin E2E smoke/full gates.

## 2026-07-11 local - frontend-dev follow-up

- Task: `CONTENT-PUBLISH-DOUBLECLICK`
- State: `DEV_IN_PROGRESS`
- Result: Fixed the event-order defect by deferring page-row single-click navigation and cancelling it on double-click; folder rows remain immediate-navigation.
- Files changed: `frontend/apps/admin/src/app/(admin)/content/page.tsx`, `frontend/apps/admin-e2e/tests/phase1-critical/content-tree.spec.ts`.
- Evidence: `cd frontend && pnpm build` PASS (9/9 tasks). Focused Playwright suite attempted and blocked at browser launch because Chromium is not installed.
- Next action: Install the Playwright Chromium runtime and rerun UI-016b plus the required admin smoke/full gates.
- Risks: Publish URL remains configurable through `NEXT_PUBLIC_PUBLISH_URL`, defaulting to `http://localhost:8081`.

## 2026-07-11 local - frontend-dev port correction

- Task: `CONTENT-PUBLISH-DOUBLECLICK`
- State: `DEV_IN_PROGRESS`
- Result: Changed the local fallback from the headless Publish API (`8081`) to the reference site (`3001`); page single-clicks no longer navigate, while page double-clicks still open the configured publish URL in a new tab.
- Files changed: `frontend/apps/admin/src/app/(admin)/content/page.tsx`, `frontend/apps/admin-e2e/tests/phase1-critical/content-tree.spec.ts`, and the task evidence files.
- Evidence: `cd frontend && pnpm build` PASS (9/9 tasks). Focused E2E expectation now asserts `http://localhost:3001/content/tut-usa/en/home`; the focused run reached all 15 tests but was blocked before browser launch because `chrome-headless-shell` is missing. Diagnostics report only pre-existing warning/errors (`throw` caught locally and missing E2E `@types/node`).
- Risks/blockers: Focused Playwright execution remains blocked until the local Chromium executable is installed; full frontend build and required E2E gates remain to be rerun by the delivery lane.
- Next action: Install/restore Playwright Chromium, run UI-016b and the required smoke/full gates, then update this handoff and the runtime board.

