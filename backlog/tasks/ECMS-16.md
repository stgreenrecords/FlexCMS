# ECMS-16 — Spreadsheet-style bulk property editor

| Field | Value |
|---|---|
| Type | Story |
| Priority | P3 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-06](ECMS-06.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Edit a property across many pages at once (e.g. fix descriptions site-wide).

## Current state

Only single-node property updates exist.

## Acceptance criteria

- [ ] AC1: Bulk properties API with per-path result reporting (like existing bulk operations).
- [ ] AC2: Grid UI: pick a subtree and columns, edit cells, save with per-row errors.
- [ ] AC3: Split into backend and frontend child tasks.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-16-TC01 | AC1 | api | _Draft:_ Bulk properties API with per-path result reporting (like existing bulk operations). | — |
| ECMS-16-TC02 | AC2 | ui | _Draft:_ Grid UI: pick a subtree and columns, edit cells, save with per-row errors. | — |

## Refinement needed

Touches schemas, public APIs, or several layers. Before implementation: write the technical design (in this file, or `backlog/designs/ECMS-16.md` if long), record significant decisions in [`docs/architecture/DECISIONS.md`](../../docs/architecture/DECISIONS.md), finalize the test cases, and split into child tasks if it exceeds the size limit ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `flexcms/flexcms-author/src/main/java/com/flexcms/author/controller/AuthorContentController.java`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-16/task.md`). |
