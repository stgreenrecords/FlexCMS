# ECMS-48 — Workflow engine v2

| Field | Value |
|---|---|
| Type | Story |
| Priority | P1 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Enforce the four-eyes principle before publication with workflows that assign real people and complete properly.

## Current state

One seeded model; step→status mapping hardcoded; `for-user` ignores the user (GAP-101); instances never complete (GAP-102); invalid actions return 500.

## Acceptance criteria

- [ ] AC1: Workflow model CRUD API with validation.
- [ ] AC2: Step types: participant (user or group), process (plugin step), OR/AND split, sub-workflow, end.
- [ ] AC3: Per-user/group inbox query; delegate, step back, and comment on work items.
- [ ] AC4: Instances complete at an end step; configurable step→content-status mapping.
- [ ] AC5: Timeouts and escalation.
- [ ] AC6: Ship request-for-publication, request-for-deletion, and publish-later models.
- [ ] AC7: Illegal transitions return 409/400, never 500.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-48-TC01 | AC1 | api | _Draft:_ Workflow model CRUD API with validation. | — |
| ECMS-48-TC02 | AC2 | api | _Draft:_ Step types: participant (user or group), process (plugin step), OR/AND split, sub-workflow, end. | — |
| ECMS-48-TC03 | AC3 | api | _Draft:_ Per-user/group inbox query; delegate, step back, and comment on work items. | — |
| ECMS-48-TC04 | AC4 | api | _Draft:_ Instances complete at an end step; configurable step→content-status mapping. | — |
| ECMS-48-TC05 | AC5 | api | _Draft:_ Timeouts and escalation. | — |
| ECMS-48-TC06 | AC6 | api | _Draft:_ Ship request-for-publication, request-for-deletion, and publish-later models. | — |
| ECMS-48-TC07 | AC7 | api | _Draft:_ Illegal transitions return 409/400, never 500. | — |

## Refinement needed

Touches schemas, public APIs, or several layers. Before implementation: write the technical design (in this file, or `backlog/designs/ECMS-48.md` if long), record significant decisions in [`docs/architecture/DECISIONS.md`](../../docs/architecture/DECISIONS.md), finalize the test cases, and split into child tasks if it exceeds the size limit ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Out of scope

- Model editor UI (ECMS-50); inbox UI (ECMS-51).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `flexcms/flexcms-author/src/main/java/com/flexcms/author/service/WorkflowEngine.java`
- `flexcms/flexcms-plugin-api/`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-48/task.md`). |
