# ECMS-24 — Live copy console and inheritance indicators in the editor

## Summary

- Priority: P1
- Type: Story
- Current state: `READY_FOR_DESIGN`
- Owner role: `designer`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Site owners see which sites are in sync and manage live copies without API calls.

## Current state in FlexCMS

Live copy is API-only.

## Acceptance criteria

- [ ] AC1: Design package for a live-copy overview console and editor inheritance states.
- [ ] AC2: Create live copy, roll out, suspend/resume, detach from the UI.
- [ ] AC3: Editor shows inherited components as locked with cancel/re-enable inheritance actions.
- [ ] AC4: Selenium: create a live copy, change source, roll out, cancel inheritance on one component, roll out again, assert local change survives.

## Routing

Visible UI work with no approved design reference. `designer` produces the design package under `design/{page-slug}/`, then the task moves to `READY_FOR_DEV` for `frontend-dev`.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-23

## Read first

- `df/artifacts/ECMS-23/task.md`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DESIGN | Created from the ECMS-00 gap analysis. |
