# ECMS-44 — Asset versioning, check-out, expiry/licence, and review

| Field | Value |
|---|---|
| Type | Story |
| Priority | P2 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-41](ECMS-41.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Controlled creative review with an audit trail, and no expired asset reaches the public.

## Current state

Assets have no versions, locks, expiry, or review state.

## Acceptance criteria

- [ ] AC1: Asset versions on binary replace with compare and restore.
- [ ] AC2: Check-in/check-out preventing concurrent edits.
- [ ] AC3: Expiry date and licence status; expired assets flagged and blocked from publish.
- [ ] AC4: Review/approval state usable by workflows (ECMS-48).

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-44-TC01 | AC1 | api | _Draft:_ Asset versions on binary replace with compare and restore. | — |
| ECMS-44-TC02 | AC2 | api | _Draft:_ Check-in/check-out preventing concurrent edits. | — |
| ECMS-44-TC03 | AC3 | api | _Draft:_ Expiry date and licence status; expired assets flagged and blocked from publish. | — |
| ECMS-44-TC04 | AC4 | api | _Draft:_ Review/approval state usable by workflows (ECMS-48). | — |

## Refinement needed

Touches schemas, public APIs, or several layers. Before implementation: write the technical design (in this file, or `backlog/designs/ECMS-44.md` if long), record significant decisions in [`docs/architecture/DECISIONS.md`](../../docs/architecture/DECISIONS.md), finalize the test cases, and split into child tasks if it exceeds the size limit ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `backlog/tasks/ECMS-41.md`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-44/task.md`). |
