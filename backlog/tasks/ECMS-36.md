# ECMS-36 — Fragment model editor and fragment editor

| Field | Value |
|---|---|
| Type | Story |
| Priority | P1 |
| Area | Frontend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-34](ECMS-34.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Content strategists define models and editors author fragments in the browser.

## Current state

No UI.

## Acceptance criteria

- [ ] AC1: UI design (`## UI design` section, written during refinement) for a model builder (can reuse PIM schema-editor patterns) and a form-style fragment editor with variations and JSON preview.
- [ ] AC2: Frontend: create/edit models, create/edit fragments, manage variations, publish.
- [ ] AC3: Playwright E2E: model → fragment → publish → fetch via headless API.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-36-TC01 | AC2 | ui | _Draft:_ Frontend: create/edit models, create/edit fragments, manage variations, publish. | — |
| ECMS-36-TC02 | AC3 | e2e | _Draft:_ Playwright E2E: model → fragment → publish → fetch via headless API. | — |

## Refinement needed

Visible UI with no reference design in `Design/UI/`. Before implementation: write the UI spec (layout, `@flexcms/ui` components, loading/empty/error states, breadcrumb) in a `## UI design` section of this file, finalize the test cases, then move the task to **Ready** ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `Design/UI/stitch_flexcms_admin_ui_requirements_summary/schema_editor_visual_builder/`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-36/task.md`). |
