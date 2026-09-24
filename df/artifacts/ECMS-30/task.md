# ECMS-30 — Publish-with-references wizard and replication queue console

## Summary

- Priority: P1
- Type: Story
- Current state: `READY_FOR_DESIGN`
- Owner role: `designer`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Authors see exactly what will go live; operators see replication health.

## Current state in FlexCMS

No UI for either.

## Acceptance criteria

- [ ] AC1: Design package for a publish wizard (items, references, children, schedule) and a queue console.
- [ ] AC2: Wizard shows the dry-run set, lets the author include/exclude references, and publishes or schedules.
- [ ] AC3: Queue console: pending/failed/completed counts, failed-event list with retry, pause/resume.
- [ ] AC4: Selenium: publish with a referenced unpublished asset and assert both are live.

## Routing

Visible UI work with no approved design reference. `designer` produces the design package under `design/{page-slug}/`, then the task moves to `READY_FOR_DEV` for `frontend-dev`.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-29

## Read first

- `df/artifacts/ECMS-29/task.md`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DESIGN | Created from the ECMS-00 gap analysis. |
