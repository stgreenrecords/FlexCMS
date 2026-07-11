# SITE-PAGE-REFERENCE-RENDERING

## Request

Prevent nested `flexcms/page` records from rendering inline on a public page and preserve explicit fallback handling for unresolved TUT DAM assets.

## Acceptance criteria

- Public parent pages do not render `flexcms/page` nodes or their descendants inline.
- Ordinary component/container child rendering remains recursive.
- Missing `/dam/tut-usa/missing/...` values are normalized to the deliberate public fallback image.
- Valid public and author asset URLs remain valid.
- The broad Next.js missing-DAM rewrite is removed.
- Unit tests, public-site Selenium template coverage, and the full frontend build pass.

