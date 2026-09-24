# ECMS-63 — Native personalisation: visitor context, segments, targeted experiences, A/B

## Summary

- Priority: P3
- Type: Spike
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Persona-based content and simple experiments without a separate product.

## Current state in FlexCMS

Nothing exists.

## Acceptance criteria

- [ ] AC1: Spike defining visitor context stores (device, geo, time, behaviour), a segment rule editor, per-component experience variants, and A/B allocation with basic reporting.
- [ ] AC2: Privacy and consent requirements documented.
- [ ] AC3: Follow-on task split.

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

- `frontend/packages/sdk/`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
