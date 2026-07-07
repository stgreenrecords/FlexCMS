# REB-07 rollback notes

If REB-07 imported assets need to be rolled back:

1. Remove copied public assets:
   - `rm -rf frontend/apps/site-nextjs/public/tut-usa/assets`
   - `rm -rf frontend/apps/admin/public/tut-usa/assets`
2. If DAM upload was used, delete imported DAM folder from author API:
   - DELETE `/api/author/assets?path=content/dam/tut-usa` (or remove child paths from `dam-import-map.json`).
3. Re-run deterministic reseed workflow (REB-03 evidence):
   - `python3 scripts/seed_tut_usa_website.py`
   - `python3 scripts/import_tut_usa_assets.py` (legacy placeholder mapper, if required by current seed data).
4. Re-publish impacted TUT-USA nodes after reseed.

Note: preserve backup/snapshot procedures for non-local environments per reset guards in REB-03.
