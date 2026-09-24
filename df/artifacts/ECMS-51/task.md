# ECMS-51 — Inbox v2 and workflow administration console

## Summary

- Priority: P1
- Type: Story
- Current state: `READY_FOR_DEV`
- Owner role: `frontend-dev`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Every user has a clear personal queue, and admins can monitor and repair workflows.

## Current state in FlexCMS

Inbox shows all instances regardless of user; approve/reject report success even when the API call fails (WF-013 / GAP-109); sort by Newest/Deadline are no-ops.

## Acceptance criteria

- [ ] AC1: Inbox lists only the current user's (and their groups') items; delegate, step back, comment.
- [ ] AC2: Approve/reject show success only after the API confirms; failures are visible and the item stays.
- [ ] AC3: All sort and filter controls work.
- [ ] AC4: Admin console: running/completed/failed instances with terminate, retry, reassign.
- [ ] AC5: Follows `workflow_inbox` design; Selenium coverage including the API-failure case.
- [ ] AC6: Developer testing bar (`DEC-DF-007`): test scenarios for every AC recorded under `df/artifacts/ECMS-51/frontend/`, unit/IT/Selenium tests implemented and green, and `mvn verify` / `pnpm build` pass with zero errors.

## Routing

Ready for `frontend-dev`. Use `@flexcms/ui` components and `var(--color-*)` tokens; every page needs breadcrumb, empty state, and loading skeleton (`CLAUDE.md`).

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-48

## Read first

- `frontend/apps/admin/src/app/(admin)/workflows/page.tsx`
- `Design/UI/stitch_flexcms_admin_ui_requirements_summary/workflow_inbox/`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DEV | Created from the ECMS-00 gap analysis. |
