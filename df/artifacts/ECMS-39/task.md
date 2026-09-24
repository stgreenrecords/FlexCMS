# ECMS-39 — Experience Fragment export and variations inheriting from master

## Summary

- Priority: P2
- Type: Story
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Reuse web-authored blocks outside the site (email, partner sites) and keep channel variations in sync with the master.

## Current state in FlexCMS

No export; variations are independent copies.

## Acceptance criteria

- [ ] AC1: Plain HTML and JSON export of a variation, produced by the frontend render service (the backend stays JSON-only).
- [ ] AC2: A variation can be created as a live copy of the master and inherits its changes (via ECMS-23).
- [ ] AC3: Export URLs cacheable and purged on publish.

## Routing

Architecture required (touches schemas, public APIs, or more than one lane). `sa` writes `solution-design.md`, records major decisions in `df/runtime/decisions.md`, and splits delivery into single-lane child tasks with explicit dependencies before any implementation starts.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-23

## Read first

- `frontend/apps/site-nextjs/`
- `flexcms/flexcms-author/src/main/java/com/flexcms/author/service/ExperienceFragmentService.java`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
