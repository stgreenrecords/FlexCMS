# ECMS-07 — Page properties dialog

| Field | Value |
|---|---|
| Type | Story |
| Priority | P1 |
| Area | Frontend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-06](ECMS-06.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Authors can view and edit every page property without touching the API.

## Current state

No page-properties UI exists; no design reference exists in `Design/UI/`.

## Acceptance criteria

- [ ] AC1: UI design (`## UI design` section, written during refinement) for a tabbed properties dialog (Basic, SEO, Social, Scheduling, Advanced) reachable from the Content Tree and the editor.
- [ ] AC2: Frontend: all ECMS-06 fields editable with validation messages from the API's field errors.
- [ ] AC3: On/off time and publish-later are editable here and reflected in the tree.
- [ ] AC4: Playwright E2E: edit each field, reload, and assert it persisted.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-07-TC01 | AC2 | ui | _Draft:_ Frontend: all ECMS-06 fields editable with validation messages from the API's field errors. | — |
| ECMS-07-TC02 | AC3 | ui | _Draft:_ On/off time and publish-later are editable here and reflected in the tree. | — |
| ECMS-07-TC03 | AC4 | e2e | _Draft:_ Playwright E2E: edit each field, reload, and assert it persisted. | — |

## Refinement needed

Visible UI with no reference design in `Design/UI/`. Before implementation: write the UI spec (layout, `@flexcms/ui` components, loading/empty/error states, breadcrumb) in a `## UI design` section of this file, finalize the test cases, then move the task to **Ready** ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Out of scope

- SEO rendering on the site (ECMS-60).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `backlog/tasks/ECMS-06.md`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-07/task.md`). |
