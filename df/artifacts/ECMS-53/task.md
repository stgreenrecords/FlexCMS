# ECMS-53 — User, group, and permissions management UI

## Summary

- Priority: P2
- Type: Story
- Current state: `READY_FOR_DEV`
- Owner role: `frontend-dev`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Isolate brand or country teams to their own subtree without API calls.

## Current state in FlexCMS

Path ACLs are API-only; no user/group UI.

## Acceptance criteria

- [ ] AC1: Users and groups screens per `user_management` design.
- [ ] AC2: Permissions console: per-path ACL editor (allow/deny READ/WRITE/DELETE/PUBLISH/MANAGE_ACL), inherited entries shown, effective permissions for a chosen user.
- [ ] AC3: Selenium coverage (enforcement verified in a Keycloak-enabled profile).
- [ ] AC4: Developer testing bar (`DEC-DF-007`): test scenarios for every AC recorded under `df/artifacts/ECMS-53/frontend/`, unit/IT/Selenium tests implemented and green, and `mvn verify` / `pnpm build` pass with zero errors.

## Routing

Ready for `frontend-dev`. Use `@flexcms/ui` components and `var(--color-*)` tokens; every page needs breadcrumb, empty state, and loading skeleton (`CLAUDE.md`).

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-52

## Read first

- `Design/UI/stitch_flexcms_admin_ui_requirements_summary/user_management/`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DEV | Created from the ECMS-00 gap analysis. |
