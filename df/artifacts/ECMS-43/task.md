# ECMS-43 — Metadata schemas and folder profiles

## Summary

- Priority: P2
- Type: Story
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Creative ops define what metadata assets must carry, and uploads get sensible defaults automatically.

## Current state in FlexCMS

No metadata schemas or profiles.

## Acceptance criteria

- [ ] AC1: Metadata schemas per folder or asset type (text, date, dropdown, tags, required fields).
- [ ] AC2: Folder metadata profiles pre-fill values on upload; processing profiles choose extra renditions.
- [ ] AC3: Bulk metadata edit and CSV import/export.
- [ ] AC4: Split into backend and frontend child tasks.

## Routing

Architecture required (touches schemas, public APIs, or more than one lane). `sa` writes `solution-design.md`, records major decisions in `df/runtime/decisions.md`, and splits delivery into single-lane child tasks with explicit dependencies before any implementation starts.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-41

## Read first

- `df/artifacts/ECMS-41/task.md`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
