# ECMS-15 — Framework-agnostic visual editing of external frontends

| Field | Value |
|---|---|
| Type | Spike |
| Priority | P3 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Offer in-context editing for sites not built on the bundled renderers (SPAs, other frameworks), so authoring is one experience across channels.

## Current state

The editor only renders the bundled renderers.

## Acceptance criteria

- [ ] AC1: Spike report evaluating an attribute-based instrumentation SDK (editable regions declared in markup) plus an editor shell that loads the external app in an iframe.
- [ ] AC2: Prototype against `site-nuxt` proving edit-in-place round-trips through the author API.
- [ ] AC3: Recommendation with effort estimate and follow-on task split.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-15-TC01 | AC2 | api | _Draft:_ Prototype against `site-nuxt` proving edit-in-place round-trips through the author API. | — |

## Refinement needed

Touches schemas, public APIs, or several layers. Before implementation: write the technical design (in this file, or `backlog/designs/ECMS-15.md` if long), record significant decisions in [`docs/architecture/DECISIONS.md`](../../docs/architecture/DECISIONS.md), finalize the test cases, and split into child tasks if it exceeds the size limit ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `frontend/apps/site-nuxt/`
- `frontend/packages/sdk/`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-15/task.md`). |
