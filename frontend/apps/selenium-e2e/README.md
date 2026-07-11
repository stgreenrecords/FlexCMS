# @flexcms/selenium-e2e

Selenium-based end-to-end automation framework foundation for the FlexCMS
rebuild program (`REB-05`). This package **adds** Selenium as the rebuild
automation framework; it does **not** replace or delete the existing
Playwright suite (`frontend/apps/admin-e2e`), which stays in place until
equivalent Selenium coverage is implemented and accepted (`DEC-REB-004`).

`REB-02` extends this package with a browser-first capture runner that serves
the immutable TUT design HTML locally, opens every template/component
`code.html` in Chrome/Chromium, waits for page ready + fonts ready + network
idle, scrolls to trigger lazy resources, downloads permitted static assets, and
rewrites normalized HTML/CSS to local references while recording blockers and
provenance notes.

## What this foundation provides

- Typed browser/session lifecycle (`src/driver/browser.ts`) — Chrome via
  `selenium-webdriver`, headless by default, `HEADLESS=false` for a visible
  browser.
- Environment/config loader (`src/driver/env.ts`) — single source of truth
  for base URLs, timeouts, and run-mode flags.
- Explicit wait helpers (`src/driver/waits.ts`) — element visible/clickable,
  URL contains, page-ready (`document.readyState`), fonts-ready.
- Screenshot helper (`src/driver/screenshots.ts`) — on-demand capture, plus
  automatic capture on test failure (`src/reports/hooks.ts`).
- JUnit-compatible reporting for CI (`mocha-junit-reporter`).
- An example page object (`src/pages/AdminLoginPage.ts`) and a smoke spec
  (`src/cases/smoke/framework-foundation.spec.ts`) proving the whole chain
  works end-to-end.
- A TUT asset-capture CLI (`src/capture/runTutAssetCapture.ts`) that generates
  `Design/tut-usa/{templates,components,assets}/` outputs for `REB-02`.

Downstream rebuild tasks build on top of this foundation:

- `REB-06` generates `src/fixtures/template-manifest.ts` /
  `component-manifest.ts` / `template-seed-map.ts` and a traceability matrix from the contracts in
  `design/tut-usa/generated/`.
- `REB-12` adds public-site template/component Selenium suites under
  `src/cases/templates/` and `src/cases/components/`.
- `REB-13` adds admin authoring/round-trip suites under `src/cases/admin/`,
  extending `AdminLoginPage` and adding an `AuthorEditorPage`/`SitePage`.
- Current REB-13 implementation: `src/cases/admin/authoring-roundtrip.spec.ts`
  covers inheritance cancel, publish, and author API + GraphQL + rendered-site
  round-trip assertions for seeded TUT-USA content.
- REB-18 adds `src/cases/admin/content-tree-lifecycle.spec.ts` for content-tree
  navigation/search/selection/action-link checks plus create+publish lifecycle
  assertions (author and publish environment verification).
- `REB-14` wires this package into CI/local validation gates and retained
  artifact bundles.

## Prerequisites

- Google Chrome installed locally (the `chromedriver` devDependency manages
  the matching driver binary automatically).
- The target app running locally — Admin UI (`http://localhost:3000` by
  default) and/or the reference site, and the Author API if a spec needs it.

## Local scripts

Run from `frontend/apps/selenium-e2e/`:

```bash
# Install deps once (from frontend/ root, so the whole pnpm workspace resolves)
cd frontend && pnpm install

# Full suite, headless (default) — builds TypeScript then runs Mocha
cd frontend/apps/selenium-e2e && pnpm test

# Browser-first REB-02 asset capture (writes into Design/tut-usa/)
pnpm capture:tut-assets

# Same capture flow with a visible browser window
pnpm capture:tut-assets:headed

# Only @smoke-tagged specs
pnpm test:smoke

# REB-13 admin authoring and round-trip suite
pnpm test:admin

# REB-18 content tree + page lifecycle suite
pnpm test:reb18

# REB-12 public-site pages suite (home + remaining discovered pages)
pnpm test:pages

# REB-12 template-by-template coverage suite (TPL-01..TPL-21)
pnpm test:templates

# Headed (visible) browser — useful for local debugging
pnpm test:headed

# Headed + slow motion (250ms) — for visually stepping through a smoke spec
pnpm test:debug

# CI-style run: JUnit XML report emitted to reports/junit/selenium-results.xml
pnpm test:ci

# REB-12 template-only CI run: JUnit XML report emitted to reports/junit/reb12-template-results.xml
pnpm test:templates:ci

# REB-14 dedicated CI suites
pnpm test:smoke:ci
pnpm test:admin:ci
pnpm test:reb18:ci
pnpm test:full:ci

# REB-14 CI/local validation gates with artifact retention + traceability coverage checks
pnpm ci:gate:smoke
pnpm ci:gate:full
```

