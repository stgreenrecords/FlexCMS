# ECMS-62 — Admin omnisearch and site search component

## Summary

- Priority: P2
- Type: Story
- Current state: `READY_FOR_DESIGN`
- Owner role: `designer`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Authors jump to any page, asset, or fragment; visitors search the site with suggestions.

## Current state in FlexCMS

The top-bar search is inert (GAP-010).

## Acceptance criteria

- [ ] AC1: Design package for omnisearch results.
- [ ] AC2: ⌘K omnisearch across pages, assets, fragments, and tags.
- [ ] AC3: Site search component with live suggestions and facets.
- [ ] AC4: Selenium coverage.

## Routing

Visible UI work with no approved design reference. `designer` produces the design package under `design/{page-slug}/`, then the task moves to `READY_FOR_DEV` for `frontend-dev`.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-61

## Read first

- `frontend/apps/admin/src/components/TopNav.tsx`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DESIGN | Created from the ECMS-00 gap analysis. |
