# REB-03 Handoffs

## 2026-07-07 local — data-engineer -> qa

- Task: `REB-03`
- State: `READY_FOR_QA`
- Previous role result: implemented guarded reset-planning tooling and generated machine-readable dry-run scope for deterministic TUT/TUT-USA reset/reseed work
- Files changed:
  - `scripts/reset_tut_usa_seed.py`
  - `scripts/tests/test_reset_tut_usa_seed.py`
- Artifacts created:
  - `df/artifacts/REB-03/data/reset-plan.md`
  - `df/artifacts/REB-03/data/reseed-evidence.md`
  - `df/artifacts/REB-03/data/reset-scope.json`
- Checks performed:
  - `python3 -m unittest scripts.tests.test_reset_tut_usa_seed -v` -> PASS (6 tests)
  - `python3 scripts/reset_tut_usa_seed.py --confirm-reset-tut-usa --environment local --report-json .../reset-scope.json` -> PASS in dry-run mode
- Known risk:
  - this shell does not currently provide `psycopg2`, so the generated dry-run report could not collect live before/after row counts in this session
- Next role instructions:
  - review the deterministic reset selectors and preservation scope against `REB-03` acceptance criteria
  - confirm whether missing live row counts should be accepted as a documented environment limitation or whether QA wants a follow-up run in an environment with `psycopg2`
  - do not request PO acceptance automatically; manual human QA/PO override remains active per `DEC-REB-005`

