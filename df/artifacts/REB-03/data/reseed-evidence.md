# REB-03 Data Lane — Reseed Evidence

## Validation performed

### Unit tests

Command:

```bash
cd /Users/Viachaslau_Karnaushanka/IdeaProjects/FlexCMS
python3 -m unittest scripts.tests.test_reset_tut_usa_seed -v
```

Result:

- PASS
- 6 tests passed
- Covered:
  - content path to URL-path conversion
  - local environment detection
  - QA tunnel detection
  - QA override enforcement
  - plan generation for legacy PIM selectors
  - dry-run fallback when `psycopg2` is unavailable

### Dry-run plan generation

Command:

```bash
cd /Users/Viachaslau_Karnaushanka/IdeaProjects/FlexCMS
python3 scripts/reset_tut_usa_seed.py --confirm-reset-tut-usa --environment local --report-json /Users/Viachaslau_Karnaushanka/IdeaProjects/FlexCMS/df/artifacts/REB-03/data/reset-scope.json
```

Result:

- PASS
- generated `df/artifacts/REB-03/data/reset-scope.json`
- mode: `dry-run`
- environment classified as `local`
- no destructive action executed

## Notable constraint in this session

The shell environment used for validation does not currently have `psycopg2` installed.

Observed message during the first dry-run attempt:

```text
ERROR: Missing runtime dependency/dependencies: psycopg2
```

Resolution applied:

- updated `scripts/reset_tut_usa_seed.py` so dry-run report generation remains available without DB drivers
- kept actual reset execution strict: apply mode still requires DB + HTTP dependencies
- added regression coverage for the dry-run fallback path

## AC mapping

- AC1: addressed by deterministic selectors for mutable TUT-USA content/assets plus legacy demo site prefixes and definitions
- AC2: addressed by mandatory confirmation flag, explicit environment classification, and non-local override requirement
- AC3: addressed by planning reset around deterministic delete scope and reusing existing re-runnable seed/import scripts
- AC4: addressed by explicitly preserving Flyway migration history and migration-owned TUT-USA definitions/templates
- AC5: partially addressed in tooling design; automated before/after count capture is implemented but blocked in this session by missing `psycopg2`

## Remaining operator prerequisite

Before running live reset execution (`--apply`), ensure the execution environment includes:

- `psycopg2`
- `requests`
- reachable Author API / DB endpoints matching approved environment rules

