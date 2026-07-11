# Frontend implementation summary

## Changes

- `frontend/apps/admin/src/app/(admin)/content/page.tsx`
  - Preserves API `resourceType` on UI nodes.
  - Adds page-only row double-click handling.
  - Keeps page-row single-click inert so only a double-click opens Publish; folder rows retain immediate navigation.
  - Opens `NEXT_PUBLIC_PUBLISH_URL` plus the node URL in a new tab with `noopener,noreferrer`.
  - Keeps single-click row behavior for folder navigation.
- `frontend/apps/admin-e2e/tests/phase1-critical/content-tree.spec.ts`
  - Adds UI-016b coverage for the new-tab publish URL.

## Test scenarios

1. Navigate to the page tree and double-click `home`; assert a popup opens at `http://localhost:3001/content/tut-usa/en/home`.
2. Existing folder single-click navigation tests continue to exercise the unchanged row click behavior.
3. Existing action-menu, search, breadcrumb, empty-state, and selection tests remain in the focused content-tree suite.

## Evidence

- `cd frontend && pnpm build` — PASS (9/9 tasks; existing non-blocking Next.js image warnings).
- `cd frontend/apps/admin-e2e && pnpm exec playwright test tests/phase1-critical/content-tree.spec.ts --project=chromium --workers=1` — BLOCKED before test execution because the Playwright Chromium executable is missing (`chrome-headless-shell`); all 15 tests fail at browser launch.
- Static error check: changed admin page has no errors. The E2E file reports pre-existing missing `@types/node` errors for existing `process.env` references; this change adds no new `process` usage.


