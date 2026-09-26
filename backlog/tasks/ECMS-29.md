# ECMS-29 — Replication hardening and publish-with-references

| Field | Value |
|---|---|
| Type | Story |
| Priority | P1 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | [ECMS-02](ECMS-02.md), [ECMS-03](ECMS-03.md) |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Nothing goes live with missing images or broken fragments, and operators can see and act on replication health.

## Current state

Every replication log entry stays PENDING forever (GAP-100); no retry or pause; no way to publish a page together with what it references.

## Acceptance criteria

- [ ] AC1: Publish tier acknowledges each event; the log records COMPLETED or FAILED with an error.
- [ ] AC2: Automatic retry with backoff; queue pause/resume; manual retry of failed events.
- [ ] AC3: Publish-with-references API: given a page, returns (dry run) and then publishes the set of referenced assets, fragments, and optionally children.
- [ ] AC4: Replication status endpoint counts are accurate.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-29-TC01 | AC1 | api | _Draft:_ Publish tier acknowledges each event; the log records COMPLETED or FAILED with an error. | — |
| ECMS-29-TC02 | AC2 | api | _Draft:_ Automatic retry with backoff; queue pause/resume; manual retry of failed events. | — |
| ECMS-29-TC03 | AC3 | api | _Draft:_ Publish-with-references API: given a page, returns (dry run) and then publishes the set of referenced assets, fragments, and optionally children. | — |
| ECMS-29-TC04 | AC4 | api | _Draft:_ Replication status endpoint counts are accurate. | — |

## Refinement needed

Touches schemas, public APIs, or several layers. Before implementation: write the technical design (in this file, or `backlog/designs/ECMS-29.md` if long), record significant decisions in [`docs/architecture/DECISIONS.md`](../../docs/architecture/DECISIONS.md), finalize the test cases, and split into child tasks if it exceeds the size limit ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Out of scope

- UI (ECMS-30).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `flexcms/flexcms-replication/`
- `flexcms/flexcms-author/src/main/java/com/flexcms/author/controller/ReplicationMonitorController.java`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-29/task.md`). |
