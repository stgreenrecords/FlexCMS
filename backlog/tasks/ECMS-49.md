# ECMS-49 — Event-triggered workflows and notifications

| Field | Value |
|---|---|
| Type | Story |
| Priority | P2 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-48](ECMS-48.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Automated processing on upload or creation with no manual hand-offs, and nothing stalls unnoticed.

## Current state

No triggers and no notifications.

## Acceptance criteria

- [ ] AC1: Launcher rules: on content event (created/modified/deleted/asset ingested) under a path, start a workflow model.
- [ ] AC2: In-app notifications for assigned work items and watched content; optional email.
- [ ] AC3: Users can watch a page or folder.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-49-TC01 | AC1 | api | _Draft:_ Launcher rules: on content event (created/modified/deleted/asset ingested) under a path, start a workflow model. | — |
| ECMS-49-TC02 | AC2 | api | _Draft:_ In-app notifications for assigned work items and watched content; optional email. | — |
| ECMS-49-TC03 | AC3 | api | _Draft:_ Users can watch a page or folder. | — |

## Refinement needed

Touches schemas, public APIs, or several layers. Before implementation: write the technical design (in this file, or `backlog/designs/ECMS-49.md` if long), record significant decisions in [`docs/architecture/DECISIONS.md`](../../docs/architecture/DECISIONS.md), finalize the test cases, and split into child tasks if it exceeds the size limit ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `backlog/tasks/ECMS-48.md`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-49/task.md`). |
