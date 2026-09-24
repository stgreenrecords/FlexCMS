# ECMS-16 — Spreadsheet-style bulk property editor

## Summary

- Priority: P3
- Type: Story
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Edit a property across many pages at once (e.g. fix descriptions site-wide).

## Current state in FlexCMS

Only single-node property updates exist.

## Acceptance criteria

- [ ] AC1: Bulk properties API with per-path result reporting (like existing bulk operations).
- [ ] AC2: Grid UI: pick a subtree and columns, edit cells, save with per-row errors.
- [ ] AC3: Split into backend and frontend child tasks.

## Routing

Architecture required (touches schemas, public APIs, or more than one lane). `sa` writes `solution-design.md`, records major decisions in `df/runtime/decisions.md`, and splits delivery into single-lane child tasks with explicit dependencies before any implementation starts.

## Out of scope

- none

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- ECMS-06

## Read first

- `flexcms/flexcms-author/src/main/java/com/flexcms/author/controller/AuthorContentController.java`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
