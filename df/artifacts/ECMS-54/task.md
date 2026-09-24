# ECMS-54 — Closed user groups for published content

## Summary

- Priority: P3
- Type: Story
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Serve partner portals and member-only sections from the same site.

## Current state in FlexCMS

Published content is public-only.

## Acceptance criteria

- [ ] AC1: Mark a subtree as restricted to groups; publish tier and site renderers require login and group membership.
- [ ] AC2: Permission-aware caching so protected pages stay fast and never leak.

## Routing

Architecture required (touches schemas, public APIs, or more than one lane). `sa` writes `solution-design.md`, records major decisions in `df/runtime/decisions.md`, and splits delivery into single-lane child tasks with explicit dependencies before any implementation starts.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-52

## Read first

- `df/artifacts/ECMS-52/task.md`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
