# ECMS-31 — Preview tier for stakeholder review

## Summary

- Priority: P3
- Type: Story
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Stakeholders review content on a production-like tier before it is public.

## Current state in FlexCMS

Only author and publish tiers exist.

## Acceptance criteria

- [ ] AC1: Solution design for a preview run mode (third tier or publish instance with preview flag), replication target, and access control.
- [ ] AC2: Authors can 'publish to preview' and share a preview URL.
- [ ] AC3: Route delivery to devops/backend-dev child tasks.

## Routing

Architecture required (touches schemas, public APIs, or more than one lane). `sa` writes `solution-design.md`, records major decisions in `df/runtime/decisions.md`, and splits delivery into single-lane child tasks with explicit dependencies before any implementation starts.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- none

## Read first

- `flexcms/flexcms-app/src/main/resources/`
- `infra/local/docker-compose.dev.yml`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
