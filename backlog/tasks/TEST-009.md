# TEST-009 — Remove the legacy Selenium suite

| Field | Value |
|---|---|
| Type | Test |
| Priority | P2 |
| Area | Test infrastructure |
| Depends on | [TEST-002](TEST-002.md), [TEST-003](TEST-003.md), [TEST-004](TEST-004.md), [TEST-005](TEST-005.md), [TEST-006](TEST-006.md), [TEST-007](TEST-007.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

One test framework remains: Playwright.

## Current state

`frontend/apps/selenium-e2e` is frozen and no longer a gate. It still holds `smoke/framework-foundation.spec.ts`, `harness-hardening-suite.spec.ts` (REB-25), and capture/report tooling.

## Acceptance criteria

- [ ] AC1: Every Selenium spec is either ported (listed in the port tasks) or explicitly retired, with a one-line reason in this task's Log (e.g. harness self-tests that do not apply to Playwright).
- [ ] AC2: `frontend/apps/selenium-e2e` is deleted, the lockfile is updated, and no scripts, docs or CI reference Selenium.
- [ ] AC3: `scripts/` tooling that depended on the Selenium capture code (`capture:tut-assets`) is moved to Playwright or documented as retired.

## Test cases

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| TEST-009-TC01 | AC2 | e2e | After removal, `pnpm install && pnpm build && pnpm test:e2e && pnpm test:e2e:live` are green and `grep -ri selenium` finds nothing outside git history | — |

## Read first

- `frontend/apps/selenium-e2e/package.json`
- `frontend/apps/selenium-e2e/README.md`

## Log

| Date | Note |
|---|---|
| 2026-09-26 | Created. |
