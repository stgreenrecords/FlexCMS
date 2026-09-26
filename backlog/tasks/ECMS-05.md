# ECMS-05 — Content Tree page operations wired end to end

| Field | Value |
|---|---|
| Type | Story |
| Priority | P1 |
| Area | Frontend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-04](ECMS-04.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Make the Content Tree a working page console: every page operation an author needs, from the UI.

## Current state

+ Create New Page, row Publish/Duplicate/Move/Delete, and Publish All are inert (test doc GAP-030/031). Lock state and scheduling have no UI.

## Acceptance criteria

- [ ] AC1: Create page dialog: parent, name, title, template (from `/api/author/content/templates`); creates via API and appears in the tree.
- [ ] AC2: Row and multi-select actions: copy, move (target picker), rename, delete (with confirmation), lock/unlock, publish, unpublish, publish later / unpublish later (date-time).
- [ ] AC3: Every destructive action asks for confirmation; every API failure shows a visible error — no optimistic success.
- [ ] AC4: Lock state is shown on rows and in the editor header; a page locked by another user is read-only in the editor.
- [ ] AC5: Uses `@flexcms/ui` components and tokens; loading and empty states present; follows `Design/UI/.../content_tree_*`.
- [ ] AC6: Playwright E2E scenarios for each action, verifying the backend result, not just the UI.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-05-TC01 | AC1 | ui | _Draft:_ Create page dialog: parent, name, title, template (from `/api/author/content/templates`); creates via API and appears in the tree. | — |
| ECMS-05-TC02 | AC2 | ui | _Draft:_ Row and multi-select actions: copy, move (target picker), rename, delete (with confirmation), lock/unlock, publish, unpublish, publish later / unpublish later (date-time). | — |
| ECMS-05-TC03 | AC3 | ui | _Draft:_ Every destructive action asks for confirmation; every API failure shows a visible error — no optimistic success. | — |
| ECMS-05-TC04 | AC4 | ui | _Draft:_ Lock state is shown on rows and in the editor header; a page locked by another user is read-only in the editor. | — |
| ECMS-05-TC05 | AC5 | ui | _Draft:_ Uses `@flexcms/ui` components and tokens; loading and empty states present; follows `Design/UI/.../content_tree_*`. | — |
| ECMS-05-TC06 | AC6 | e2e | _Draft:_ Playwright E2E scenarios for each action, verifying the backend result, not just the UI. | — |

## Out of scope

- References warning on delete (added when ECMS-02 lands).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `frontend/apps/admin/src/app/(admin)/content/page.tsx`
- `Design/UI/stitch_flexcms_admin_ui_requirements_summary/content_tree_list_view/`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-05/task.md`). |
