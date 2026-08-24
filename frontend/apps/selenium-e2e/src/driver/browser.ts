/**
 * FlexCMS Selenium E2E — browser/session setup.
 *
 * Provides a single typed factory for creating and tearing down a Chrome
 * WebDriver session, honoring HEADLESS/SLOWMO/CI env flags from `env.ts`.
 */
import { Builder, type WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { loadEnv } from './env';

export async function createDriver(): Promise<WebDriver> {
  const env = loadEnv();
  const options = new chrome.Options();

  if (env.headless) {
    options.addArguments('--headless=new');
  }
  options.addArguments(
    '--window-size=1440,900',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
  );

  const driver: WebDriver = await buildWithRetry(options);

  if (env.implicitWaitMs > 0) {
    await driver.manage().setTimeouts({ implicit: env.implicitWaitMs });
  }

  return driver;
}

/**
 * Start a Chrome session, retrying a failed *launch*.
 *
 * The full gate runs suites back to back through `spawnSync`, so a suite can ask for
 * its first browser a few seconds after the previous suite tore down twenty-odd of
 * them. Chrome occasionally loses that race and dies during startup, and ChromeDriver
 * reports it as `session not created: Chrome instance exited` from the `before all`
 * hook — which fails the whole suite before a single assertion runs. It never
 * reproduces when a suite is run by hand, because typing the next command supplies the
 * gap that the gate does not.
 *
 * Only session creation is retried. A retry here cannot hide a product defect or a
 * failing assertion: at this point no page has been loaded and no expectation
 * evaluated. Anything other than a launch failure is rethrown immediately.
 */
async function buildWithRetry(options: chrome.Options): Promise<WebDriver> {
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const isLaunchRace = message.includes('session not created')
        || message.includes('Chrome instance exited')
        || message.includes('chrome not reachable');
      if (!isLaunchRace || attempt === maxAttempts) {
        throw error;
      }
      // Give the previous suite's processes time to release the machine. Linear
      // backoff: the contention is short-lived, so seconds are enough.
      await new Promise((resolve) => setTimeout(resolve, attempt * 3000));
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function quitDriver(driver: WebDriver | undefined): Promise<void> {
  if (!driver) return;
  try {
    await driver.quit();
  } catch {
    // Best-effort cleanup; ignore errors from an already-closed session.
  }
}


