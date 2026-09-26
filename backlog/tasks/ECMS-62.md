# ECMS-62 — Admin omnisearch and site search component

| Field | Value |
|---|---|
| Type | Story |
| Priority | P2 |
| Area | Frontend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-61](ECMS-61.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Authors jump to any page, asset, or fragment; visitors search the site with suggestions.

## Current state

The top-bar search is inert (GAP-010).

## Acceptance criteria

- [ ] AC1: UI design (`## UI design` section, written during refinement) for omnisearch results.
- [ ] AC2: ⌘K omnisearch across pages, assets, fragments, and tags.
- [ ] AC3: Site search component with live suggestions and facets.
- [ ] AC4: Playwright E2E coverage.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-62-TC01 | AC2 | ui | _Draft:_ ⌘K omnisearch across pages, assets, fragments, and tags. | — |
| ECMS-62-TC02 | AC3 | ui | _Draft:_ Site search component with live suggestions and facets. | — |
| ECMS-62-TC03 | AC4 | e2e | _Draft:_ Playwright E2E coverage. | — |

## Refinement needed

Visible UI with no reference design in `Design/UI/`. Before implementation: write the UI spec (layout, `@flexcms/ui` components, loading/empty/error states, breadcrumb) in a `## UI design` section of this file, finalize the test cases, then move the task to **Ready** ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `frontend/apps/admin/src/components/TopNav.tsx`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-62/task.md`). |
