# REB-13 — Implement Selenium admin authoring and round-trip suites

## Summary

- Priority: P1
- Owner role/lane: `devops`
- Parent planning task: `REB-00`

## Goal

Implement Selenium admin authoring and round-trip suites.

## Read first

- `df/artifacts/REB-00/task.md`
- `df/artifacts/REB-00/solution-design.md`
- `docs/FLEXCMS_BUSINESS_CONTEXT.md`
- `docs/list-ofcomponents-tempaltes-and-page-trees.txt`

## Dependencies

- REB-06
- REB-11

## Acceptance criteria

- AC1: Implement Selenium specs for authoring/editing representative new components and templates.
- AC2: Verify edit persists through author API, headless response, and rendered frontend output where applicable.
- AC3: Cover asset selection/import references for at least one media-heavy template.
- AC4: Record screenshots, JUnit report, and exact environment details.
- AC5: Tests do not rely on Playwright-only helpers.

## Notes

This task is part of the clean rebuild backlog created on 2026-07-07. Follow the one-role-per-session Dark Factory workflow and write lane-specific evidence in this task's artifact folder.
