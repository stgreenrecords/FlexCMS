# ECMS-14 — Responsive layout mode (per-breakpoint size, hide, order)

| Field | Value |
|---|---|
| Type | Story |
| Priority | P2 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Authors guarantee mobile-ready pages without a developer by adjusting layout per breakpoint.

## Current state

The viewport toggle only narrows the canvas; components have no per-breakpoint layout data.

## Acceptance criteria

- [ ] AC1: Technical design defines the layout data model (grid columns per breakpoint, hidden flags, order) stored on components, and how renderers consume it.
- [ ] AC2: Layout mode in the editor: resize component column span, hide, and reorder per breakpoint.
- [ ] AC3: Site renderers honour the layout data on each breakpoint.
- [ ] AC4: Split into backend (contract) and frontend (editor + renderers) child tasks.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-14-TC01 | AC2 | ui | _Draft:_ Layout mode in the editor: resize component column span, hide, and reorder per breakpoint. | — |
| ECMS-14-TC02 | AC3 | api | _Draft:_ Site renderers honour the layout data on each breakpoint. | — |

## Refinement needed

Touches schemas, public APIs, or several layers. Before implementation: write the technical design (in this file, or `backlog/designs/ECMS-14.md` if long), record significant decisions in [`docs/architecture/DECISIONS.md`](../../docs/architecture/DECISIONS.md), finalize the test cases, and split into child tasks if it exceeds the size limit ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `frontend/packages/site-renderers/`
- `frontend/apps/admin/src/app/editor/page.tsx`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-14/task.md`). |
