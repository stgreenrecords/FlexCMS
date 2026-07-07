/**
 * FlexCMS Selenium E2E — reusable explicit wait helpers.
 */
import { By, until, type WebDriver, type WebElement } from 'selenium-webdriver';
import { loadEnv } from './env';

const env = loadEnv();

export async function waitForVisible(driver: WebDriver, locator: By, timeoutMs = env.explicitWaitMs): Promise<WebElement> {
  const element = await driver.wait(until.elementLocated(locator), timeoutMs);
  await driver.wait(until.elementIsVisible(element), timeoutMs);
  return element;
}

export async function waitForClickable(driver: WebDriver, locator: By, timeoutMs = env.explicitWaitMs): Promise<WebElement> {
  const element = await waitForVisible(driver, locator, timeoutMs);
  await driver.wait(until.elementIsEnabled(element), timeoutMs);
  return element;
}

export async function waitForUrlContains(driver: WebDriver, fragment: string, timeoutMs = env.explicitWaitMs): Promise<void> {
  await driver.wait(until.urlContains(fragment), timeoutMs);
}

/** Waits for `document.readyState === 'complete'` (network-idle-ish page load signal). */
export async function waitForPageReady(driver: WebDriver, timeoutMs = env.explicitWaitMs): Promise<void> {
  await driver.wait(async () => {
    const state = await driver.executeScript<string>('return document.readyState');
    return state === 'complete';
  }, timeoutMs);
}

export async function waitForFontsReady(driver: WebDriver, timeoutMs = env.explicitWaitMs): Promise<void> {
  await driver.wait(async () => {
    const ready = await driver.executeScript<boolean>(
      "return (document.fonts ? document.fonts.status === 'loaded' : true)",
    );
    return ready === true;
  }, timeoutMs);
}

export async function waitForNetworkIdle(
  driver: WebDriver,
  options: { timeoutMs?: number; idleMs?: number } = {},
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? env.explicitWaitMs;
  const idleMs = options.idleMs ?? 1_000;
  let lastResourceCount = -1;
  let stableSince = 0;

  await driver.wait(async () => {
    const snapshot = await driver.executeScript<{ ready: boolean; resourceCount: number }>(
      "return { ready: document.readyState === 'complete', resourceCount: performance.getEntriesByType('resource').length };",
    );
    const now = Date.now();

    if (!snapshot.ready) {
      lastResourceCount = snapshot.resourceCount;
      stableSince = 0;
      return false;
    }

    if (snapshot.resourceCount !== lastResourceCount) {
      lastResourceCount = snapshot.resourceCount;
      stableSince = now;
      return false;
    }

    if (stableSince === 0) {
      stableSince = now;
      return false;
    }

    return now - stableSince >= idleMs;
  }, timeoutMs, `Timed out after ${timeoutMs}ms waiting for network idle`);
}

export async function scrollThroughPage(driver: WebDriver, pauseMs = 200): Promise<void> {
  const dimensions = await driver.executeScript<{ viewportHeight: number; documentHeight: number }>(
    'return { viewportHeight: window.innerHeight, documentHeight: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) };',
  );
  const step = Math.max(Math.floor(dimensions.viewportHeight * 0.8), 240);

  for (let offset = 0; offset < dimensions.documentHeight; offset += step) {
    await driver.executeScript('window.scrollTo(0, arguments[0]);', offset);
    await sleep(pauseMs);
  }

  await driver.executeScript('window.scrollTo(0, 0);');
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