## REB-14 gate outputs (artifact retention)

- `pnpm ci:gate:smoke` and `pnpm ci:gate:full` write command logs to
  `reports/logs/{smoke|full}/`.
- The same gates retain publish-ready artifacts in
  `reports/retained/{smoke|full}/`:
  - `junit/*.xml`
  - `screenshots/**`
  - `logs/*.log`
  - `summary.json` (counts + paths + timestamp)
- `ci:gate:full` fails on:
  - any suite failure in templates/admin/content-tree/full runs
  - uncovered `critical`/`high` traceability rows configured in
    `config/traceability-priority.json`

## Selenium and Playwright coexistence

- Selenium (`frontend/apps/selenium-e2e`) is the active rebuild gate.
- Playwright (`frontend/apps/admin-e2e`) remains as a legacy safety net until the
  backlog explicitly retires it.
- CI/local can run both; a Selenium gate failure blocks delivery regardless of
  Playwright status.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `ADMIN_URL` | `http://localhost:3000` | Admin UI base URL |
| `ADMIN_URL_FALLBACKS` | `http://localhost:3100` (when `ADMIN_URL` is default) | Comma-separated fallback admin base URLs tried when editor readiness fails on `ADMIN_URL` |
| `SITE_URL` | `http://localhost:3001` | Reference site base URL |
| `PUBLISH_URL` | `http://localhost:8081` | Publish service base URL used for publish-environment assertions |
| `AUTHOR_API_URL` | `http://localhost:8080/api` | Author API base URL |
| `AUTHOR_HEALTH_URL` | `http://localhost:8080/actuator/health` | Author readiness probe |
| `HEADLESS` | `true` | Set to `false` for a visible browser |
| `SLOWMO` | `0` | Reserved for future step-delay support in custom waits |
| `IMPLICIT_WAIT_MS` | `0` | Selenium implicit wait (kept `0`; prefer explicit waits) |
| `EXPLICIT_WAIT_MS` | `15000` | Default timeout for `src/driver/waits.ts` helpers |
| `REPORTS_DIR` | `reports` | JUnit/report output root |
| `SCREENSHOTS_DIR` | `reports/screenshots` | Screenshot capture output (on-demand + on-failure) |
| `CAPTURE_PORT` | `4173` | Local HTTP port used by the REB-02 static capture server |

## REB-02 outputs

Running `pnpm capture:tut-assets` produces or updates:

- `Design/tut-usa/manifest.json` — global summary of captured pages and blockers
- `Design/tut-usa/templates/{slug}/assets-manifest.json`
- `Design/tut-usa/templates/{slug}/normalized.html`
- `Design/tut-usa/templates/{slug}/capture-evidence.png`
- `Design/tut-usa/components/{slug}/assets-manifest.json`
- `Design/tut-usa/components/{slug}/normalized.html`
- `Design/tut-usa/components/{slug}/capture-evidence.png`
- `Design/tut-usa/assets/{images,fonts,media,styles}/...`

The runner downloads only permitted static assets (`image`, `font`,
`stylesheet`, `media`). Remote scripts and unavailable resources stay in the
manifests as blockers/provenance evidence instead of being silently discarded.

## Conventions

- TypeScript, compiled to `dist/` before Mocha runs against the compiled
  `.spec.js` files (`.mocharc.json` `spec` glob).
- Page objects live in `src/pages/`; specs live in `src/cases/{templates,
  components,admin,smoke}/`.
- Prefer stable `data-testid` selectors (added by frontend tasks where
  needed) over CSS/text selectors that can shift with visual changes.
- Tag critical specs `@smoke` in the `describe`/`it` title so `test:smoke`
  can select them.
- Screenshots on failure are automatic; call `captureScreenshot(driver, name)`
  directly for additional on-demand evidence.
- For REB-12 evidence, store command outputs plus `reports/junit/reb12-template-results.xml`
  from `pnpm test:templates:ci`; include failed-spec screenshot files from
  `reports/screenshots/` and reference the affected template case ids.
- REB-12 template suite also writes `reports/reb12-template-status.json`
  (`pass`/`pending`/`fail` with reason per `TPL-*`) for deterministic blocker
  reporting.

