# ECMS-57 — Operations dashboard at /settings

## Summary

- Priority: P3
- Type: Story
- Current state: `READY_FOR_DEV`
- Owner role: `frontend-dev`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Admins see system health and run maintenance from the UI.

## Current state in FlexCMS

`/settings` is linked from the sidebar and top bar but does not exist (GAP-001).

## Acceptance criteria

- [ ] AC1: `/settings` per `system_settings` design: service health, replication queue summary, maintenance jobs with last run and run-now.
- [ ] AC2: Selenium coverage.
- [ ] AC3: Developer testing bar (`DEC-DF-007`): test scenarios for every AC recorded under `df/artifacts/ECMS-57/frontend/`, unit/IT/Selenium tests implemented and green, and `mvn verify` / `pnpm build` pass with zero errors.

## Routing

Ready for `frontend-dev`. Use `@flexcms/ui` components and `var(--color-*)` tokens; every page needs breadcrumb, empty state, and loading skeleton (`CLAUDE.md`).

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-56

## Read first

- `Design/UI/stitch_flexcms_admin_ui_requirements_summary/system_settings/`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DEV | Created from the ECMS-00 gap analysis. |
