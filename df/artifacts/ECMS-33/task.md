# ECMS-33 — Staged releases console

## Summary

- Priority: P2
- Type: Story
- Current state: `READY_FOR_DESIGN`
- Owner role: `designer`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Manage releases from the UI.

## Current state in FlexCMS

No UI.

## Acceptance criteria

- [ ] AC1: Design package for release list, create, compare with source, promote dialog.
- [ ] AC2: Editing inside a release uses the normal editor with a visible release banner.
- [ ] AC3: Selenium: create, edit, sync, promote, verify source updated.

## Routing

Visible UI work with no approved design reference. `designer` produces the design package under `design/{page-slug}/`, then the task moves to `READY_FOR_DEV` for `frontend-dev`.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-32

## Read first

- `df/artifacts/ECMS-32/task.md`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DESIGN | Created from the ECMS-00 gap analysis. |
