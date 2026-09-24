# ECMS-58 — Forms: builder, rules, submissions, document of record

## Summary

- Priority: P3
- Type: Spike
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Digital applications and onboarding without a separate forms product.

## Current state in FlexCMS

The 42 form components render read-only on the reference site (R-REB-26-004); there is no submission handling.

## Acceptance criteria

- [ ] AC1: Spike defining an MVP: form container with field components, visual show/hide/validation rules, submission storage, submit actions (store, email, REST, start workflow), and a PDF document of record.
- [ ] AC2: Security review (spam protection, PII handling, retention).
- [ ] AC3: Follow-on task split and estimate.

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

- `df/artifacts/REB-26/devops/blockers.md`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
