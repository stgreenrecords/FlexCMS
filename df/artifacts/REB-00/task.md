# REB-00 — Rebuild backlog reset and delivery architecture

## Raw request

The current backlog should be replaced. The new program must erase/reset current seed data, reimplement the frontend from the provided templates/component inventory/assets/fonts, add a Selenium-based test automation framework, derive automation test cases from the templates, then implement frontend and automation against those cases.

## Role-session scope

- Role: `sa`
- Session date: 2026-07-07 local
- This session does **not** implement product code.
- This session creates the new backlog, process architecture, acceptance criteria, risks, and handoff.

## Evidence inspected

- `df/00-start-here.md`
- `df/01-operating-model.md`
- `df/02-state-machine.md`
- `df/03-orchestration-rules.md`
- `df/04-documentation-standards.md`
- `df/roles/sa.md`
- `df/runtime/board.md`
- `docs/FLEXCMS_BUSINESS_CONTEXT.md`
- `docs/list-ofcomponents-tempaltes-and-page-trees.txt`
- `Design/sample-website-tut/template-libs/`
- `Design/sample-website-tut/component-libs/`
- `scripts/seed_tut_usa_website.py`
- `scripts/seed_test_data.py`
- `scripts/seed_qa.py`
- `frontend/apps/admin-e2e/package.json`
- `frontend/apps/admin/package.json`
- `frontend/apps/site-nextjs/package.json`
- `frontend/packages/ui/package.json`

## Repository facts

- Source inventory contains 406 self-contained CMS components and 21 TUT template folders with `code.html` / `screen.png` pairs.
- Page tree starts at `TUT USA Website Root` and defines publishable TUT USA pages with page template assignment.
- Current E2E package is Playwright-only (`frontend/apps/admin-e2e`); Selenium is not present yet.
- Existing seed work includes Flyway migrations `V14__tut_sample_site_seed.sql`, `V15__tut_usa_foundation.sql`, `V16__tut_usa_component_definitions.sql`, `V17__tut_usa_page_templates.sql`, plus Python seed/import scripts.
- Backend remains headless JSON-only; frontend renders all HTML.

## Assumptions

- “Erase current seed data” means reset FlexCMS demo/TUT seed content, component/template demo rows, and demo assets in local/QA/test environments only; production data deletion requires an explicit human-approved destructive operation.
- The existing `Design/sample-website-tut/` folder is treated as immutable input evidence.
- The canonical processed design output should be stored under root `design/` per Dark Factory standards, while runtime/public assets used by apps may be copied into each app’s `public/` folder or DAM through a manifest-driven import.
- Selenium should be added as a new automation lane; existing Playwright tests should not be removed until equivalent Selenium coverage exists and QA accepts the replacement.

## Acceptance criteria for this SA session

- AC1: Existing runtime board is archived before replacement.
- AC2: `df/runtime/board.md` is replaced with a clean rebuild backlog split by lane.
- AC3: Backlog contains explicit tasks for design processing, remote asset capture, seed reset/reseed, frontend rebuild, Selenium framework, Selenium test case automation, QA, and PO acceptance.
- AC4: Solution design defines folder/storage conventions for raw template evidence, normalized assets, frontend public assets, DAM import manifests, and test artifacts.
- AC5: Solution design defines a safe, opt-in seed reset strategy and avoids destructive production behavior.
- AC6: Solution design defines the Selenium-first automation strategy and traceability from template/component inventory to test cases.
- AC7: Runtime activity log, decisions, risks, and handoff are updated.

## Dependencies

- none

## Result

Completed by this SA session. Next role should start with `designer` on `REB-01`.
