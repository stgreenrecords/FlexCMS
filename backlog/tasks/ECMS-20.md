# ECMS-20 — Template editor UI (structure, initial content, policies, styles)

| Field | Value |
|---|---|
| Type | Story |
| Priority | P1 |
| Area | Frontend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-18](ECMS-18.md), [ECMS-19](ECMS-19.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Template authors build and govern page types visually.

## Current state

No template editor exists and no design reference exists.

## Acceptance criteria

- [ ] AC1: UI design (`## UI design` section, written during refinement) for a template editor with Structure / Initial content / Policies modes.
- [ ] AC2: Frontend: lock/unlock components in structure, place initial content, assign container and component policies, define style groups.
- [ ] AC3: Enable/disable templates and choose site availability.
- [ ] AC4: Playwright E2E: create a template, create a page from it, change structure, and see the page update.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-20-TC01 | AC2 | ui | _Draft:_ Frontend: lock/unlock components in structure, place initial content, assign container and component policies, define style groups. | — |
| ECMS-20-TC02 | AC3 | ui | _Draft:_ Enable/disable templates and choose site availability. | — |
| ECMS-20-TC03 | AC4 | e2e | _Draft:_ Playwright E2E: create a template, create a page from it, change structure, and see the page update. | — |

## Refinement needed

Visible UI with no reference design in `Design/UI/`. Before implementation: write the UI spec (layout, `@flexcms/ui` components, loading/empty/error states, breadcrumb) in a `## UI design` section of this file, finalize the test cases, then move the task to **Ready** ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `backlog/tasks/ECMS-18.md`
- `backlog/tasks/ECMS-19.md`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-20/task.md`). |
