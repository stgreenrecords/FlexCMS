# ECMS-07 — Page properties dialog

## Summary

- Priority: P1
- Type: Story
- Current state: `READY_FOR_DESIGN`
- Owner role: `designer`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Authors can view and edit every page property without touching the API.

## Current state in FlexCMS

No page-properties UI exists; no design reference exists in `Design/UI/`.

## Acceptance criteria

- [ ] AC1: Design package for a tabbed properties dialog (Basic, SEO, Social, Scheduling, Advanced) reachable from the Content Tree and the editor.
- [ ] AC2: Frontend: all ECMS-06 fields editable with validation messages from the API's field errors.
- [ ] AC3: On/off time and publish-later are editable here and reflected in the tree.
- [ ] AC4: Selenium: edit each field, reload, and assert it persisted.

## Routing

Visible UI work with no approved design reference. `designer` produces the design package under `design/{page-slug}/`, then the task moves to `READY_FOR_DEV` for `frontend-dev`.

## Out of scope

- SEO rendering on the site (ECMS-60).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-06

## Read first

- `df/artifacts/ECMS-06/task.md`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DESIGN | Created from the ECMS-00 gap analysis. |
