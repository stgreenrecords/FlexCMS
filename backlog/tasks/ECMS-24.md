# ECMS-24 — Live copy console and inheritance indicators in the editor

| Field | Value |
|---|---|
| Type | Story |
| Priority | P1 |
| Area | Frontend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-23](ECMS-23.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Site owners see which sites are in sync and manage live copies without API calls.

## Current state

Live copy is API-only.

## Acceptance criteria

- [ ] AC1: UI design (`## UI design` section, written during refinement) for a live-copy overview console and editor inheritance states.
- [ ] AC2: Create live copy, roll out, suspend/resume, detach from the UI.
- [ ] AC3: Editor shows inherited components as locked with cancel/re-enable inheritance actions.
- [ ] AC4: Playwright E2E: create a live copy, change source, roll out, cancel inheritance on one component, roll out again, assert local change survives.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-24-TC01 | AC2 | ui | _Draft:_ Create live copy, roll out, suspend/resume, detach from the UI. | — |
| ECMS-24-TC02 | AC3 | ui | _Draft:_ Editor shows inherited components as locked with cancel/re-enable inheritance actions. | — |
| ECMS-24-TC03 | AC4 | e2e | _Draft:_ Playwright E2E: create a live copy, change source, roll out, cancel inheritance on one component, roll out again, assert local change survives. | — |

## Refinement needed

Visible UI with no reference design in `Design/UI/`. Before implementation: write the UI spec (layout, `@flexcms/ui` components, loading/empty/error states, breadcrumb) in a `## UI design` section of this file, finalize the test cases, then move the task to **Ready** ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `backlog/tasks/ECMS-23.md`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-24/task.md`). |
