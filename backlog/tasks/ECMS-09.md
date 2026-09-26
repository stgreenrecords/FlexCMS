# ECMS-09 — Version history, compare, and as-of view in the editor

| Field | Value |
|---|---|
| Type | Story |
| Priority | P1 |
| Area | Frontend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-08](ECMS-08.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Authors can browse, compare, restore, and time-travel versions from the UI.

## Current state

Version history is API-only; the Content Tree 'Version history' rail icon is inert (test doc GAP-032, VER-012).

## Acceptance criteria

- [ ] AC1: UI design (`## UI design` section; may adapt `product_version_history`) for a version panel: list with labels, side-by-side compare, restore with confirmation.
- [ ] AC2: An as-of mode in the editor/preview renders the page at a chosen date, read-only.
- [ ] AC3: Restore creates a new version and the UI refreshes.
- [ ] AC4: Playwright E2E: create versions, compare, restore, and verify the as-of view.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-09-TC01 | AC2 | ui | _Draft:_ An as-of mode in the editor/preview renders the page at a chosen date, read-only. | — |
| ECMS-09-TC02 | AC3 | ui | _Draft:_ Restore creates a new version and the UI refreshes. | — |
| ECMS-09-TC03 | AC4 | e2e | _Draft:_ Playwright E2E: create versions, compare, restore, and verify the as-of view. | — |

## Refinement needed

Visible UI with no reference design in `Design/UI/`. Before implementation: write the UI spec (layout, `@flexcms/ui` components, loading/empty/error states, breadcrumb) in a `## UI design` section of this file, finalize the test cases, then move the task to **Ready** ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `Design/UI/stitch_flexcms_admin_ui_requirements_summary/product_version_history/`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-09/task.md`). |
