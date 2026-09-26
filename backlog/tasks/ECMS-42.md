# ECMS-42 — Asset Detail page wired end to end

| Field | Value |
|---|---|
| Type | Story |
| Priority | P1 |
| Area | Frontend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-41](ECMS-41.md), [ECMS-02](ECMS-02.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Authors can inspect and manage an asset on its detail page.

## Current state

Save/Discard are inert, the preview is a placeholder gradient, renditions and usage panels are always empty, and Delete Asset in the rail is inert (test doc GAP-022/024/025/026).

## Acceptance criteria

- [ ] AC1: Real image/video/PDF preview.
- [ ] AC2: Metadata form saves via ECMS-41 and survives reload; Discard reverts.
- [ ] AC3: Renditions panel lists real renditions with download.
- [ ] AC4: Usage panel lists references (ECMS-02).
- [ ] AC5: Move, rename, and delete from the page, with confirmation and visible errors.
- [ ] AC6: Follows `asset_detail` design; Playwright E2E coverage.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-42-TC01 | AC1 | ui | _Draft:_ Real image/video/PDF preview. | — |
| ECMS-42-TC02 | AC2 | ui | _Draft:_ Metadata form saves via ECMS-41 and survives reload; Discard reverts. | — |
| ECMS-42-TC03 | AC3 | ui | _Draft:_ Renditions panel lists real renditions with download. | — |
| ECMS-42-TC04 | AC4 | ui | _Draft:_ Usage panel lists references (ECMS-02). | — |
| ECMS-42-TC05 | AC5 | ui | _Draft:_ Move, rename, and delete from the page, with confirmation and visible errors. | — |
| ECMS-42-TC06 | AC6 | e2e | _Draft:_ Follows `asset_detail` design; Playwright E2E coverage. | — |

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `frontend/apps/admin/src/app/(admin)/dam/[id]/page.tsx`
- `Design/UI/stitch_flexcms_admin_ui_requirements_summary/asset_detail/`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-42/task.md`). |
