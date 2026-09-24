# ECMS-48 — Workflow engine v2

## Summary

- Priority: P1
- Type: Story
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Enforce the four-eyes principle before publication with workflows that assign real people and complete properly.

## Current state in FlexCMS

One seeded model; step→status mapping hardcoded; `for-user` ignores the user (GAP-101); instances never complete (GAP-102); invalid actions return 500.

## Acceptance criteria

- [ ] AC1: Workflow model CRUD API with validation.
- [ ] AC2: Step types: participant (user or group), process (plugin step), OR/AND split, sub-workflow, end.
- [ ] AC3: Per-user/group inbox query; delegate, step back, and comment on work items.
- [ ] AC4: Instances complete at an end step; configurable step→content-status mapping.
- [ ] AC5: Timeouts and escalation.
- [ ] AC6: Ship request-for-publication, request-for-deletion, and publish-later models.
- [ ] AC7: Illegal transitions return 409/400, never 500.

## Routing

Architecture required (touches schemas, public APIs, or more than one lane). `sa` writes `solution-design.md`, records major decisions in `df/runtime/decisions.md`, and splits delivery into single-lane child tasks with explicit dependencies before any implementation starts.

## Out of scope

- Model editor UI (ECMS-50); inbox UI (ECMS-51).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- none

## Read first

- `flexcms/flexcms-author/src/main/java/com/flexcms/author/service/WorkflowEngine.java`
- `flexcms/flexcms-plugin-api/`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
