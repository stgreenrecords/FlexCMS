# ECMS-28 — Translation projects UI

| Field | Value |
|---|---|
| Type | Story |
| Priority | P2 |
| Area | Frontend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-27](ECMS-27.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Localisation managers create language copies and run translation jobs from the UI.

## Current state

No UI for language copies or jobs.

## Acceptance criteria

- [ ] AC1: UI design (`## UI design` section, written during refinement) for projects, jobs, and side-by-side review.
- [ ] AC2: Create language copy from the Content Tree; job list with states; side-by-side source/target review with approve/reject.
- [ ] AC3: Playwright E2E: create a job, machine-translate, review, approve, and verify target pages.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-28-TC01 | AC2 | ui | _Draft:_ Create language copy from the Content Tree; job list with states; side-by-side source/target review with approve/reject. | — |
| ECMS-28-TC02 | AC3 | e2e | _Draft:_ Playwright E2E: create a job, machine-translate, review, approve, and verify target pages. | — |

## Refinement needed

Visible UI with no reference design in `Design/UI/`. Before implementation: write the UI spec (layout, `@flexcms/ui` components, loading/empty/error states, breadcrumb) in a `## UI design` section of this file, finalize the test cases, then move the task to **Ready** ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `backlog/tasks/ECMS-27.md`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-28/task.md`). |
