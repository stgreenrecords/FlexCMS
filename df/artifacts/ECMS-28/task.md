# ECMS-28 — Translation projects UI

## Summary

- Priority: P2
- Type: Story
- Current state: `READY_FOR_DESIGN`
- Owner role: `designer`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Localisation managers create language copies and run translation jobs from the UI.

## Current state in FlexCMS

No UI for language copies or jobs.

## Acceptance criteria

- [ ] AC1: Design package for projects, jobs, and side-by-side review.
- [ ] AC2: Create language copy from the Content Tree; job list with states; side-by-side source/target review with approve/reject.
- [ ] AC3: Selenium: create a job, machine-translate, review, approve, and verify target pages.

## Routing

Visible UI work with no approved design reference. `designer` produces the design package under `design/{page-slug}/`, then the task moves to `READY_FOR_DEV` for `frontend-dev`.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-27

## Read first

- `df/artifacts/ECMS-27/task.md`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DESIGN | Created from the ECMS-00 gap analysis. |
