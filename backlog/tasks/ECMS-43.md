# ECMS-43 — Metadata schemas and folder profiles

| Field | Value |
|---|---|
| Type | Story |
| Priority | P2 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-41](ECMS-41.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Creative ops define what metadata assets must carry, and uploads get sensible defaults automatically.

## Current state

No metadata schemas or profiles.

## Acceptance criteria

- [ ] AC1: Metadata schemas per folder or asset type (text, date, dropdown, tags, required fields).
- [ ] AC2: Folder metadata profiles pre-fill values on upload; processing profiles choose extra renditions.
- [ ] AC3: Bulk metadata edit and CSV import/export.
- [ ] AC4: Split into backend and frontend child tasks.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-43-TC01 | AC1 | api | _Draft:_ Metadata schemas per folder or asset type (text, date, dropdown, tags, required fields). | — |
| ECMS-43-TC02 | AC2 | api | _Draft:_ Folder metadata profiles pre-fill values on upload; processing profiles choose extra renditions. | — |
| ECMS-43-TC03 | AC3 | api | _Draft:_ Bulk metadata edit and CSV import/export. | — |

## Refinement needed

Touches schemas, public APIs, or several layers. Before implementation: write the technical design (in this file, or `backlog/designs/ECMS-43.md` if long), record significant decisions in [`docs/architecture/DECISIONS.md`](../../docs/architecture/DECISIONS.md), finalize the test cases, and split into child tasks if it exceeds the size limit ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `backlog/tasks/ECMS-41.md`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-43/task.md`). |
