/**
 * FlexCMS Selenium E2E — environment/config helpers.
 *
 * This is the single source of truth for base URLs, timeouts, and run mode
 * flags so page objects and specs never read `process.env` directly.
 */

export interface SeleniumEnv {
  adminUrl: string;
  siteUrl: string;
  authorApiUrl: string;
  authorHealthUrl: string;
  headless: boolean;
  slowMoMs: number;
  isCi: boolean;
  implicitWaitMs: number;
  explicitWaitMs: number;
  reportsDir: string;
  screenshotsDir: string;
}

function toBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() !== 'false' && value !== '0';
}

function toInt(value: string | undefined, fallback: number): number {
  const parsed = value ? parseInt(value, 10) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function loadEnv(): SeleniumEnv {
  const isCi = toBool(process.env['CI'], false);
  return {
    adminUrl: process.env['ADMIN_URL'] ?? 'http://localhost:3000',
    siteUrl: process.env['SITE_URL'] ?? 'http://localhost:3001',
    authorApiUrl: process.env['AUTHOR_API_URL'] ?? 'http://localhost:8080/api',
    authorHealthUrl: process.env['AUTHOR_HEALTH_URL'] ?? 'http://localhost:8080/actuator/health',
    headless: toBool(process.env['HEADLESS'], isCi ? true : true),
    slowMoMs: toInt(process.env['SLOWMO'], 0),
    isCi,
    implicitWaitMs: toInt(process.env['IMPLICIT_WAIT_MS'], 0),
    explicitWaitMs: toInt(process.env['EXPLICIT_WAIT_MS'], 15000),
    reportsDir: process.env['REPORTS_DIR'] ?? 'reports',
    screenshotsDir: process.env['SCREENSHOTS_DIR'] ?? 'reports/screenshots',
  };
}

