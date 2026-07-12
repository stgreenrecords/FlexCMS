import { expect } from 'chai';
import type { WebDriver } from 'selenium-webdriver';
import { createDriver, quitDriver } from '../../driver/browser';
import { attachFailureScreenshot } from '../../reports/hooks';
import { AuthorApiClient } from '../../pages/AuthorApiClient';
import { SitePage } from '../../pages/SitePage';
import { loadEnv } from '../../driver/env';

type AnchorSnapshot = {
  href: string | null;
  text: string;
  target: string | null;
  rel: string | null;
  fragmentExists: boolean;
};

type LinkFailure = {
  source: string;
  text: string;
  href: string;
  reason: string;
};

async function collectAnchors(driver: WebDriver): Promise<AnchorSnapshot[]> {
  return driver.executeScript<AnchorSnapshot[]>(`
    return Array.from(document.querySelectorAll('a')).map((anchor) => {
      const rawHref = anchor.getAttribute('href');
      const fragment = rawHref && rawHref.startsWith('#') ? rawHref.slice(1) : '';
      return {
        href: rawHref,
        text: (anchor.textContent || anchor.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim(),
        target: anchor.getAttribute('target'),
        rel: anchor.getAttribute('rel'),
        fragmentExists: fragment ? Boolean(document.getElementById(fragment)) : true,
      };
    });
  `);
}

function isExternal(url: URL, siteUrl: URL): boolean {
  return url.origin !== siteUrl.origin;
}

function isSpecialHref(href: string): boolean {
  return /^(mailto:|tel:)/i.test(href);
}

async function validateInternalRoutes(siteUrl: URL, routes: Map<string, { source: string; text: string; href: string }>): Promise<LinkFailure[]> {
  const entries = Array.from(routes.entries());
  const failures: LinkFailure[] = [];
  const concurrency = 8;
  for (let start = 0; start < entries.length; start += concurrency) {
    const batch = entries.slice(start, start + concurrency);
    const results = await Promise.all(batch.map(async ([route, source]) => {
      try {
        const response = await fetch(new URL(route, siteUrl).toString(), { redirect: 'follow' });
        return response.ok ? null : { ...source, reason: `HTTP ${response.status}` };
      } catch (error) {
        return { ...source, reason: error instanceof Error ? error.message : String(error) };
      }
    }));
    failures.push(...results.filter((failure): failure is LinkFailure => failure !== null));
  }
  return failures;
}

describe('REB-12 template-by-template public site coverage - TUT link integrity', function () {
  this.timeout(300_000);

  let driver: WebDriver | undefined;
  let sitePage: SitePage;
  let authorApi: AuthorApiClient;
  const env = loadEnv();

  before(async () => {
    driver = await createDriver();
    if (!driver) throw new Error('driver was not initialized');
    sitePage = new SitePage(driver);
    authorApi = new AuthorApiClient();
  });

  after(async () => {
    await quitDriver(driver);
  });

  attachFailureScreenshot(() => driver);

  it('renders authored anchors and resolves every unique internal destination', async () => {
    const pages = await authorApi.discoverAllTutUsaPagePaths();
    expect(pages.length, 'no seeded pages discovered').to.be.greaterThan(0);

    const siteUrl = new URL(env.siteUrl);
    const routes = new Map<string, { source: string; text: string; href: string }>();
    const failures: LinkFailure[] = [];

    for (const contentPath of pages) {
      const source = AuthorApiClient.toSitePath(contentPath);
      await sitePage.open(source);
      await sitePage.assertNotErrorPage();

      const anchors = await collectAnchors(driver!);
      const consoleErrors = await sitePage.consoleErrorCount();
      if (consoleErrors > 0) {
        failures.push({ source, text: '', href: '', reason: `${consoleErrors} browser console error(s)` });
      }

      for (const anchor of anchors) {
        const href = anchor.href?.trim() ?? '';
        if (!href || href === '#' || /^javascript:/i.test(href)) {
          failures.push({ source, text: anchor.text, href, reason: 'empty, hash-only, or javascript href' });
          continue;
        }
        if (!anchor.text) {
          failures.push({ source, text: '', href, reason: 'anchor has no accessible name' });
        }
        if (href.startsWith('#')) {
          if (!anchor.fragmentExists) failures.push({ source, text: anchor.text, href, reason: 'fragment target is missing' });
          continue;
        }
        if (isSpecialHref(href)) continue;

        let url: URL;
        try {
          url = new URL(href, new URL(`${env.siteUrl}${source}`));
        } catch {
          failures.push({ source, text: anchor.text, href, reason: 'invalid URI' });
          continue;
        }

        if (isExternal(url, siteUrl)) {
          if (!['http:', 'https:'].includes(url.protocol)) {
            failures.push({ source, text: anchor.text, href, reason: `unsafe external protocol ${url.protocol}` });
          }
          if (anchor.target === '_blank' && !/\bnoopener\b/i.test(anchor.rel ?? '') || anchor.target === '_blank' && !/\bnoreferrer\b/i.test(anchor.rel ?? '')) {
            failures.push({ source, text: anchor.text, href, reason: 'new-tab external link lacks noopener noreferrer' });
          }
          continue;
        }

        const route = `${url.pathname}${url.search}`;
        if (!routes.has(route)) routes.set(route, { source, text: anchor.text, href });
      }
    }

    failures.push(...await validateInternalRoutes(siteUrl, routes));
    expect(failures, failures.slice(0, 20).map((failure) => `${failure.source} | ${failure.text} | ${failure.href} | ${failure.reason}`).join('\n')).to.have.length(0);
  });
});

