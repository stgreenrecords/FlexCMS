# REB-15 — QA verification for full rebuild program

## Summary

- Priority: P0
- Owner role/lane: `qa`
- Parent planning task: `REB-00`

## Goal

QA verification for full rebuild program.

## Read first

- `df/artifacts/REB-00/task.md`
- `df/artifacts/REB-00/solution-design.md`
- `docs/FLEXCMS_BUSINESS_CONTEXT.md`
- `docs/list-ofcomponents-tempaltes-and-page-trees.txt`

## Dependencies

- REB-14

## Acceptance criteria

- AC1: Independently run the required backend/frontend/Selenium validation gates.
- AC2: Verify seed reset/reseed evidence and absence of missing/broken images in seeded pages.
- AC3: Verify test traceability matrix covers all 21 templates and prioritized component groups.
- AC4: Record defects with reproduction steps or pass report with exact commands/environment.
- AC5: Move accepted work to PO review only when objective evidence passes.

## Notes

This task is part of the clean rebuild backlog created on 2026-07-07. Follow the one-role-per-session Dark Factory workflow and write lane-specific evidence in this task's artifact folder.
