# ECMS-56 — Maintenance jobs: version, audit, and workflow purge

| Field | Value |
|---|---|
| Type | Story |
| Priority | P3 |
| Area | Backend |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Keep storage bounded in long-running installations.

## Current state

Versions, audit entries, and workflow instances accumulate forever.

## Acceptance criteria

- [ ] AC1: Configurable retention policies for content versions (keep N / keep newer than D, always keep labelled), audit log, completed workflows, replication log.
- [ ] AC2: Scheduled jobs with dry-run and run-now endpoints; results recorded.
- [ ] AC3: Unit + IT coverage.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-56-TC01 | AC1 | api | _Draft:_ Configurable retention policies for content versions (keep N / keep newer than D, always keep labelled), audit log, completed workflows, replication log. | — |
| ECMS-56-TC02 | AC2 | api | _Draft:_ Scheduled jobs with dry-run and run-now endpoints; results recorded. | — |
| ECMS-56-TC03 | AC3 | api | _Draft:_ Unit + IT coverage. | — |

## Out of scope

- Operations dashboard (ECMS-57).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `flexcms/flexcms-core/src/main/java/com/flexcms/core/service/AuditService.java`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-56/task.md`). |
