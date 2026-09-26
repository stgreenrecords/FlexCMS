# ECMS-38 — Experience Fragment console completion

| Field | Value |
|---|---|
| Type | Story |
| Priority | P1 |
| Area | Frontend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-02](ECMS-02.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Run site-wide promos and shared blocks entirely from the fragment console.

## Current state

'+ Create Fragment' and 'Manage Channels' are inert; there is no variation management or references view (test doc GAP-037).

## Acceptance criteria

- [ ] AC1: UI design (`## UI design` section, written during refinement) for create-fragment, channel/variation management, and references.
- [ ] AC2: Create fragment (site, locale, category, name, title); add/rename/delete channel variations.
- [ ] AC3: References panel lists every page using the fragment.
- [ ] AC4: Playwright E2E coverage for each action.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-38-TC01 | AC2 | ui | _Draft:_ Create fragment (site, locale, category, name, title); add/rename/delete channel variations. | — |
| ECMS-38-TC02 | AC3 | ui | _Draft:_ References panel lists every page using the fragment. | — |
| ECMS-38-TC03 | AC4 | e2e | _Draft:_ Playwright E2E coverage for each action. | — |

## Refinement needed

Visible UI with no reference design in `Design/UI/`. Before implementation: write the UI spec (layout, `@flexcms/ui` components, loading/empty/error states, breadcrumb) in a `## UI design` section of this file, finalize the test cases, then move the task to **Ready** ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `frontend/apps/admin/src/app/(admin)/experience-fragments/page.tsx`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-38/task.md`). |
