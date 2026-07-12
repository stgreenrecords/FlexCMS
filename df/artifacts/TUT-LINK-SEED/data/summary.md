# TUT-LINK-SEED data-engineer summary

## Result

PASS. The TUT-USA seed now builds and validates a complete in-memory page/link graph before any Author API request, persists V18 link objects, creates useful search/legal destinations, removes placeholder and missing-fragment links, reseeds idempotently, and publishes every owned page/component.

## Files changed

- `scripts/seed_tut_usa_website.py`
  - Added explicit `SeedGraph`, recursive URL collection, route/scheme/fragment validation, duplicate component/page checks, and metrics.
  - Validation runs before `verify_author_reachable()` and before all mutations.
  - Converted navigation/account/footer/featured content to explicit `{label,url,openInNewTab?}` objects.
  - Replaced empty/hash CTAs with useful existing destinations.
  - Added `/tut-usa/search`, `/tut-usa/legal`, `/tut-usa/legal/privacy`, and `/tut-usa/legal/terms` pages.
  - Made global experience-fragment component writes idempotent with `ensure_node()`.
- `scripts/tests/test_seed_tut_usa_website.py` — 9 focused graph/validation tests.
- `df/artifacts/TUT-LINK-SEED/data/validate_live_seed.py` — reproducible paginated Author quality check.
- `df/artifacts/TUT-LINK-SEED/data/live-data-quality.json` — final machine-readable live result.
- `df/artifacts/TUT-LINK-SEED/data/live-reseed-*.txt` — repeated live run output.

## Final metrics

- Generated pages: `65` including the TUT-USA site root (`64` `flexcms/page` records).
- Generated page components: `515`.
- Explicit validated links: `423` (`412` internal, `11` external).
- Unresolved internal destinations: `0`.
- Deterministically owned live nodes: `582` (root + pages + page components + two global components).
- Final Author inventory associated with `site=tut-usa`: `622` nodes, including system/global scaffolding and Selenium lifecycle records.
- Missing owned paths: `0`.
- Duplicate inventory paths: `0`.
- Unpublished owned paths: `0`.
- Null required fields: `0`.
- Pages missing required title/description/template properties: `0`.
- Malformed persisted V18 global links: `0`.

## Exact validation evidence

- `python3 -m unittest scripts.tests.test_seed_tut_usa_website -v` — PASS, `9/9`.
- `python3 -m unittest discover -s scripts/tests -p 'test_*.py' -v` — PASS, `17/17`.
- `python3 -m py_compile scripts/seed_tut_usa_website.py scripts/tests/test_seed_tut_usa_website.py df/artifacts/TUT-LINK-SEED/data/validate_live_seed.py` — PASS.
- `python3 scripts/seed_tut_usa_website.py` — PASS twice before stack refresh; identical `65/515/423/0` metrics.
- `./flex start local all` — PASS; deterministic reset + first auto-seed PASS, all four required endpoints HTTP 200.
- `python3 scripts/seed_tut_usa_website.py` after fresh-stack auto-seed — PASS as second run; no duplicates.
- `python3 df/artifacts/TUT-LINK-SEED/data/validate_live_seed.py` — PASS; final persisted results in `live-data-quality.json`.
- `cd flexcms && mvn clean compile` — PASS across 16 modules.
- `cd flexcms && mvn test` — PASS, zero failures/errors.
- `cd frontend && pnpm install && pnpm build` — PASS, `9/9` workspace build tasks.
- `cd frontend && pnpm test:e2e:selenium:smoke` — initial FAIL because Admin was unreachable after a stale partial runtime; complete stack restart performed; rerun PASS with retained artifacts.
- `cd frontend && pnpm test:e2e:selenium:full` — PASS with retained artifacts.
- `git diff --check` for scoped files — PASS.
- IDE diagnostics for all edited Python files — no errors.
- Docker image build — not applicable; no backend source or packaging changed.

## Risks and observations

- The seeder intentionally updates deterministic child paths in place because local subtree deletion is documented as broken. Duplicate-path and complete-owned-path checks mitigate this limitation.
- The final inventory exceeds the owned-node total because `site=tut-usa` includes system-created experience-fragment scaffolding and test lifecycle records; all paths are unique.
- Existing frontend package-export and `<img>` warnings remain non-failing and are outside this data task.
- Renderer consumption and browser-wide anchor integrity remain owned by downstream `TUT-LINK-RENDERING`.

