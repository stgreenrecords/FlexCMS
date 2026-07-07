# REB-06 — Produce Selenium traceability matrix and generated test-case skeletons

## Summary

- Priority: P1
- Owner role/lane: `devops`
- Parent planning task: `REB-00`

## Goal

Produce Selenium traceability matrix and generated test-case skeletons.

## Read first

- `df/artifacts/REB-00/task.md`
- `df/artifacts/REB-00/solution-design.md`
- `docs/FLEXCMS_BUSINESS_CONTEXT.md`
- `docs/list-ofcomponents-tempaltes-and-page-trees.txt`

## Dependencies

- REB-02
- REB-04
- REB-05

## Acceptance criteria

- AC1: Generate a traceability matrix mapping templates/components to Selenium cases and acceptance criteria.
- AC2: Create skeleton specs for all 21 templates and high-value component groups.
- AC3: Include broken image/font checks, console error checks, primary CTA checks, responsive breakpoint checks, and basic accessibility assertions where feasible.
- AC4: Store generated matrix under `design/tut-usa/generated/qa-traceability-matrix.csv` and task evidence under `df/artifacts/REB-06/devops/`.
- AC5: No generated test is marked passing without implementation evidence.

## Notes

This task is part of the clean rebuild backlog created on 2026-07-07. Follow the one-role-per-session Dark Factory workflow and write lane-specific evidence in this task's artifact folder.
