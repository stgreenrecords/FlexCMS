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

  const driver: WebDriver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

  if (env.implicitWaitMs > 0) {
    await driver.manage().setTimeouts({ implicit: env.implicitWaitMs });
  }

  return driver;
}

export async function quitDriver(driver: WebDriver | undefined): Promise<void> {
  if (!driver) return;
  try {
    await driver.quit();
  } catch {
    // Best-effort cleanup; ignore errors from an already-closed session.
  }
}


