# ECMS-37 — Fragment component for pages (hybrid delivery)

## Summary

- Priority: P2
- Type: Story
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Reuse the same structured content on web pages and in apps.

## Current state in FlexCMS

No way to place a structured fragment on a page.

## Acceptance criteria

- [ ] AC1: A page component that references a fragment and chooses elements and variation to render.
- [ ] AC2: Editing the fragment updates every page that uses it; references reported via ECMS-02.
- [ ] AC3: Split into contract (backend) and renderer (frontend) child tasks.

## Routing

Architecture required (touches schemas, public APIs, or more than one lane). `sa` writes `solution-design.md`, records major decisions in `df/runtime/decisions.md`, and splits delivery into single-lane child tasks with explicit dependencies before any implementation starts.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-34

## Read first

- `df/artifacts/ECMS-34/task.md`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
