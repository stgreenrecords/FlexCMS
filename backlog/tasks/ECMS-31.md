# ECMS-31 — Preview tier for stakeholder review

| Field | Value |
|---|---|
| Type | Story |
| Priority | P3 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Stakeholders review content on a production-like tier before it is public.

## Current state

Only author and publish tiers exist.

## Acceptance criteria

- [ ] AC1: Technical design for a preview run mode (third tier or publish instance with preview flag), replication target, and access control.
- [ ] AC2: Authors can 'publish to preview' and share a preview URL.
- [ ] AC3: Delivery is split into child tasks (infrastructure and backend) during refinement.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-31-TC01 | AC2 | api | _Draft:_ Authors can 'publish to preview' and share a preview URL. | — |

## Refinement needed

Touches schemas, public APIs, or several layers. Before implementation: write the technical design (in this file, or `backlog/designs/ECMS-31.md` if long), record significant decisions in [`docs/architecture/DECISIONS.md`](../../docs/architecture/DECISIONS.md), finalize the test cases, and split into child tasks if it exceeds the size limit ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `flexcms/flexcms-app/src/main/resources/`
- `infra/local/docker-compose.dev.yml`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-31/task.md`). |
