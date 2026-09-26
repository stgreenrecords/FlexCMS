# TEST-007 — Port DAM and PIM authoring suites to Playwright

| Field | Value |
|---|---|
| Type | Test |
| Priority | P1 |
| Area | Test automation (admin) |
| Depends on | [TEST-001](TEST-001.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

DAM upload, folders and references, and PIM catalog and product authoring, are verified end to end by Playwright.

## Current state

Selenium `frontend/apps/selenium-e2e/src/cases/admin/dam-authoring-suite.spec.ts` (REB-21), `dam-folder-tree-suite.spec.ts`, and `pim-authoring-suite.spec.ts` (REB-23). `published-asset-rendering.spec.ts` is ported by ECMS-03B.

## Acceptance criteria

- [ ] AC1: Every scenario of the Selenium spec(s) listed under **Current state** has a Playwright equivalent in `frontend/apps/e2e/tests/e2e/`, using the TEST-001 factories. A mapping table (Selenium scenario → Playwright test title) is added to this spec's Log.
- [ ] AC2: The ported tests assert at least what the Selenium tests asserted: visible outcome **and** backend/publish result. Scenarios the Selenium suite recorded as pending/blocked stay `test.fixme` with the blocking task ID, and are never rewritten to pass.
- [ ] AC3: The ported tests pass twice in a row against a freshly started stack (`pnpm test:e2e:live`), with no retries relied upon.
- [ ] AC4: The ported Selenium spec files, and their `package.json` scripts, are deleted.

## Test cases

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| TEST-007-TC01 | AC1, AC2 | e2e | Each Selenium scenario has a Playwright test with the same Given/When/Then, in tests/e2e/dam.spec.ts, tests/e2e/pim.spec.ts. Add one row per ported scenario when implementing | — |
| TEST-007-TC02 | AC3 | e2e | Two consecutive green runs of the ported specs against a fresh stack | — |

## Read first

- `frontend/apps/selenium-e2e/src/cases/admin/dam-authoring-suite.spec.ts`
- `frontend/apps/selenium-e2e/src/cases/admin/dam-folder-tree-suite.spec.ts`
- `frontend/apps/selenium-e2e/src/cases/admin/pim-authoring-suite.spec.ts`
- `docs/process/TESTING.md`
- `frontend/apps/selenium-e2e/src/fixtures/`

## Log

| Date | Note |
|---|---|
| 2026-09-26 | Created when Playwright became the only test framework (Selenium frozen). |
