# ECMS-09 — Version history, compare, and as-of view in the editor

## Summary

- Priority: P1
- Type: Story
- Current state: `READY_FOR_DESIGN`
- Owner role: `designer`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Authors can browse, compare, restore, and time-travel versions from the UI.

## Current state in FlexCMS

Version history is API-only; the Content Tree 'Version history' rail icon is inert (test doc GAP-032, VER-012).

## Acceptance criteria

- [ ] AC1: Design package (may adapt `product_version_history`) for a version panel: list with labels, side-by-side compare, restore with confirmation.
- [ ] AC2: An as-of mode in the editor/preview renders the page at a chosen date, read-only.
- [ ] AC3: Restore creates a new version and the UI refreshes.
- [ ] AC4: Selenium: create versions, compare, restore, and verify the as-of view.

## Routing

Visible UI work with no approved design reference. `designer` produces the design package under `design/{page-slug}/`, then the task moves to `READY_FOR_DEV` for `frontend-dev`.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-08

## Read first

- `Design/UI/stitch_flexcms_admin_ui_requirements_summary/product_version_history/`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DESIGN | Created from the ECMS-00 gap analysis. |
