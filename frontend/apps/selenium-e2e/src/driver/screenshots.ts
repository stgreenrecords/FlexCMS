/**
 * FlexCMS Selenium E2E — screenshot capture helpers.
 *
 * Screenshots are written on-demand (evidence) and automatically on test
 * failure via the Mocha root hooks in `src/reports/hooks.ts`.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { WebDriver } from 'selenium-webdriver';
import { loadEnv } from './env';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function captureScreenshot(driver: WebDriver, name: string): Promise<string> {
  const env = loadEnv();
  fs.mkdirSync(env.screenshotsDir, { recursive: true });
  const fileName = `${Date.now()}-${slugify(name)}.png`;
  const filePath = path.join(env.screenshotsDir, fileName);
  const base64 = await driver.takeScreenshot();
  fs.writeFileSync(filePath, base64, 'base64');
  return filePath;
}

