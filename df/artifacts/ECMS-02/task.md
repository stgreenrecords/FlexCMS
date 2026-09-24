# ECMS-02 — Reference index and 'where used' API for pages, assets, and fragments

## Summary

- Priority: P1
- Type: Story
- Current state: `NEEDS_ARCHITECTURE`
- Owner role: `sa`
- Program: `ECMS-00` — enterprise-level CMS parity (`df/artifacts/ECMS-00/gap-analysis.md`)

## Business goal

Let authors see every place a page, asset, or fragment is used before changing, unpublishing, or deleting it.

## Current state in FlexCMS

Only the component registry reports usages. Asset Detail's Usage References panel is permanently empty; deleting a referenced asset or page gives no warning.

## Acceptance criteria

- [ ] AC1: Solution design decides between maintaining a reference table on write vs. querying JSONB on read, with a measured cost on the seeded dataset.
- [ ] AC2: API returns inbound references for a page path, asset path/id, or fragment path, including the referring node path, property name, and status (draft/published).
- [ ] AC3: References inside component properties (links, `x-asset` fields, fragment references) are detected from the component `dataSchema`, not by string guessing.
- [ ] AC4: Delete and unpublish endpoints can report affected references (dry-run flag) so the UI can warn.
- [ ] AC5: Reference data stays correct after move, rename, copy, and delete.

## Routing

Architecture required (touches schemas, public APIs, or more than one lane). `sa` writes `solution-design.md`, records major decisions in `df/runtime/decisions.md`, and splits delivery into single-lane child tasks with explicit dependencies before any implementation starts.

## Out of scope

- UI panels (delivered by the console tasks that consume this API).

## Assumptions

- Native platform capability only; third-party integrations are out of scope for the ECMS program.
- The backend returns JSON only; any HTML output is produced by the frontend render service.

## Dependencies

- none

## Read first

- `flexcms/flexcms-core/src/main/java/com/flexcms/core/service/ContentNodeService.java`
- `Design/tut-usa/generated/component-contracts.json`

## Role history

| Timestamp | Role | State | Summary |
|---|---|---|---|
| 2026-09-24 local | sa | NEEDS_ARCHITECTURE | Created from the ECMS-00 gap analysis. |
