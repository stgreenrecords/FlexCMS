# ECMS-65 — Package manager UI

| Field | Value |
|---|---|
| Type | Story |
| Priority | P3 |
| Area | Frontend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Move content between environments without API calls.

## Current state

Content export/import exists as API only (IEX-013).

## Acceptance criteria

- [ ] AC1: UI design (`## UI design` section, written during refinement) for package build/upload/install.
- [ ] AC2: Build a package from a path (JSON/ZIP), download it, upload and install with overwrite option, show created/updated/skipped/errors.
- [ ] AC3: Playwright E2E: export, delete, import, verify restored.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-65-TC01 | AC2 | ui | _Draft:_ Build a package from a path (JSON/ZIP), download it, upload and install with overwrite option, show created/updated/skipped/errors. | — |
| ECMS-65-TC02 | AC3 | e2e | _Draft:_ Playwright E2E: export, delete, import, verify restored. | — |

## Refinement needed

Visible UI with no reference design in `Design/UI/`. Before implementation: write the UI spec (layout, `@flexcms/ui` components, loading/empty/error states, breadcrumb) in a `## UI design` section of this file, finalize the test cases, then move the task to **Ready** ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `flexcms/flexcms-author/src/main/java/com/flexcms/author/controller/ContentImportExportController.java`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-65/task.md`). |
