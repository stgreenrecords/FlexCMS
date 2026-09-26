# ECMS-66 — Outbound webhooks and event subscriptions

| Field | Value |
|---|---|
| Type | Story |
| Priority | P2 |
| Area | Full-stack (confirm in refinement) |
| Program | ECMS — enterprise-CMS parity ([gap analysis](../../docs/product/ECMS_GAP_ANALYSIS.md)) |
| Depends on | — |

> Status is tracked only in [`backlog/BOARD.md`](../BOARD.md).

## Goal

Build integrations on top of FlexCMS without forking it.

## Current state

Events exist only internally (Spring events, RabbitMQ).

## Acceptance criteria

- [ ] AC1: Subscriptions for content published/unpublished/deleted, asset ingested, workflow transitions, product published.
- [ ] AC2: Signed payloads (HMAC), retries with backoff, delivery log, disable-on-failure.
- [ ] AC3: Admin API for subscriptions.

## Test cases

> **Draft** — generated from the acceptance criteria during migration. Before implementation starts, rewrite each row as a concrete Given/When/Then scenario, add negative/edge cases, and fill **Automated in** with the spec file (see [`docs/process/TESTING.md`](../../docs/process/TESTING.md)).

| TC | Covers | Level | Scenario | Automated in |
|---|---|---|---|---|
| ECMS-66-TC01 | AC1 | api | _Draft:_ Subscriptions for content published/unpublished/deleted, asset ingested, workflow transitions, product published. | — |
| ECMS-66-TC02 | AC2 | api | _Draft:_ Signed payloads (HMAC), retries with backoff, delivery log, disable-on-failure. | — |
| ECMS-66-TC03 | AC3 | ui | _Draft:_ Admin API for subscriptions. | — |

## Refinement needed

Touches schemas, public APIs, or several layers. Before implementation: write the technical design (in this file, or `backlog/designs/ECMS-66.md` if long), record significant decisions in [`docs/architecture/DECISIONS.md`](../../docs/architecture/DECISIONS.md), finalize the test cases, and split into child tasks if it exceeds the size limit ([SDLC §4](../../docs/process/SDLC.md#4-refinement)).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Read first

- `flexcms/flexcms-replication/`
- `flexcms/flexcms-plugin-api/`

## Log

| Date | Note |
|---|---|
| 2026-09-24 | Created from the ECMS-00 gap analysis. |
| 2026-09-26 | Migrated from the retired Dark Factory workflow (`git show archive/dark-factory:df/artifacts/ECMS-66/task.md`). |
