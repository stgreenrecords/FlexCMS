# REB-03 Data Lane — Reset Plan

## Session

- Role: `data-engineer`
- Date: 2026-07-07 local
- Scope: Safe reset and idempotent reseed plan for deterministic TUT/TUT-USA demo seed data

## Deliverables

- `scripts/reset_tut_usa_seed.py` — guarded reset planner/executor for deterministic TUT/TUT-USA scope
- `scripts/tests/test_reset_tut_usa_seed.py` — unit coverage for path conversion, environment gating, preserved/reset targets, and dry-run fallback behavior
- `df/artifacts/REB-03/data/reset-scope.json` — machine-readable dry-run plan output

## Deterministic reset scope

### Current TUT-USA mutable authored content to remove

Reset only mutable seeded content under these deterministic parents:

- `content.tut-usa.*` descendants whose `parent_path = 'content.tut-usa'`
- descendants directly under `content.experience-fragments.tut-usa.global.navigation.master`
- descendants directly under `content.experience-fragments.tut-usa.global.footer.master`

Execution path:

- use Author bulk content delete API for top-level URL paths derived from the database paths
- do **not** rewrite Flyway history
- do **not** delete the TUT-USA root site node itself

### Current TUT-USA DAM/demo assets to remove

Delete only deterministic TUT-USA demo assets/folders matching:

- `assets.site_id = 'tut-usa'`
- `assets.path LIKE '%dam/tut-usa%'`
- `dam_folders.site_id = 'tut-usa'` or `dam_folders.path LIKE '%dam/tut-usa%'`

Execution path:

- delete asset binaries/DB rows through the Author asset API first
- then clean deterministic empty folder rows in SQL

### Legacy TUT demo content/metadata to remove

Legacy cleanup targets remain deterministic and limited to known prefixes/ids:

- old site roots `content.tut-gb`, `content.tut-de`, `content.tut-fr`, `content.tut-ca`
- old XF roots `content.experience-fragments.tut-gb|de|fr|ca`
- `experience_fragment_metadata.site_id IN ('tut-gb','tut-de','tut-fr','tut-ca')`
- `domain_mappings.site_id IN (...)`
- `sites.site_id IN (...)`
- `component_definitions.resource_type LIKE 'tut/%'`

### Optional legacy PIM cleanup

The reset tool supports optional removal of the legacy sample PIM seed **only** when explicitly requested with `--include-legacy-pim`:

- schema: `Luxury Vehicle v2026` version `1.0`
- catalog: `TUT 2026 Model Lineup`
- products:
  - `TUT-SOVEREIGN-2026`
  - `TUT-VANGUARD-2026`
  - `TUT-ECLIPSE-2026`
  - `TUT-APEX-2026`

## Explicitly preserved scope

These are intentionally preserved to keep the reset safe and reversible:

- `component_definitions.resource_type LIKE 'tut-usa/%'`
  - reason: migration-owned by `V16__tut_usa_component_definitions.sql`
- `template_definitions` for `tut-usa`
  - reason: migration-owned by `V17__tut_usa_page_templates.sql`
- current legacy sample PIM data by default
  - reason: no dedicated TUT-USA replacement seed exists yet in this lane

## Safety gates

The reset tool requires all of the following:

1. explicit `--confirm-reset-tut-usa`
2. explicit environment classification (`local` or `qa`)
3. refusal of unknown/production-like targets
4. non-local override for QA-like execution via `--allow-non-local-reset` or `FLEXCMS_ALLOW_NON_LOCAL_RESET=true`

## Reseed path

Planned deterministic reseed sequence after reset:

1. `python3 scripts/seed_tut_usa_website.py`
2. `python3 scripts/import_tut_usa_captured_assets.py`

The reset tool is designed so repeated reset + reseed runs remain deterministic and avoid duplicate mutable content/assets.

## Row counts / before-after evidence

- Dry-run machine report generated at `df/artifacts/REB-03/data/reset-scope.json`
- Current shell lacked `psycopg2`, so DB row counts were not collected in this session
- The tool is prepared to collect before/after counts automatically once `psycopg2` is available in the executing environment

## Rollback notes

- Never rewrite or remove Flyway migration history
- If reset is applied accidentally, recover via DB snapshot/backup before reseeding
- Preserving migration-owned TUT-USA definitions/templates minimizes rollback blast radius

