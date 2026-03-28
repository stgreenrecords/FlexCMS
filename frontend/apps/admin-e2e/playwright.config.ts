import { defineConfig, devices } from '@playwright/test';

/**
 * FlexCMS Admin UI — Playwright E2E configuration
 *
 * Run modes:
 *   pnpm test              → all browsers, mocked APIs
 *   pnpm test:chromium     → Chromium only
 *   pnpm test:headed       → Chromium with visible browser
 *   USE_LIVE_API=true pnpm test  → real APIs (requires Docker Compose stack)
 */
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
  ],

  /* Start admin dev server automatically in local dev */
  webServer: process.env.CI
    ? undefined
    : {
        command: 'cd ../admin && pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120_000,
      },
});

