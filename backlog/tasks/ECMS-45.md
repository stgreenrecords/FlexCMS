# ECMS-45 — Collections, share links, bulk ingestion, and asset reports

| Field | Value |
|---|---|
| Type | Story |
| Priority | P3 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-41](ECMS-41.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Package assets for partners without email attachments and measure asset reuse.

## Current state

Only single-file download; no collections, sharing, bulk import, or reports.

## Acceptance criteria

- [ ] AC1: Static and query-based collections.
- [ ] AC2: Expiring share links and multi-asset download with rendition choice (optional watermark).
- [ ] AC3: Folder upload and bulk import from object storage.
- [ ] AC4: Reports: usage, downloads, expiry, storage.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-45-TC01 | AC1 | api | _Draft:_ Static and query-based collections. | — |
| ECMS-45-TC02 | AC2 | api | _Draft:_ Expiring share links and multi-asset download with rendition choice (optional watermark). | — |
| ECMS-45-TC03 | AC3 | api | _Draft:_ Folder upload and bulk import from object storage. | — |
| ECMS-45-TC04 | AC4 | api | _Draft:_ Reports: usage, downloads, expiry, storage. | — |

## Refinement needed

Touches schemas, public APIs, or several layers. Before implementation: write the technical design (in this file, or `backlog/designs/ECMS-45.md` if long), record significant decisions in [`docs/architecture/DECISIONS.md`](../../docs/architecture/DECISIONS.md), finalize the test cases, and split into child tasks if it exceeds the size limit ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `backlog/tasks/ECMS-41.md`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-45/task.md`). |
