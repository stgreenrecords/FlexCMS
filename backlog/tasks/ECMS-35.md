# ECMS-35 — GraphQL generated from fragment models, with persisted queries

| Field | Value |
|---|---|
| Type | Story |
| Priority | P1 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-34](ECMS-34.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Front-end and mobile developers self-serve fast, cacheable structured content.

## Current state

GraphQL is hand-written for pages/nodes/PIM; not model-driven; no persisted queries.

## Acceptance criteria

- [ ] AC1: GraphQL types, list/filter/sort/paginate queries generated from fragment models and regenerated on model change.
- [ ] AC2: Nested fragment-reference traversal with depth limits.
- [ ] AC3: Persisted queries executable by GET with cache headers and CDN purge on content change.
- [ ] AC4: Existing page/PIM GraphQL keeps working.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-35-TC01 | AC1 | api | _Draft:_ GraphQL types, list/filter/sort/paginate queries generated from fragment models and regenerated on model change. | — |
| ECMS-35-TC02 | AC2 | api | _Draft:_ Nested fragment-reference traversal with depth limits. | — |
| ECMS-35-TC03 | AC3 | api | _Draft:_ Persisted queries executable by GET with cache headers and CDN purge on content change. | — |
| ECMS-35-TC04 | AC4 | api | _Draft:_ Existing page/PIM GraphQL keeps working. | — |

## Refinement needed

Touches schemas, public APIs, or several layers. Before implementation: write the technical design (in this file, or `backlog/designs/ECMS-35.md` if long), record significant decisions in [`docs/architecture/DECISIONS.md`](../../docs/architecture/DECISIONS.md), finalize the test cases, and split into child tasks if it exceeds the size limit ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `flexcms/flexcms-headless/src/main/resources/graphql/schema.graphqls`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-35/task.md`). |
