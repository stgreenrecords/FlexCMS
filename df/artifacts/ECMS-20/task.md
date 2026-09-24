# ECMS-20 — Template editor UI (structure, initial content, policies, styles)

## Summary

- Priority: P1
- Type: Story
- Current state: `READY_FOR_DESIGN`
- Owner role: `designer`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Template authors build and govern page types visually.

## Current state in FlexCMS

No template editor exists and no design reference exists.

## Acceptance criteria

- [ ] AC1: Design package for a template editor with Structure / Initial content / Policies modes.
- [ ] AC2: Frontend: lock/unlock components in structure, place initial content, assign container and component policies, define style groups.
- [ ] AC3: Enable/disable templates and choose site availability.
- [ ] AC4: Selenium: create a template, create a page from it, change structure, and see the page update.

## Routing

Visible UI work with no approved design reference. `designer` produces the design package under `design/{page-slug}/`, then the task moves to `READY_FOR_DEV` for `frontend-dev`.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-18
- ECMS-19

## Read first

- `df/artifacts/ECMS-18/task.md`
- `df/artifacts/ECMS-19/task.md`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DESIGN | Created from the ECMS-00 gap analysis. |
