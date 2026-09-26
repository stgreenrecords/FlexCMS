# ECMS-57 — Operations dashboard at /settings

| Field | Value |
|---|---|
| Type | Story |
| Priority | P3 |
| Area | Frontend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-56](ECMS-56.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Admins see system health and run maintenance from the UI.

## Current state

`/settings` is linked from the sidebar and top bar but does not exist (GAP-001).

## Acceptance criteria

- [ ] AC1: `/settings` per `system_settings` design: service health, replication queue summary, maintenance jobs with last run and run-now.
- [ ] AC2: Playwright E2E coverage.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-57-TC01 | AC1 | ui | _Draft:_ `/settings` per `system_settings` design: service health, replication queue summary, maintenance jobs with last run and run-now. | — |
| ECMS-57-TC02 | AC2 | e2e | _Draft:_ Playwright E2E coverage. | — |

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `Design/UI/stitch_flexcms_admin_ui_requirements_summary/system_settings/`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-57/task.md`). |
