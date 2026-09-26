import { defineConfig, devices } from '@playwright/test';

/**
 * FlexCMS — Playwright test suite (all browser and API test levels).
 * Full guide: docs/process/TESTING.md
 *
 * Projects (one per test level):
 *   chromium / firefox / webkit  tests/ui, tests/a11y, tests/visual  — Admin UI, API MOCKED
 *   ui-live                      tests/ui                            — same UI specs, real API
 *   api                          tests/api                           — REST/GraphQL, real API
 *   e2e                          tests/e2e                           — full-stack journeys, real stack
 *
 * Scripts (package.json):
 *   pnpm test                → chromium (mocked) — the default gate, no backend needed
 *   pnpm test:browsers       → chromium + firefox + webkit (mocked)
 *   pnpm test:api            → api       (needs the live stack)
 *   pnpm test:e2e            → e2e       (needs the live stack)
 *   pnpm test:live           → api + e2e + ui-live (needs the live stack)
 *   pnpm test -- --grep @ECMS-01   → every test of one task
 *
 * Environment:
 *   USE_LIVE_API=true        Turns every API mock off. Set by the live scripts; required
 *                            for ui-live, api and e2e.
 *   ADMIN_URL / AUTHOR_URL / PUBLISH_URL / SITE_URL / PUBLISH_SITE_URL
 *                            Service URLs (defaults: src/env.ts).
 *   LIVE_AUTOSTART_BACKEND   'false' to skip auto-starting Author via `flex` in live mode.
 */
const useLiveApi = process.env['USE_LIVE_API'] === 'true';
const autoStartBackend = process.env['LIVE_AUTOSTART_BACKEND'] !== 'false';

const adminWebServer = {
  command: 'cd ../admin && pnpm start',
  url: process.env['ADMIN_URL'] ?? 'http://localhost:3000',
  reuseExistingServer: !process.env['CI'],
  timeout: 120_000,
};

// Starts infra + Author via the repo's `flex` CLI. Repo root is three levels up.
const authorWebServer = {
  command: 'cd ../../../ && ./flex start local author',
  url: process.env['AUTHOR_HEALTH_URL'] ?? 'http://localhost:8080/actuator/health',
  reuseExistingServer: true,
  timeout: 240_000,
};

// Regexes anchored on the `tests/<level>/` folder. (Plain globs like 'e2e/**' would also
// match this package's own directory name, frontend/apps/e2e.)
const level = (name: string) => new RegExp(`[\\/]tests[\\/]${name}[\\/].*\.(spec|setup)\.ts$`);
const MOCKED_UI = [level('ui'), level('a11y'), level('visual')];

// Evidence for live runs: always keep trace + video so a failure can be diagnosed.
const liveEvidence = { trace: 'on', video: 'on', screenshot: 'on' } as const;

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Every browser test hits one `next start` process. Playwright's default (half the CPU
  // cores) overloads it on large machines and turns into goto/axe timeouts, so cap it.
  // Override with --workers=N.
  workers: process.env.CI ? 3 : 2,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  use: {
    baseURL: process.env.ADMIN_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', testMatch: MOCKED_UI, use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', testMatch: MOCKED_UI, use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', testMatch: MOCKED_UI, use: { ...devices['Desktop Safari'] } },
    // Live projects first run tests/setup/live-stack.setup.ts, which fails fast when
    // USE_LIVE_API is off or Author/Publish are unreachable.
    { name: 'live-setup', testMatch: level('setup') },
    {
      name: 'ui-live',
      testMatch: level('ui'),
      dependencies: ['live-setup'],
      use: { ...devices['Desktop Chrome'], ...liveEvidence },
    },
    { name: 'api', testMatch: level('api'), dependencies: ['live-setup'] },
    {
      name: 'e2e',
      testMatch: level('e2e'),
      dependencies: ['live-setup'],
      timeout: 90_000,
      use: { ...devices['Desktop Chrome'], ...liveEvidence },
    },
  ],

  /* The admin UI is served from its production build (`next start`), so run
   * `cd frontend && pnpm build` first. In live mode the Author stack is started
   * too (unless LIVE_AUTOSTART_BACKEND=false); publish and the reference sites
   * must already be running (`flex start local all`). */
  webServer: useLiveApi && autoStartBackend ? [authorWebServer, adminWebServer] : adminWebServer,
});
