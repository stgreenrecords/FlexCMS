# ECMS-56 — Maintenance jobs: version, audit, and workflow purge

## Summary

- Priority: P3
- Type: Story
- Current state: `READY_FOR_DEV`
- Owner role: `backend-dev`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Keep storage bounded in long-running installations.

## Current state in FlexCMS

Versions, audit entries, and workflow instances accumulate forever.

## Acceptance criteria

- [ ] AC1: Configurable retention policies for content versions (keep N / keep newer than D, always keep labelled), audit log, completed workflows, replication log.
- [ ] AC2: Scheduled jobs with dry-run and run-now endpoints; results recorded.
- [ ] AC3: Unit + IT coverage.
- [ ] AC4: Developer testing bar (`DEC-DF-007`): test scenarios for every AC recorded under `df/artifacts/ECMS-56/backend/`, unit/IT/Selenium tests implemented and green, and `mvn verify` / `pnpm build` pass with zero errors.

## Routing

Ready for `backend-dev`. Follow `CLAUDE.md` layering (model → repository → service → controller) and existing exception/RFC 7807 conventions.

## Out of scope

- Operations dashboard (ECMS-57).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- none

## Read first

- `flexcms/flexcms-core/src/main/java/com/flexcms/core/service/AuditService.java`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | READY_FOR_DEV | Created from the ECMS-00 gap analysis. |
