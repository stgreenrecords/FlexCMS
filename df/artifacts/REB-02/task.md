# REB-02 — Build Selenium browser asset-capture pipeline for remote template resources

## Summary

- Priority: P0
- Owner role/lane: `devops`
- Parent planning task: `REB-00`

## Goal

Build Selenium browser asset-capture pipeline for remote template resources.

## Read first

- `df/artifacts/REB-00/task.md`
- `df/artifacts/REB-00/solution-design.md`
- `docs/FLEXCMS_BUSINESS_CONTEXT.md`
- `docs/list-ofcomponents-tempaltes-and-page-trees.txt`

## Dependencies

- REB-01

## Acceptance criteria

- AC1: Add a Selenium-based capture runner that opens every design `code.html` in a real browser.
- AC2: Capture image, font, CSS, and media URLs after network idle, font readiness, and scroll-triggered lazy loading.
- AC3: Download permitted static resources into `design/tut-usa/assets/` and write per-page `assets-manifest.json` files.
- AC4: Generate `normalized.html` files with local asset references and capture evidence screenshots.
- AC5: Record unavailable or disallowed resources as manifest blockers instead of silently ignoring them.

## Notes

This task is part of the clean rebuild backlog created on 2026-07-07. Follow the one-role-per-session Dark Factory workflow and write lane-specific evidence in this task's artifact folder.
