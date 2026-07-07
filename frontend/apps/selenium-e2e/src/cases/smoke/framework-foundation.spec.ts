/**
 * FlexCMS Selenium E2E — smoke suite.
 *
 * This is the framework-foundation smoke test proving the Selenium package
 * itself works end-to-end (driver boot, navigation, wait helpers, JUnit
 * report, and failure screenshot capture). Template/component-specific
 * suites are added by `REB-12`/`REB-13` on top of this foundation.
 *
 * @smoke
 */
import { expect } from 'chai';
import type { WebDriver } from 'selenium-webdriver';
import { createDriver, quitDriver } from '../../driver/browser';
import { loadEnv } from '../../driver/env';
import { waitForPageReady } from '../../driver/waits';
import { attachFailureScreenshot } from '../../reports/hooks';

describe('Selenium framework foundation @smoke', function () {
  this.timeout(60_000);

  let driver: WebDriver | undefined;

  before(async () => {
    driver = await createDriver();
  });

  after(async () => {
    await quitDriver(driver);
  });

  attachFailureScreenshot(() => driver);

  it('boots a Chrome session and loads the admin base URL', async () => {
    const env = loadEnv();
    if (!driver) throw new Error('driver was not initialized');

    await driver.get(env.adminUrl);
    await waitForPageReady(driver);

    const title = await driver.getTitle();
    expect(title).to.be.a('string');
  });
});


