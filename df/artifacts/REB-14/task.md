# REB-14 — Wire Selenium gates into CI/local validation and retain artifacts

## Summary

- Priority: P2
- Owner role/lane: `devops`
- Parent planning task: `REB-00`

## Goal

Wire Selenium gates into CI/local validation and retain artifacts.

## Read first

- `df/artifacts/REB-00/task.md`
- `df/artifacts/REB-00/solution-design.md`
- `docs/FLEXCMS_BUSINESS_CONTEXT.md`
- `docs/list-ofcomponents-tempaltes-and-page-trees.txt`

## Dependencies

- REB-12
- REB-13

## Acceptance criteria

- AC1: Add local and CI commands for Selenium smoke and full suites.
- AC2: Publish JUnit, screenshots, and logs as artifacts.
- AC3: Document how Selenium coexists with or replaces legacy Playwright gates.
- AC4: Fail CI on critical Selenium failures and uncovered critical/high traceability rows.
- AC5: Factory validation documentation is updated.

## Notes

This task is part of the clean rebuild backlog created on 2026-07-07. Follow the one-role-per-session Dark Factory workflow and write lane-specific evidence in this task's artifact folder.
