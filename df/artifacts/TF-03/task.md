# TF-03 - L4 demo-site functional + render coverage — all 61 pages, SDK & TUT cases

## Summary

- Priority: P1
- Current state: OPEN
- Owner role: frontend-dev
- Legacy station: backlog

## Dependencies
- TF-02
- RT-01

## Modules / scope
- `apps/admin-e2e`
- `apps/site-nextjs`

## Read first
- `docs/TEST_FRAMEWORK.md`
- `docs/QA_TEST_PLAN.md`
- `scripts/live_smoke.py`

## Acceptance criteria
- Automated tests render all 61 seeded pages and assert expected components present (TUT-016→030, SDK-010→019)
- Image integrity assertion on every page — 0 broken images (reuse live_smoke logic)
- Navigation/footer (XF) render on pages; product components show PIM data
- No console/hydration errors on sampled pages
- 0 failures; evidence + screenshots under docs/retest-runs/TF-03/

## Evidence requirements

- Record exact commands, environment, and results.
- Attach logs/screenshots/traces under this artifact folder when relevant.
- QA must independently verify; PO must accept before DONE.
