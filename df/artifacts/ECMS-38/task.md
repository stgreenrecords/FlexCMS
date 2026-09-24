# ECMS-38 — Experience Fragment console completion

## Summary

- Priority: P1
- Type: Story
- Current state: `READY_FOR_DESIGN`
- Owner role: `designer`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Run site-wide promos and shared blocks entirely from the fragment console.

## Current state in FlexCMS

'+ Create Fragment' and 'Manage Channels' are inert; there is no variation management or references view (test doc GAP-037).

## Acceptance criteria

- [ ] AC1: Design package for create-fragment, channel/variation management, and references.
- [ ] AC2: Create fragment (site, locale, category, name, title); add/rename/delete channel variations.
- [ ] AC3: References panel lists every page using the fragment.
- [ ] AC4: Selenium coverage for each action.

## Routing

Visible UI work with no approved design reference. `designer` produces the design package under `design/{page-slug}/`, then the task moves to `READY_FOR_DEV` for `frontend-dev`.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-02

## Read first

- `frontend/apps/admin/src/app/(admin)/experience-fragments/page.tsx`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DESIGN | Created from the ECMS-00 gap analysis. |
