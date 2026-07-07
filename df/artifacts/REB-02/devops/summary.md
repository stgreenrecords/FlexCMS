# REB-02 DevOps summary

## Session

- Role: `devops`
- Date: 2026-07-07 local
- Task: `REB-02`
- State on handoff: `READY_FOR_QA`

## Scope completed

Implemented a browser-first Selenium asset-capture pipeline in `frontend/apps/selenium-e2e` that:

- serves immutable TUT source HTML from `Design/sample-website-tut/` over a local HTTP server;
- opens every available template/component `code.html` in Chrome via Selenium;
- waits for page readiness, font readiness, network-idle stability, and full-page scroll traversal;
- captures discovered remote resources from DOM + `performance` entries;
- downloads permitted static assets (`image`, `font`, `stylesheet`, `media`) into `Design/tut-usa/assets/`;
- rewrites normalized HTML/CSS to local relative asset references;
- emits per-page `assets-manifest.json`, `normalized.html`, `capture-evidence.png`, and `source-ref.md`;
- records disallowed/unavailable resources as blockers/provenance evidence instead of silently ignoring them.

## Files changed

- `frontend/apps/selenium-e2e/src/capture/runTutAssetCapture.ts`
- `frontend/apps/selenium-e2e/src/driver/waits.ts`
- `frontend/apps/selenium-e2e/package.json`
- `frontend/apps/selenium-e2e/README.md`
- `Design/tut-usa/README.md`

## Generated outputs

- Global manifest: `Design/tut-usa/manifest.json`
- Template outputs: `Design/tut-usa/templates/{slug}/...`
- Component outputs: `Design/tut-usa/components/{slug}/...`
- Captured assets: `Design/tut-usa/assets/{images,fonts,media,styles}/...`

## Validation evidence

### Commands run

1. `cd frontend/apps/selenium-e2e && pnpm build`
   - Result: PASS
2. `cd frontend/apps/selenium-e2e && pnpm capture:tut-assets`
   - First run: FAIL (`ENAMETOOLONG` on generated asset filename from long Google-hosted URL)
   - Fix applied: capped generated slug length in `buildLocalAssetPath()`
   - Second run: PASS
3. `cd frontend/apps/selenium-e2e && pnpm test:smoke`
   - Result: PASS (`1 passing`)

### Capture totals

From `Design/tut-usa/manifest.json`:

- Pages captured: 33
- Downloaded assets: 469
- Disallowed references: 36
- Missing resources: 1
- Total blockers recorded: 37
- Skipped source folders without `code.html`: 2 (`templates/tut_sovereign`, `components/tut_sovereign`)

### Captured asset counts

- `Design/tut-usa/assets/images/`: 145 files
- `Design/tut-usa/assets/fonts/`: 23 files
- `Design/tut-usa/assets/media/`: 0 files
- `Design/tut-usa/assets/styles/`: 15 files

## Known blockers / risks retained

- Tailwind CDN runtime script remains intentionally disallowed/provenance-only in manifests.
- One Google Fonts stylesheet URL in `component_library_events_booking` returned HTTP 400 and is recorded as a manifest blocker.
- Some source HTML still references disallowed remote scripts in normalized output; this is intentional for provenance tracking and must be addressed by later frontend/design normalization work if fully offline runtime parity is required.
- Captured fonts/images may still require human licensing/provenance review before redistribution/import.

## Acceptance-criteria mapping

- AC1: PASS — Selenium-based capture runner opens every available design `code.html` in a real browser.
- AC2: PASS — capture waits for page-ready, fonts-ready, network idle, and full-page scroll traversal before resource collection.
- AC3: PASS — permitted static resources are downloaded into `Design/tut-usa/assets/` and per-page `assets-manifest.json` files are generated.
- AC4: PASS — `normalized.html` files and capture screenshots were generated for templates and component groups.
- AC5: PASS — unavailable/disallowed resources are explicitly recorded in manifests as blockers/provenance evidence.

