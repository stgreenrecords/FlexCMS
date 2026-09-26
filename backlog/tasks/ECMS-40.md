# ECMS-40 — Experience Fragment building blocks

| Field | Value |
|---|---|
| Type | Story |
| Priority | P3 |
| Area | Frontend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-38](ECMS-38.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Assemble new fragments faster from approved component groups.

## Current state

No building-block concept.

## Acceptance criteria

- [ ] AC1: Select components in a fragment and save them as a reusable block.
- [ ] AC2: Insert blocks into other fragments from the palette.
- [ ] AC3: Playwright E2E coverage.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-40-TC01 | AC1 | ui | _Draft:_ Select components in a fragment and save them as a reusable block. | — |
| ECMS-40-TC02 | AC2 | ui | _Draft:_ Insert blocks into other fragments from the palette. | — |
| ECMS-40-TC03 | AC3 | e2e | _Draft:_ Playwright E2E coverage. | — |

## Refinement needed

Visible UI with no reference design in `Design/UI/`. Before implementation: write the UI spec (layout, `@flexcms/ui` components, loading/empty/error states, breadcrumb) in a `## UI design` section of this file, finalize the test cases, then move the task to **Ready** ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `backlog/tasks/ECMS-38.md`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-40/task.md`). |
