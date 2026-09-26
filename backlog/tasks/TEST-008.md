# TEST-008 — Automate the unverified 2026-09-14 exception-handling fixes as Playwright API regression tests

| Field | Value |
|---|---|
| Type | Test |
| Priority | P1 |
| Area | Test automation (API) |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Fixes that were only hand-checked are protected by automated regression tests, so a user error can never again return 500.

## Current state

Commit `20ad856` fixed eight 500-on-user-error defects. The manual retest was never run: `docs/testing/MANUAL_TEST_CASES_AUTHORING.md` still marks these cases "✅ FIXED (unverified)".

## Acceptance criteria

- [ ] AC1: Every case below has an `api` test that asserts the exact status code and a `application/problem+json` body: WF-016, WF-017, PIM-063, PIM-064, PIM-066, PIM-072 (PIM not-found/conflict → 404/409); SITE-023 (duplicate siteId → 409); PIM-091 and ENV-015 (unmapped path → 404); WF-036 and WF-037 (invalid status enum → 400); GAP-103 (a second ACTIVE catalog in the same year is rejected); DAM-095 and GAP-110 (asset search without siteId → 422); RT-25 (bad import sourceType → 400); GAP-107 (as described in the manual catalogue).
- [ ] AC2: The corresponding rows in `docs/testing/MANUAL_TEST_CASES_AUTHORING.md` are updated to "automated", with the spec path.

## Test cases

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| TEST-008-TC01 | AC1 | api | One test per listed case ID, titled with that ID, e.g. 'TEST-008-TC01 SITE-023 duplicate siteId returns 409 problem+json' | — |

## Read first

- `docs/testing/MANUAL_TEST_CASES_AUTHORING.md`
- `flexcms/flexcms-app/src/main/java/com/flexcms/app/config/GlobalExceptionHandler.java`

## Log

| Date | Note |
|---|---|
| 2026-09-26 | Created. |
