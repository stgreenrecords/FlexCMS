# REB-07 — Import captured assets into DAM/public frontend asset pipeline

## Summary

- Priority: P1
- Owner role/lane: `data-engineer`
- Parent planning task: `REB-00`

## Goal

Import captured assets into DAM/public frontend asset pipeline.

## Read first

- `df/artifacts/REB-00/task.md`
- `df/artifacts/REB-00/solution-design.md`
- `docs/FLEXCMS_BUSINESS_CONTEXT.md`
- `docs/list-ofcomponents-tempaltes-and-page-trees.txt`

## Dependencies

- REB-02
- REB-03

## Acceptance criteria

- AC1: Import or copy captured assets from the canonical manifest into DAM and frontend public asset locations as appropriate.
- AC2: Write `dam-import-map.json` mapping local captured assets to DAM content URLs or public app URLs.
- AC3: Verify no seeded content references remote placeholders or missing assets.
- AC4: Record checksum/size evidence for imported assets.
- AC5: Provide rollback instructions for imported demo assets.

## Notes

This task is part of the clean rebuild backlog created on 2026-07-07. Follow the one-role-per-session Dark Factory workflow and write lane-specific evidence in this task's artifact folder.
