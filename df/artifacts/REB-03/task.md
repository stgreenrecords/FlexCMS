# REB-03 — Reset existing TUT/demo seed data safely and create idempotent reseed plan

## Summary

- Priority: P0
- Owner role/lane: `data-engineer`
- Parent planning task: `REB-00`

## Goal

Reset existing TUT/demo seed data safely and create idempotent reseed plan.

## Read first

- `df/artifacts/REB-00/task.md`
- `df/artifacts/REB-00/solution-design.md`
- `docs/FLEXCMS_BUSINESS_CONTEXT.md`
- `docs/list-ofcomponents-tempaltes-and-page-trees.txt`

## Dependencies

- REB-01

## Acceptance criteria

- AC1: Create a reset plan that targets only deterministic TUT/demo paths, resource types, templates, component definitions, assets, and related seed records.
- AC2: Reset tooling requires an explicit confirmation flag and refuses unknown/production environments by default.
- AC3: Reseed process is idempotent and produces no duplicate content, assets, templates, or component definitions across repeated runs.
- AC4: Existing Flyway migration history is not rewritten.
- AC5: Record before/after row counts and rollback notes.

## Notes

This task is part of the clean rebuild backlog created on 2026-07-07. Follow the one-role-per-session Dark Factory workflow and write lane-specific evidence in this task's artifact folder.
