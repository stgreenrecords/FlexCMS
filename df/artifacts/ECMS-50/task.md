# ECMS-50 — Visual workflow model editor

## Summary

- Priority: P2
- Type: Story
- Current state: `READY_FOR_DESIGN`
- Owner role: `designer`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Process owners build approval flows without code.

## Current state in FlexCMS

No model editor.

## Acceptance criteria

- [ ] AC1: Design package for a step/transition canvas.
- [ ] AC2: Create and edit models with all ECMS-48 step types; validation errors shown inline.
- [ ] AC3: Selenium: build a two-step model and run it.

## Routing

Visible UI work with no approved design reference. `designer` produces the design package under `design/{page-slug}/`, then the task moves to `READY_FOR_DEV` for `frontend-dev`.

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
| 2026-09-24 local | sa | READY_FOR_DESIGN | Created from the ECMS-00 gap analysis. |
