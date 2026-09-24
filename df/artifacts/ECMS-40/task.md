# ECMS-40 — Experience Fragment building blocks

## Summary

- Priority: P3
- Type: Story
- Current state: `READY_FOR_DESIGN`
- Owner role: `designer`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Assemble new fragments faster from approved component groups.

## Current state in FlexCMS

No building-block concept.

## Acceptance criteria

- [ ] AC1: Select components in a fragment and save them as a reusable block.
- [ ] AC2: Insert blocks into other fragments from the palette.
- [ ] AC3: Selenium coverage.

## Routing

Visible UI work with no approved design reference. `designer` produces the design package under `design/{page-slug}/`, then the task moves to `READY_FOR_DEV` for `frontend-dev`.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-38

## Read first

- `df/artifacts/ECMS-38/task.md`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DESIGN | Created from the ECMS-00 gap analysis. |
