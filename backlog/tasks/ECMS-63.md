# ECMS-63 — Native personalisation: visitor context, segments, targeted experiences, A/B

| Field | Value |
|---|---|
| Type | Spike |
| Priority | P3 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Persona-based content and simple experiments without a separate product.

## Current state

Nothing exists.

## Acceptance criteria

- [ ] AC1: Spike defining visitor context stores (device, geo, time, behaviour), a segment rule editor, per-component experience variants, and A/B allocation with basic reporting.
- [ ] AC2: Privacy and consent requirements documented.
- [ ] AC3: Follow-on task split.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-63-TC01 | AC2 | api | _Draft:_ Privacy and consent requirements documented. | — |
| ECMS-63-TC02 | AC3 | api | _Draft:_ Follow-on task split. | — |

## Refinement needed

Touches schemas, public APIs, or several layers. Before implementation: write the technical design (in this file, or `backlog/designs/ECMS-63.md` if long), record significant decisions in [`docs/architecture/DECISIONS.md`](../../docs/architecture/DECISIONS.md), finalize the test cases, and split into child tasks if it exceeds the size limit ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `frontend/packages/sdk/`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-63/task.md`). |
