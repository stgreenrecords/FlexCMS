# ECMS-36 — Fragment model editor and fragment editor

## Summary

- Priority: P1
- Type: Story
- Current state: `READY_FOR_DESIGN`
- Owner role: `designer`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Content strategists define models and editors author fragments in the browser.

## Current state in FlexCMS

No UI.

## Acceptance criteria

- [ ] AC1: Design package for a model builder (can reuse PIM schema-editor patterns) and a form-style fragment editor with variations and JSON preview.
- [ ] AC2: Frontend: create/edit models, create/edit fragments, manage variations, publish.
- [ ] AC3: Selenium: model → fragment → publish → fetch via headless API.

## Routing

Visible UI work with no approved design reference. `designer` produces the design package under `design/{page-slug}/`, then the task moves to `READY_FOR_DEV` for `frontend-dev`.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-34

## Read first

- `Design/UI/stitch_flexcms_admin_ui_requirements_summary/schema_editor_visual_builder/`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DESIGN | Created from the ECMS-00 gap analysis. |
