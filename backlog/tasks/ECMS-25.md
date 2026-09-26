# ECMS-25 — i18n dictionary REST API with import/export

| Field | Value |
|---|---|
| Type | Story |
| Priority | P1 |
| Area | Backend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Expose UI-string dictionaries so the Translations page and delivery can use them.

## Current state

`I18nService` (setTranslation, importTranslations, getDictionary) and tables exist, but no controller exposes them (test doc GAP-080).

## Acceptance criteria

- [ ] AC1: CRUD endpoints for dictionary keys per site and locale, with pagination and search.
- [ ] AC2: Import/export in JSON and XLIFF 1.2/2.0.
- [ ] AC3: Headless endpoint returns a locale dictionary with the documented fallback chain.
- [ ] AC4: Validation and RFC 7807 errors; audit entries for changes.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-25-TC01 | AC1 | api | _Draft:_ CRUD endpoints for dictionary keys per site and locale, with pagination and search. | — |
| ECMS-25-TC02 | AC2 | api | _Draft:_ Import/export in JSON and XLIFF 1.2/2.0. | — |
| ECMS-25-TC03 | AC3 | api | _Draft:_ Headless endpoint returns a locale dictionary with the documented fallback chain. | — |
| ECMS-25-TC04 | AC4 | api | _Draft:_ Validation and RFC 7807 errors; audit entries for changes. | — |

## Out of scope

- Translations page (ECMS-26).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `flexcms/flexcms-i18n/src/main/java/com/flexcms/i18n/service/I18nService.java`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-25/task.md`). |
