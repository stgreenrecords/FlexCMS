# REB-08 — Rebuild frontend tokens, fonts, layout shell, and renderer foundation

## Summary

- Priority: P1
- Owner role/lane: `frontend-dev`
- Parent planning task: `REB-00`

## Goal

Rebuild frontend tokens, fonts, layout shell, and renderer foundation.

## Read first

- `df/artifacts/REB-00/task.md`
- `df/artifacts/REB-00/solution-design.md`
- `docs/FLEXCMS_BUSINESS_CONTEXT.md`
- `docs/list-ofcomponents-tempaltes-and-page-trees.txt`

## Dependencies

- REB-01
- REB-04

## Acceptance criteria

- AC1: Implement design tokens and font loading from the approved design package without hardcoded colors.
- AC2: Update public-site shell/layout foundation for TUT rendering.
- AC3: Update SDK/React renderer contract only where required by generated component/template contracts.
- AC4: Preserve named exports and existing workspace conventions.
- AC5: Frontend build passes for affected packages.

## Notes

This task is part of the clean rebuild backlog created on 2026-07-07. Follow the one-role-per-session Dark Factory workflow and write lane-specific evidence in this task's artifact folder.
