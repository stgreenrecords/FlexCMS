# ECMS-44 — Asset versioning, check-out, expiry/licence, and review

## Summary

- Priority: P2
- Type: Story
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Controlled creative review with an audit trail, and no expired asset reaches the public.

## Current state in FlexCMS

Assets have no versions, locks, expiry, or review state.

## Acceptance criteria

- [ ] AC1: Asset versions on binary replace with compare and restore.
- [ ] AC2: Check-in/check-out preventing concurrent edits.
- [ ] AC3: Expiry date and licence status; expired assets flagged and blocked from publish.
- [ ] AC4: Review/approval state usable by workflows (ECMS-48).

## Routing

Architecture required (touches schemas, public APIs, or more than one lane). `sa` writes `solution-design.md`, records major decisions in `df/runtime/decisions.md`, and splits delivery into single-lane child tasks with explicit dependencies before any implementation starts.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-41

## Read first

- `df/artifacts/ECMS-41/task.md`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
