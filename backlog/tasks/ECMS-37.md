# ECMS-37 — Fragment component for pages (hybrid delivery)

| Field | Value |
|---|---|
| Type | Story |
| Priority | P2 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-34](ECMS-34.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Reuse the same structured content on web pages and in apps.

## Current state

No way to place a structured fragment on a page.

## Acceptance criteria

- [ ] AC1: A page component that references a fragment and chooses elements and variation to render.
- [ ] AC2: Editing the fragment updates every page that uses it; references reported via ECMS-02.
- [ ] AC3: Split into contract (backend) and renderer (frontend) child tasks.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-37-TC01 | AC1 | api | _Draft:_ A page component that references a fragment and chooses elements and variation to render. | — |
| ECMS-37-TC02 | AC2 | api | _Draft:_ Editing the fragment updates every page that uses it; references reported via ECMS-02. | — |

## Refinement needed

Touches schemas, public APIs, or several layers. Before implementation: write the technical design (in this file, or `backlog/designs/ECMS-37.md` if long), record significant decisions in [`docs/architecture/DECISIONS.md`](../../docs/architecture/DECISIONS.md), finalize the test cases, and split into child tasks if it exceeds the size limit ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `backlog/tasks/ECMS-34.md`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-37/task.md`). |
