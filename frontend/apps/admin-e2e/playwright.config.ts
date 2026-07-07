import { defineConfig, devices } from '@playwright/test';

/**
 * FlexCMS Admin UI — Playwright E2E configuration
 *
 * Run modes:
 *   pnpm test              → all browsers, mocked APIs
 *   pnpm test:chromium     → Chromium only
 *   pnpm test:headed       → Chromium with visible browser
 *   USE_LIVE_API=true pnpm exec playwright test --project=live
 *                          → real APIs (requires the real Author backend)
 *
 * Live mode env vars:
 *   USE_LIVE_API             'true' to disable ALL mocks (shared fixtures +
 *                             per-spec inline routes) and hit the real API.
 *   ADMIN_URL                 Admin UI base URL (default http://localhost:3000)
 *   AUTHOR_API_URL             Author API base URL (default http://localhost:8080/api)
 *   AUTHOR_HEALTH_URL          Author readiness URL (default http://localhost:8080/actuator/health)
 *   LIVE_AUTOSTART_BACKEND     'false' to skip auto-starting Author via `flex`
 *                              (use when you deliberately want the backend
 *                              down to prove the live project fails).
 */
const useLiveApi = process.env['USE_LIVE_API'] === 'true';
const autoStartBackend = process.env['LIVE_AUTOSTART_BACKEND'] !== 'false';

const adminWebServer = {
  command: 'cd ../admin && pnpm start',
  url: process.env['ADMIN_URL'] ?? 'http://localhost:3000',
  reuseExistingServer: !process.env['CI'],
  timeout: 120_000,
};

// Starts the full local dev stack (infra + Author) via the repo's `flex` CLI.
// Repo root is three levels up from frontend/apps/admin-e2e.
const authorWebServer = {
  command: 'cd ../../../ && ./flex start local author',
  url: process.env['AUTHOR_HEALTH_URL'] ?? 'http://localhost:8080/actuator/health',
  reuseExistingServer: true,
  timeout: 240_000,
};

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 3 : undefined,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    baseURL: process.env.ADMIN_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Live project: mocks OFF (USE_LIVE_API=true), runs against the real
    // Admin UI + real Author backend. Trace/video always captured for evidence.
    {
      name: 'live',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env['ADMIN_URL'] ?? 'http://localhost:3000',
        trace: 'on',
        video: 'on',
      },
    },
  ],

  /* Start admin server automatically.
   * Uses the production build (next start) for deterministic static file serving.
   * Pre-requisite: `cd frontend && pnpm build` must have been run first.
   * In CI the server is started by the workflow before `playwright test` runs.
   * In live mode (USE_LIVE_API=true) the Author backend stack-up is also
   * started first (unless LIVE_AUTOSTART_BACKEND=false), so the `live`
   * project exercises the real API end to end. */
  webServer: useLiveApi && autoStartBackend ? [authorWebServer, adminWebServer] : adminWebServer,
});

