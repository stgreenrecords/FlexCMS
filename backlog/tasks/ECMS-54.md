# ECMS-54 — Closed user groups for published content

| Field | Value |
|---|---|
| Type | Story |
| Priority | P3 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-52](ECMS-52.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Serve partner portals and member-only sections from the same site.

## Current state

Published content is public-only.

## Acceptance criteria

- [ ] AC1: Mark a subtree as restricted to groups; publish tier and site renderers require login and group membership.
- [ ] AC2: Permission-aware caching so protected pages stay fast and never leak.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-54-TC01 | AC1 | api | _Draft:_ Mark a subtree as restricted to groups; publish tier and site renderers require login and group membership. | — |
| ECMS-54-TC02 | AC2 | api | _Draft:_ Permission-aware caching so protected pages stay fast and never leak. | — |

## Refinement needed

Touches schemas, public APIs, or several layers. Before implementation: write the technical design (in this file, or `backlog/designs/ECMS-54.md` if long), record significant decisions in [`docs/architecture/DECISIONS.md`](../../docs/architecture/DECISIONS.md), finalize the test cases, and split into child tasks if it exceeds the size limit ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `backlog/tasks/ECMS-52.md`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-54/task.md`). |
