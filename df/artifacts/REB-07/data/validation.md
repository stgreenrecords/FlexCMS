# REB-07 Data Lane Validation

## Commands

1. Unit tests for importer script

```bash
cd /Users/Viachaslau_Karnaushanka/IdeaProjects/FlexCMS
python3 -m unittest scripts.tests.test_import_tut_usa_captured_assets -v
```

Result: PASS (`2` tests)

2. Execute manifest-driven import/copy workflow

```bash
cd /Users/Viachaslau_Karnaushanka/IdeaProjects/FlexCMS
python3 scripts/import_tut_usa_captured_assets.py
```

Result: PASS

- unique assets discovered: `182`
- copied to `frontend/apps/site-nextjs/public/tut-usa/assets`: `182`
- copied to `frontend/apps/admin/public/tut-usa/assets`: `182`
- DAM upload: `0` (not enabled in this session)

3. Check for unresolved placeholder references in imported/public artifacts

```bash
cd /Users/Viachaslau_Karnaushanka/IdeaProjects/FlexCMS
grep -R --line-number "/dam/tut-usa/missing/" frontend/apps/site-nextjs/public/tut-usa frontend/apps/admin/public/tut-usa Design/tut-usa/manifest.json Design/tut-usa/templates Design/tut-usa/components
```

Result: PASS (no matches)

4. Check remaining capture-level missing resources (risk visibility)

```bash
cd /Users/Viachaslau_Karnaushanka/IdeaProjects/FlexCMS
grep -R --line-number '"status": "missing"' Design/tut-usa/templates Design/tut-usa/components | head -n 20
```

Result: PARTIAL (2 matches, both in `Design/tut-usa/components/component_library_events_booking/assets-manifest.json`)

5. Check copied public assets for remote URL references

```bash
cd /Users/Viachaslau_Karnaushanka/IdeaProjects/FlexCMS
grep -R --line-number "https://" frontend/apps/site-nextjs/public/tut-usa frontend/apps/admin/public/tut-usa | head -n 20
```

Result: PASS (no matches)

## Acceptance criteria mapping

- AC1: PASS — captured assets from canonical manifest copied into frontend public locations (`site-nextjs` + `admin`); optional DAM upload path implemented and available via `--upload-dam`.
- AC2: PASS — `df/artifacts/REB-07/data/dam-import-map.json` generated with local path, checksums/sizes, public URLs, and DAM status fields.
- AC3: PARTIAL — no `/dam/tut-usa/missing/` placeholders in imported/public artifacts; capture manifests still contain two `missing` records for one component-group stylesheet source.
- AC4: PASS — checksum/size evidence recorded in `df/artifacts/REB-07/data/checksum-evidence.md` and full per-asset metadata in `dam-import-map.json`.
- AC5: PASS — rollback instructions documented in `df/artifacts/REB-07/data/rollback-notes.md`.

## Residual risk

- Capture source still reports one unresolved external stylesheet fetch in `component_library_events_booking`; appears as two `missing` entries due manifest structure (`resources` + `blockers`).
- DAM import execution itself was not run in this session because `--upload-dam` was not enabled; mapping currently marks DAM status as `not-uploaded`.

