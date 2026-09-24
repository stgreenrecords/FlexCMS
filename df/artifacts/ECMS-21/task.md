# ECMS-21 — Style picker in the editor and style classes in renderers

## Summary

- Priority: P1
- Type: Story
- Current state: `READY_FOR_DESIGN`
- Owner role: `designer`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Authors change a component's look in seconds from approved style options.

## Current state in FlexCMS

No style mechanism exists.

## Acceptance criteria

- [ ] AC1: Design package for a style picker on the component chip.
- [ ] AC2: Editor offers only the styles the component policy allows, honouring single/multi-select groups.
- [ ] AC3: Site renderers (React and Vue) add the mapped classes to the component wrapper; preview updates live.
- [ ] AC4: Selenium: apply a style, publish, assert the class on the public page.

## Routing

Visible UI work with no approved design reference. `designer` produces the design package under `design/{page-slug}/`, then the task moves to `READY_FOR_DEV` for `frontend-dev`.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-19

## Read first

- `frontend/packages/site-renderers/`
- `frontend/packages/react/`
- `frontend/packages/vue/`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DESIGN | Created from the ECMS-00 gap analysis. |
