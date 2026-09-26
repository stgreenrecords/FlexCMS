# ECMS-47 — Video and rich media: adaptive streaming, sets, viewers

| Field | Value |
|---|---|
| Type | Story |
| Priority | P3 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-46](ECMS-46.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

High-quality video on any network from one upload, and rich product media without custom code.

## Current state

Video is stored as an original file only.

## Acceptance criteria

- [ ] AC1: Transcode to adaptive streams (HLS/DASH) with profiles; posters and thumbnails; captions.
- [ ] AC2: Image sets and spin sets managed as single assets.
- [ ] AC3: Responsive, accessible viewers (zoom, 360, video) usable from components.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-47-TC01 | AC1 | api | _Draft:_ Transcode to adaptive streams (HLS/DASH) with profiles; posters and thumbnails; captions. | — |
| ECMS-47-TC02 | AC2 | api | _Draft:_ Image sets and spin sets managed as single assets. | — |
| ECMS-47-TC03 | AC3 | api | _Draft:_ Responsive, accessible viewers (zoom, 360, video) usable from components. | — |

## Refinement needed

Touches schemas, public APIs, or several layers. Before implementation: write the technical design (in this file, or `backlog/designs/ECMS-47.md` if long), record significant decisions in [`docs/architecture/DECISIONS.md`](../../docs/architecture/DECISIONS.md), finalize the test cases, and split into child tasks if it exceeds the size limit ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `backlog/tasks/ECMS-46.md`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-47/task.md`). |
