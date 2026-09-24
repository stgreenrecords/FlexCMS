# ECMS-49 — Event-triggered workflows and notifications

## Summary

- Priority: P2
- Type: Story
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Automated processing on upload or creation with no manual hand-offs, and nothing stalls unnoticed.

## Current state in FlexCMS

No triggers and no notifications.

## Acceptance criteria

- [ ] AC1: Launcher rules: on content event (created/modified/deleted/asset ingested) under a path, start a workflow model.
- [ ] AC2: In-app notifications for assigned work items and watched content; optional email.
- [ ] AC3: Users can watch a page or folder.

## Routing

Architecture required (touches schemas, public APIs, or more than one lane). `sa` writes `solution-design.md`, records major decisions in `df/runtime/decisions.md`, and splits delivery into single-lane child tasks with explicit dependencies before any implementation starts.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-48

## Read first

- `df/artifacts/ECMS-48/task.md`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
