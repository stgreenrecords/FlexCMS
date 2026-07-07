# REB-04 backend evidence — TUT contracts and page tree

## Scope

- Role: `backend-dev`
- Date: 2026-07-07 local
- Task: Generate component/template/page-tree contracts from the approved TUT inventory.
- Human clarification: design is already provided in `Design/sample-website-tut/template-libs/`; no designer-side action is required for this contract-generation session.

## Files created

- `scripts/generate_tut_contract_artifacts.py` — deterministic generator from existing approved inputs.
- `Design/tut-usa/generated/component-contracts.json` — 406 component contracts from `V16__tut_usa_component_definitions.sql`.
- `Design/tut-usa/generated/template-contracts.json` — 20 page template contracts from `V17__tut_usa_page_templates.sql` with source `code.html` / `screen.png` references.
- `Design/tut-usa/generated/page-tree.json` — 61 TUT USA pages only: L0 root plus the approved 60 seeded child pages, with URL path, content path, title, template assignment, and required/optional component types.
- `Design/tut-usa/generated/static-asset-url-inventory.json` — static source-backed inventory of direct remote asset URLs referenced by template HTML.
- `Design/tut-usa/generated/asset-download-plan.md` — Selenium/browser-first download and repo storage plan for downstream `REB-02` / `REB-07` work.

## Source inputs

- `Design/sample-website-tut/template-libs/*/code.html`
- `Design/sample-website-tut/template-libs/*/screen.png`
- `flexcms/flexcms-app/src/main/resources/db/migration/V16__tut_usa_component_definitions.sql`
- `flexcms/flexcms-app/src/main/resources/db/migration/V17__tut_usa_page_templates.sql`
- `scripts/seed_tut_usa_website.py`
- `docs/list-ofcomponents-tempaltes-and-page-trees.txt`

## Results

- Components parsed and validated: 406.
- Template definition rows parsed and validated: 20.
- Template folders with executable `code.html`: 20.
- Template folder `tut_sovereign` contains only `DESIGN.md`; it was not emitted as a page/template contract because it lacks `code.html` and is not referenced by the approved page tree.
- Pages emitted: 61.
- Template definitions used by pages: 19.
- Unused but valid template definition: `brand-story-about-tut-page`; retained in `template-contracts.json` but no page was created for it because the approved page tree does not assign any page to that template.
- Static direct remote URLs found in template HTML: 103 unique URLs across 20 template HTML files.

## Migration/import approach

- Do not rewrite or reuse Flyway versions; existing component/template definition migrations remain authoritative history.
- Use the generated JSON artifacts as import/validation contracts for downstream reseed and frontend work.
- If database schema changes are later required, add the next sequential Flyway migration under `flexcms/flexcms-app/src/main/resources/db/migration/` after checking current versions.
- For idempotent content import, consume `page-tree.json` and create/update content nodes by deterministic `contentPath`; do not create pages outside this artifact.
- Backend remains JSON-only: generated artifacts describe contracts and content structure only; no backend HTML rendering was introduced.

## Validation evidence

```bash
python3 /Users/Viachaslau_Karnaushanka/IdeaProjects/FlexCMS/scripts/generate_tut_contract_artifacts.py --check
```

Result:

```text
components=406 templates=20 pages=61 static_assets=103
```

```bash
python3 /Users/Viachaslau_Karnaushanka/IdeaProjects/FlexCMS/scripts/generate_tut_contract_artifacts.py
```

Result:

```text
components=406 templates=20 pages=61 static_assets=103
```

```bash
python3 -m py_compile /Users/Viachaslau_Karnaushanka/IdeaProjects/FlexCMS/scripts/generate_tut_contract_artifacts.py
```

Result: exit 0.

Additional JSON quality check passed:

- 406 components.
- 20 templates.
- 61 unique URL paths.
- 61 unique content paths.
- every page template reference resolves to `template-contracts.json`.

## Skipped checks

- `mvn clean compile` / `mvn test`: skipped because this session did not change Java/backend runtime code, migrations, controllers, services, repositories, or models.
- Frontend build: skipped because this session did not change frontend source.
- Docker build: skipped because no backend application code changed.


