# ECMS-13 — Editor productivity: inline text editing and copy/cut/paste

| Field | Value |
|---|---|
| Type | Story |
| Priority | P2 |
| Area | Frontend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Speed up page building with inline text editing and component clipboard operations.

## Current state

Text can only be edited in the properties panel; components cannot be copied or moved between containers except by drag.

## Acceptance criteria

- [ ] AC1: Double-click a text-like component to edit inline on the canvas; Enter/Escape/blur commit or cancel.
- [ ] AC2: Copy, cut, and paste components (keyboard shortcuts + chip menu), including into another container and another page in the same session.
- [ ] AC3: Paste respects container policies (rejected with a message when not allowed).
- [ ] AC4: All operations participate in undo/redo and persist on save.
- [ ] AC5: Follows `visual_page_editor` design; Playwright E2E coverage for each operation.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-13-TC01 | AC1 | ui | _Draft:_ Double-click a text-like component to edit inline on the canvas; Enter/Escape/blur commit or cancel. | — |
| ECMS-13-TC02 | AC2 | ui | _Draft:_ Copy, cut, and paste components (keyboard shortcuts + chip menu), including into another container and another page in the same session. | — |
| ECMS-13-TC03 | AC3 | ui | _Draft:_ Paste respects container policies (rejected with a message when not allowed). | — |
| ECMS-13-TC04 | AC4 | ui | _Draft:_ All operations participate in undo/redo and persist on save. | — |
| ECMS-13-TC05 | AC5 | e2e | _Draft:_ Follows `visual_page_editor` design; Playwright E2E coverage for each operation. | — |

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `frontend/apps/admin/src/app/editor/page.tsx`
- `Design/UI/stitch_flexcms_admin_ui_requirements_summary/visual_page_editor_refined/`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-13/task.md`). |
