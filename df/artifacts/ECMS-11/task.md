# ECMS-11 — Annotate mode in the editor

## Summary

- Priority: P2
- Type: Story
- Current state: `READY_FOR_DESIGN`
- Owner role: `designer`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Reviewers annotate components directly on the canvas.

## Current state in FlexCMS

No review mode in the editor.

## Acceptance criteria

- [ ] AC1: Design package for an annotate mode: markers on components, thread panel, resolve.
- [ ] AC2: Frontend: create, reply, resolve annotations; count badge in the editor header.
- [ ] AC3: Selenium: annotate a component, reload, resolve.

## Routing

Visible UI work with no approved design reference. `designer` produces the design package under `design/{page-slug}/`, then the task moves to `READY_FOR_DEV` for `frontend-dev`.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-10

## Read first

- `frontend/apps/admin/src/app/editor/page.tsx`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DESIGN | Created from the ECMS-00 gap analysis. |
