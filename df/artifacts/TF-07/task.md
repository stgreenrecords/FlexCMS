# TF-07 - L5 visual regression — screens x viewport (desktop/tablet/mobile) x theme, vs Design/UI refs

## Summary

- Priority: P2
- Current state: OPEN
- Owner role: frontend-dev
- Legacy station: backlog

## Dependencies
- TF-02

## Modules / scope
- `apps/admin-e2e`

## Read first
- `docs/TEST_FRAMEWORK.md`
- `Design/UI/stitch_flexcms_admin_ui_requirements_summary`

## Acceptance criteria
- Baseline snapshots for every admin screen at desktop/tablet/mobile, in light + dark theme
- Snapshots compared on re-run (stable, animations disabled); diffs surfaced in the report
- Design-reference cross-check: each screen visually compared against its Design/UI/<page>/screen.png; deviations filed as BUG-xx
- No broken images / overflow / missing sections on any captured screen
- Baselines + diffs saved under docs/retest-runs/TF-07/

## Evidence requirements

- Record exact commands, environment, and results.
- Attach logs/screenshots/traces under this artifact folder when relevant.
- QA must independently verify; PO must accept before DONE.
