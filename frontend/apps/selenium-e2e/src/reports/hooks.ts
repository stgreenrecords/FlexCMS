/**
 * FlexCMS Selenium E2E — Mocha reporting hooks.
 *
 * Suites register `attachFailureScreenshot` so any failing test automatically
 * writes a PNG under `env.screenshotsDir` before the driver is torn down. The
 * screenshot path is echoed to stdout so it is discoverable from CI logs and
 * from the JUnit report's captured output.
 */
import type { WebDriver } from 'selenium-webdriver';
import { captureScreenshot } from '../driver/screenshots';

type DriverProvider = () => WebDriver | undefined;

/**
 * Registers an `afterEach` hook that captures a screenshot for every failed
 * test in the enclosing suite.
 *
 * Must be called from inside a `describe` block, after the `before` hook that
 * creates the driver — the provider is invoked lazily so a driver created in
 * `before` is still visible to this hook.
 */
export function attachFailureScreenshot(getDriver: DriverProvider): void {
  afterEach(async function () {
    if (this.currentTest?.state !== 'failed') return;

    const driver = getDriver();
    if (!driver) return;

    const testName = this.currentTest.fullTitle();
    try {
      const filePath = await captureScreenshot(driver, `failed-${testName}`);
      console.log(`[selenium-e2e] failure screenshot: ${filePath}`);
    } catch (error) {
      // Never let evidence capture mask the original assertion failure.
      console.warn(`[selenium-e2e] could not capture failure screenshot for "${testName}": ${String(error)}`);
    }
  });
}
