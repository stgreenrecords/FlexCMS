# ECMS-30 — Publish-with-references wizard and replication queue console

| Field | Value |
|---|---|
| Type | Story |
| Priority | P1 |
| Area | Frontend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-29](ECMS-29.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Authors see exactly what will go live; operators see replication health.

## Current state

No UI for either.

## Acceptance criteria

- [ ] AC1: UI design (`## UI design` section, written during refinement) for a publish wizard (items, references, children, schedule) and a queue console.
- [ ] AC2: Wizard shows the dry-run set, lets the author include/exclude references, and publishes or schedules.
- [ ] AC3: Queue console: pending/failed/completed counts, failed-event list with retry, pause/resume.
- [ ] AC4: Playwright E2E: publish with a referenced unpublished asset and assert both are live.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-30-TC01 | AC2 | ui | _Draft:_ Wizard shows the dry-run set, lets the author include/exclude references, and publishes or schedules. | — |
| ECMS-30-TC02 | AC3 | ui | _Draft:_ Queue console: pending/failed/completed counts, failed-event list with retry, pause/resume. | — |
| ECMS-30-TC03 | AC4 | e2e | _Draft:_ Playwright E2E: publish with a referenced unpublished asset and assert both are live. | — |

## Refinement needed

Visible UI with no reference design in `Design/UI/`. Before implementation: write the UI spec (layout, `@flexcms/ui` components, loading/empty/error states, breadcrumb) in a `## UI design` section of this file, finalize the test cases, then move the task to **Ready** ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `backlog/tasks/ECMS-29.md`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-30/task.md`). |
