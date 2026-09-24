# ECMS-14 — Responsive layout mode (per-breakpoint size, hide, order)

## Summary

- Priority: P2
- Type: Story
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Authors guarantee mobile-ready pages without a developer by adjusting layout per breakpoint.

## Current state in FlexCMS

The viewport toggle only narrows the canvas; components have no per-breakpoint layout data.

## Acceptance criteria

- [ ] AC1: Solution design defines the layout data model (grid columns per breakpoint, hidden flags, order) stored on components, and how renderers consume it.
- [ ] AC2: Layout mode in the editor: resize component column span, hide, and reorder per breakpoint.
- [ ] AC3: Site renderers honour the layout data on each breakpoint.
- [ ] AC4: Split into backend (contract) and frontend (editor + renderers) child tasks.

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

- `frontend/packages/site-renderers/`
- `frontend/apps/admin/src/app/editor/page.tsx`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
