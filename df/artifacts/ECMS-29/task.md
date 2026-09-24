# ECMS-29 — Replication hardening and publish-with-references

## Summary

- Priority: P1
- Type: Story
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Nothing goes live with missing images or broken fragments, and operators can see and act on replication health.

## Current state in FlexCMS

Every replication log entry stays PENDING forever (GAP-100); no retry or pause; no way to publish a page together with what it references.

## Acceptance criteria

- [ ] AC1: Publish tier acknowledges each event; the log records COMPLETED or FAILED with an error.
- [ ] AC2: Automatic retry with backoff; queue pause/resume; manual retry of failed events.
- [ ] AC3: Publish-with-references API: given a page, returns (dry run) and then publishes the set of referenced assets, fragments, and optionally children.
- [ ] AC4: Replication status endpoint counts are accurate.

## Routing

Architecture required (touches schemas, public APIs, or more than one lane). `sa` writes `solution-design.md`, records major decisions in `df/runtime/decisions.md`, and splits delivery into single-lane child tasks with explicit dependencies before any implementation starts.

## Out of scope

- UI (ECMS-30).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-02
- ECMS-03

## Read first

- `flexcms/flexcms-replication/`
- `flexcms/flexcms-author/src/main/java/com/flexcms/author/controller/ReplicationMonitorController.java`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
