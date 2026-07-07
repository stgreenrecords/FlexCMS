# REB-11 — Reimplement admin authoring/editor flows for new components/templates

## Summary

- Priority: P1
- Owner role/lane: `frontend-dev`
- Parent planning task: `REB-00`

## Goal

Reimplement admin authoring/editor flows for new components/templates.

## Read first

- `df/artifacts/REB-00/task.md`
- `df/artifacts/REB-00/solution-design.md`
- `docs/FLEXCMS_BUSINESS_CONTEXT.md`
- `docs/list-ofcomponents-tempaltes-and-page-trees.txt`

## Dependencies

- REB-04
- REB-08

## Acceptance criteria

- AC1: Admin UI supports authoring/editing the generated component fields and template assignments.
- AC2: Admin pages use `@flexcms/ui` for interactive controls and include breadcrumbs, loading skeletons, and empty states.
- AC3: Edit/save/preview flow works against real author API in local profile.
- AC4: Stable selectors needed by Selenium are added without leaking implementation details.
- AC5: Frontend build passes and evidence is recorded.

## Notes

This task is part of the clean rebuild backlog created on 2026-07-07. Follow the one-role-per-session Dark Factory workflow and write lane-specific evidence in this task's artifact folder.
