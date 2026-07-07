# REB-05 — Add Selenium framework foundation and reporting package

## Summary

- Priority: P0
- Owner role/lane: `devops`
- Parent planning task: `REB-00`

## Goal

Add Selenium framework foundation and reporting package.

## Read first

- `df/artifacts/REB-00/task.md`
- `df/artifacts/REB-00/solution-design.md`
- `docs/FLEXCMS_BUSINESS_CONTEXT.md`
- `docs/list-ofcomponents-tempaltes-and-page-trees.txt`

## Dependencies

- REB-00

## Acceptance criteria

- AC1: Create a new Selenium E2E package in the frontend pnpm workspace without deleting existing Playwright tests.
- AC2: Provide typed browser/session setup, environment config, waits, screenshots, and report helpers.
- AC3: Add local scripts for smoke, headed/debug, and CI runs.
- AC4: Emit JUnit-compatible reports and screenshot artifacts on failure.
- AC5: Document how to run the Selenium suite locally.

## Notes

This task is part of the clean rebuild backlog created on 2026-07-07. Follow the one-role-per-session Dark Factory workflow and write lane-specific evidence in this task's artifact folder.
