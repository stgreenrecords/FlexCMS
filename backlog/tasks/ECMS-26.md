# ECMS-26 — Translations page wired to the dictionary API

| Field | Value |
|---|---|
| Type | Story |
| Priority | P1 |
| Area | Frontend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-25](ECMS-25.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Localisation managers manage UI strings in the Translations page.

## Current state

The page issues no requests and is permanently empty (test doc GAP-020).

## Acceptance criteria

- [ ] AC1: Grid loads keys × locales from the API; status chips (translated/missing/outdated) are computed from data.
- [ ] AC2: Inline edit, add key, import, and export XLIFF work against the API.
- [ ] AC3: Translation Health panel shows real completion.
- [ ] AC4: Follows `translation_manager` design; Playwright E2E coverage.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-26-TC01 | AC1 | ui | _Draft:_ Grid loads keys × locales from the API; status chips (translated/missing/outdated) are computed from data. | — |
| ECMS-26-TC02 | AC2 | ui | _Draft:_ Inline edit, add key, import, and export XLIFF work against the API. | — |
| ECMS-26-TC03 | AC3 | ui | _Draft:_ Translation Health panel shows real completion. | — |
| ECMS-26-TC04 | AC4 | e2e | _Draft:_ Follows `translation_manager` design; Playwright E2E coverage. | — |

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `frontend/apps/admin/src/app/(admin)/translations/page.tsx`
- `Design/UI/stitch_flexcms_admin_ui_requirements_summary/translation_manager/`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-26/task.md`). |
