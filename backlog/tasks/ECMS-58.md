# ECMS-58 — Forms: builder, rules, submissions, document of record

| Field | Value |
|---|---|
| Type | Spike |
| Priority | P3 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Digital applications and onboarding without a separate forms product.

## Current state

The 42 form components render read-only on the reference site (R-REB-26-004); there is no submission handling.

## Acceptance criteria

- [ ] AC1: Spike defining an MVP: form container with field components, visual show/hide/validation rules, submission storage, submit actions (store, email, REST, start workflow), and a PDF document of record.
- [ ] AC2: Security review (spam protection, PII handling, retention).
- [ ] AC3: Follow-on task split and estimate.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-58-TC01 | AC2 | api | _Draft:_ Security review (spam protection, PII handling, retention). | — |
| ECMS-58-TC02 | AC3 | api | _Draft:_ Follow-on task split and estimate. | — |

## Refinement needed

Touches schemas, public APIs, or several layers. Before implementation: write the technical design (in this file, or `backlog/designs/ECMS-58.md` if long), record significant decisions in [`docs/architecture/DECISIONS.md`](../../docs/architecture/DECISIONS.md), finalize the test cases, and split into child tasks if it exceeds the size limit ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-58/task.md`). |
