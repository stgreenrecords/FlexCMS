# ECMS-50 — Visual workflow model editor

| Field | Value |
|---|---|
| Type | Story |
| Priority | P2 |
| Area | Frontend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-48](ECMS-48.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Process owners build approval flows without code.

## Current state

No model editor.

## Acceptance criteria

- [ ] AC1: UI design (`## UI design` section, written during refinement) for a step/transition canvas.
- [ ] AC2: Create and edit models with all ECMS-48 step types; validation errors shown inline.
- [ ] AC3: Playwright E2E: build a two-step model and run it.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-50-TC01 | AC2 | ui | _Draft:_ Create and edit models with all ECMS-48 step types; validation errors shown inline. | — |
| ECMS-50-TC02 | AC3 | e2e | _Draft:_ Playwright E2E: build a two-step model and run it. | — |

## Refinement needed

Visible UI with no reference design in `Design/UI/`. Before implementation: write the UI spec (layout, `@flexcms/ui` components, loading/empty/error states, breadcrumb) in a `## UI design` section of this file, finalize the test cases, then move the task to **Ready** ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `backlog/tasks/ECMS-48.md`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-50/task.md`). |
