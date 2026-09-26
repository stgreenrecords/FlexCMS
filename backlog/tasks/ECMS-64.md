# ECMS-64 — Real-user monitoring and Core Web Vitals

| Field | Value |
|---|---|
| Type | Story |
| Priority | P3 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Performance and engagement insight per page without third-party scripts.

## Current state

No field performance data.

## Acceptance criteria

- [ ] AC1: Lightweight beacon from the site renderers (LCP, INP, CLS) to a collection endpoint, sampled.
- [ ] AC2: Per-page dashboard in the admin.
- [ ] AC3: Privacy-safe (no personal data).

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-64-TC01 | AC1 | api | _Draft:_ Lightweight beacon from the site renderers (LCP, INP, CLS) to a collection endpoint, sampled. | — |
| ECMS-64-TC02 | AC2 | ui | _Draft:_ Per-page dashboard in the admin. | — |
| ECMS-64-TC03 | AC3 | api | _Draft:_ Privacy-safe (no personal data). | — |

## Refinement needed

Touches schemas, public APIs, or several layers. Before implementation: write the technical design (in this file, or `backlog/designs/ECMS-64.md` if long), record significant decisions in [`docs/architecture/DECISIONS.md`](../../docs/architecture/DECISIONS.md), finalize the test cases, and split into child tasks if it exceeds the size limit ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `frontend/apps/site-nextjs/`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-64/task.md`). |
