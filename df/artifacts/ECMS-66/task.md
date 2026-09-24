# ECMS-66 — Outbound webhooks and event subscriptions

## Summary

- Priority: P2
- Type: Story
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Build integrations on top of FlexCMS without forking it.

## Current state in FlexCMS

Events exist only internally (Spring events, RabbitMQ).

## Acceptance criteria

- [ ] AC1: Subscriptions for content published/unpublished/deleted, asset ingested, workflow transitions, product published.
- [ ] AC2: Signed payloads (HMAC), retries with backoff, delivery log, disable-on-failure.
- [ ] AC3: Admin API for subscriptions.

## Routing

Architecture required (touches schemas, public APIs, or more than one lane). `sa` writes `solution-design.md`, records major decisions in `df/runtime/decisions.md`, and splits delivery into single-lane child tasks with explicit dependencies before any implementation starts.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- none

## Read first

- `flexcms/flexcms-replication/`
- `flexcms/flexcms-plugin-api/`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
