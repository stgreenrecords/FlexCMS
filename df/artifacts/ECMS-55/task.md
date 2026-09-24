# ECMS-55 — Project workspaces

## Summary

- Priority: P3
- Type: Story
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

One dashboard per campaign or initiative.

## Current state in FlexCMS

No project concept.

## Acceptance criteria

- [ ] AC1: Project entity grouping pages, assets, fragments, tasks, team, and due dates.
- [ ] AC2: Project dashboard tiles (tasks, assets, releases, translation jobs).
- [ ] AC3: Project templates.

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
