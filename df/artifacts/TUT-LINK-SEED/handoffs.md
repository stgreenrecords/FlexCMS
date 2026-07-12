# Handoffs - TUT-LINK-SEED

## 2026-07-12 10:22 CEST - data-engineer to frontend-dev

- Task id: `TUT-LINK-SEED`
- Current state: `DONE`
- Previous role result: PASS. The seeded page/link graph is explicit, recursively validated before API access, V18-conformant for global/featured links, idempotent, fully published, and has zero unresolved internal destinations.
- Files changed: `scripts/seed_tut_usa_website.py`, `scripts/tests/test_seed_tut_usa_website.py`, and `df/artifacts/TUT-LINK-SEED/data/` evidence.
- Generated/live metrics: 65 pages including root, 515 page components, 423 links (`412` internal / `11` external), 582 deterministic owned nodes, zero missing/duplicate/unpublished owned paths, zero malformed persisted V18 links.
- Checks performed: focused Python `9/9` PASS; all script tests `17/17` PASS; Python compile and scoped diff checks PASS; fresh-stack auto-seed + explicit second reseed PASS; live data-quality PASS; Maven clean compile/test PASS; frontend build `9/9` PASS; Selenium smoke PASS after complete-stack restart; Selenium full PASS.
- Evidence: `df/artifacts/TUT-LINK-SEED/data/summary.md`, `validation-scenarios.md`, `source-map.md`, `live-data-quality.json`, `live-reseed-after-stack-run-2.txt`, and Selenium retained `{smoke,full}` reports.
- Known risks: in-place deterministic updates remain necessary because subtree deletion is broken locally; duplicate and owned-path validation mitigate stale/duplicate path risk. Synthetic demo/legal copy is not production policy. Existing non-failing frontend warnings remain outside this task.
- Next role instructions: `frontend-dev` may start `TUT-LINK-RENDERING` only after its other dependency `BUG-TUT-VEHICLE-RENDERER` is also `DONE`. Consume authored navigation/account/footer/featured/card CTAs, honor `openInNewTab`, omit invalid links instead of emitting placeholders, and add the full-site Selenium internal destination/fragment integrity scenario defined in `df/artifacts/TUT-LINK-INTEGRITY/solution-design.md`.

