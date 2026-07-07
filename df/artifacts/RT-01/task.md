# RT-01 - Asset integrity — resolve the 152 missing images so the demo site has zero broken images

## Summary

- Priority: P0
- Current state: RETURNED_TO_DEV
- Owner role: data-engineer
- Legacy station: blocked

## Dependencies
- none

## Modules / scope
- `scripts`
- `flexcms-dam`

## Read first
- `docs/RETEST_PLAN.md`
- `Design/tut-usa/manifest.json`
- `scripts/import_tut_usa_captured_assets.py`
- `scripts/seed_tut_usa_website.py`

## Acceptance criteria
- Every asset referenced by `Design/tut-usa/manifest.json` is available in deployed public paths (or intentionally excluded with evidence)
- python3 scripts/live_smoke.py --page content/tut-usa/home --no-edit reports 0 broken images
- Repeat the image check for at least 5 representative pages (home, a vehicle detail, innovation, news, contact) — all images HTTP 200
- `df/artifacts/REB-07/data/dam-import-map.json` shows deterministic coverage for imported assets and any intentional exclusions
- Evidence (image-URL/status lists + screenshots) saved under docs/retest-runs/RT-01/

## Evidence requirements

- Record exact commands, environment, and results.
- Attach logs/screenshots/traces under this artifact folder when relevant.
- QA must independently verify; PO must accept before DONE.
