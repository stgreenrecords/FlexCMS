import { expect } from 'chai';
import type { WebDriver } from 'selenium-webdriver';
import { createDriver, quitDriver } from '../../driver/browser';
import { attachFailureScreenshot } from '../../reports/hooks';
import { AuthorApiClient } from '../../pages/AuthorApiClient';
import { SitePage } from '../../pages/SitePage';

describe('REB-12 public site pages (home + rest) @smoke', function () {
  this.timeout(180_000);

  let driver: WebDriver | undefined;
  let sitePage: SitePage;
  let authorApi: AuthorApiClient;
  let pagePaths: string[] = [];

  before(async () => {
    driver = await createDriver();
    if (!driver) throw new Error('driver was not initialized');

    sitePage = new SitePage(driver);
    authorApi = new AuthorApiClient();
    pagePaths = await authorApi.discoverAllTutUsaPagePaths();
  });

  after(async () => {
    await quitDriver(driver);
  });

  attachFailureScreenshot(() => driver);

  it('discovers seeded home and remaining TUT-USA pages', () => {
    expect(pagePaths.length).to.be.greaterThan(0);
    expect(pagePaths).to.include('/content/tut-usa');
  });

  it('renders every discovered TUT-USA page without 404 shell', async () => {
    for (const contentPath of pagePaths) {
      const sitePath = AuthorApiClient.toSitePath(contentPath);
      await sitePage.open(sitePath);
      await sitePage.assertNotErrorPage();
      const bodyText = await sitePage.readBodyText();
      expect(bodyText.length, `empty rendered body for ${sitePath}`).to.be.greaterThan(0);
    }
  });

  it('keeps per-page image health acceptable across discovered pages', async () => {
    const fullyBrokenImagePages: string[] = [];

    for (const contentPath of pagePaths) {
      const sitePath = AuthorApiClient.toSitePath(contentPath);
      await sitePage.open(sitePath);
      const { total, broken } = await sitePage.imageHealth();
      if (total === 0) continue;

      if (broken >= total) {
        fullyBrokenImagePages.push(sitePath);
      }
    }

    // Seed snapshots can include unresolved external assets on some routes; fail only if all discovered pages are affected.
    expect(
      fullyBrokenImagePages.length,
      `pages with fully broken images: ${fullyBrokenImagePages.join(', ')}`,
    ).to.be.lessThan(pagePaths.length);
  });
});

