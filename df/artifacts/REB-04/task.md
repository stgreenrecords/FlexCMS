# REB-04 — Generate component/template/page-tree contracts from inventory

## Summary

- Priority: P0
- Owner role/lane: `backend-dev`
- Parent planning task: `REB-00`

## Goal

Generate component/template/page-tree contracts from inventory.

## Read first

- `df/artifacts/REB-00/task.md`
- `df/artifacts/REB-00/solution-design.md`
- `docs/FLEXCMS_BUSINESS_CONTEXT.md`
- `docs/list-ofcomponents-tempaltes-and-page-trees.txt`

## Dependencies

- REB-01

## Acceptance criteria

- AC1: Parse or transform the 406-component inventory into a validated `component-contracts.json` artifact.
- AC2: Generate `template-contracts.json` for all 21 TUT templates with required embedded and allowed optional components.
- AC3: Generate `page-tree.json` with URL path, content path, title, and template assignment.
- AC4: Define migration/import approach for `component_definitions` and `template_definitions` without violating Flyway version rules.
- AC5: Backend contract remains JSON-only and respects layer boundaries.

## Notes

This task is part of the clean rebuild backlog created on 2026-07-07. Follow the one-role-per-session Dark Factory workflow and write lane-specific evidence in this task's artifact folder.
