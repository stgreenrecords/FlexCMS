# ECMS-17 — Audit log viewer

## Summary

- Priority: P2
- Type: Story
- Current state: `READY_FOR_DESIGN`
- Owner role: `designer`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Compliance and admins can see who did what and when without API access.

## Current state in FlexCMS

Audit API is complete (`/api/author/audit` with entity/path/user/action/date filters); there is no UI and the Dashboard link is inert (test doc GAP-090).

## Acceptance criteria

- [ ] AC1: Design package for an audit log screen with filters and a per-page history drawer.
- [ ] AC2: Frontend: filter by entity type, path, user, action, and date range; paginated; link to the affected node.
- [ ] AC3: Per-page audit tab reachable from the Content Tree.
- [ ] AC4: Selenium: perform actions and find them in the log.

## Routing

Visible UI work with no approved design reference. `designer` produces the design package under `design/{page-slug}/`, then the task moves to `READY_FOR_DEV` for `frontend-dev`.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- none

## Read first

- `flexcms/flexcms-author/src/main/java/com/flexcms/author/controller/AuditLogController.java`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DESIGN | Created from the ECMS-00 gap analysis. |
