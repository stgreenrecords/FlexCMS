# ECMS-64 — Real-user monitoring and Core Web Vitals

## Summary

- Priority: P3
- Type: Story
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Performance and engagement insight per page without third-party scripts.

## Current state in FlexCMS

No field performance data.

## Acceptance criteria

- [ ] AC1: Lightweight beacon from the site renderers (LCP, INP, CLS) to a collection endpoint, sampled.
- [ ] AC2: Per-page dashboard in the admin.
- [ ] AC3: Privacy-safe (no personal data).

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

- `frontend/apps/site-nextjs/`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
