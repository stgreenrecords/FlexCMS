# ECMS-39 — Experience Fragment export and variations inheriting from master

| Field | Value |
|---|---|
| Type | Story |
| Priority | P2 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-23](ECMS-23.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Reuse web-authored blocks outside the site (email, partner sites) and keep channel variations in sync with the master.

## Current state

No export; variations are independent copies.

## Acceptance criteria

- [ ] AC1: Plain HTML and JSON export of a variation, produced by the frontend render service (the backend stays JSON-only).
- [ ] AC2: A variation can be created as a live copy of the master and inherits its changes (via ECMS-23).
- [ ] AC3: Export URLs cacheable and purged on publish.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-39-TC01 | AC1 | api | _Draft:_ Plain HTML and JSON export of a variation, produced by the frontend render service (the backend stays JSON-only). | — |
| ECMS-39-TC02 | AC2 | api | _Draft:_ A variation can be created as a live copy of the master and inherits its changes (via ECMS-23). | — |
| ECMS-39-TC03 | AC3 | api | _Draft:_ Export URLs cacheable and purged on publish. | — |

## Refinement needed

Touches schemas, public APIs, or several layers. Before implementation: write the technical design (in this file, or `backlog/designs/ECMS-39.md` if long), record significant decisions in [`docs/architecture/DECISIONS.md`](../../docs/architecture/DECISIONS.md), finalize the test cases, and split into child tasks if it exceeds the size limit ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `frontend/apps/site-nextjs/`
- `flexcms/flexcms-author/src/main/java/com/flexcms/author/service/ExperienceFragmentService.java`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-39/task.md`). |
