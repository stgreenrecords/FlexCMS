/**
 * ECMS-03 — published pages render their DAM images.
 *
 * Covers `ECMS-03-TC05` and the frontend half of `ECMS-03-TC02/TC03` in
 * `docs/MANUAL_TEST_CASES_ECMS_UPCOMING.md`: a page that references a DAM image is
 * published, and the image actually decodes in a browser. This is checked on:
 *
 * - the **publish-backed site** (`PUBLISH_SITE_URL`, a reference-site instance whose
 *   live pages read from `:8081`), which is what a visitor gets;
 * - the default local site, whose live route reads from author, as the proxy control;
 * - the draft **preview** route, which must show an asset that is *not* published.
 *
 * Why the unpublish step matters: author and publish share one object-store bucket,
 * so "the image loads on the publish-backed site" could in principle be author bytes
 * leaking through. Withdrawing the asset and watching that same page's image break
 * proves the publish tier is the one serving it. Re-publishing proves it recovers.
 *
 * Start the publish-backed instance before running (see
 * `df/artifacts/ECMS-03B/frontend/test-scenarios.md`):
 *
 *   cd frontend/apps/site-nextjs
 *   NEXT_DIST_DIR=.next-publish FLEXCMS_API_URL=http://localhost:8081 \
 *     FLEXCMS_PREVIEW_API_URL=http://localhost:8080 pnpm exec next dev -p 3005
 */
import { expect } from 'chai';
import type { WebDriver } from 'selenium-webdriver';
import { createDriver, quitDriver } from '../../driver/browser';
import { loadEnv } from '../../driver/env';
import { waitForPageReady } from '../../driver/waits';
import { attachFailureScreenshot } from '../../reports/hooks';
import { AuthorApiClient, type DamAsset } from '../../pages/AuthorApiClient';
import { DamPage } from '../../pages/DamPage';
import { testPngBytes } from '../../fixtures/dam-assets';

const SITE_ID = 'tut-usa';
const SITE_ROOT_LTREE = `content.${SITE_ID}`;
/**
 * Reused across runs: the page is deleted and recreated each run, and deletion now
 * replicates, so no publish-side orphan accumulates.
 */
const FIXTURE_PAGE = 'ecms03b-asset-render';
const PAGE_LTREE = `${SITE_ROOT_LTREE}.${FIXTURE_PAGE}`;
const SITE_PATH = `/${SITE_ID}/${FIXTURE_PAGE}`;

interface ImageState {
  found: boolean;
  src: string;
  complete: boolean;
  naturalWidth: number;
}

describe('ECMS-03 published asset rendering suite', function () {
  this.timeout(600_000);

  const env = loadEnv();
  const api = new AuthorApiClient();
  const runId = `ecms03b-${Date.now()}`;
  const assetPath = `content/dam/${SITE_ID}/${runId}/render.png`;

  let driver: WebDriver | undefined;
  let asset: DamAsset;

  attachFailureScreenshot(() => driver);

  /** Loads a site URL and reports the state of the image whose src carries the asset id. */
  async function imageOn(url: string, assetId: string): Promise<ImageState> {
    const d = driver as WebDriver;
    await d.get(url);
    await waitForPageReady(d);
    // The renderer uses loading="lazy": bring the image into view so it is fetched.
    await d.executeScript(
      `const img = Array.from(document.images).find((i) => (i.getAttribute('src') || '').indexOf(arguments[0]) !== -1);
       if (img) img.scrollIntoView({ block: 'center' });`,
      assetId,
    );
    let state: ImageState = { found: false, src: '', complete: false, naturalWidth: 0 };
    await d
      .wait(async () => {
        state = await d.executeScript<ImageState>(
          `const img = Array.from(document.images).find((i) => (i.getAttribute('src') || '').indexOf(arguments[0]) !== -1);
           return img
             ? { found: true, src: img.getAttribute('src') || '', complete: img.complete, naturalWidth: img.naturalWidth }
             : { found: false, src: '', complete: false, naturalWidth: 0 };`,
          assetId,
        );
        return state.found && state.complete;
      }, env.explicitWaitMs)
      .catch(() => undefined);
    return state;
  }

  /**
   * Replace the browser with a fresh profile. Asset responses carry
   * `Cache-Control: public, max-age=86400` by design (DEC-ECMS-002), so a browser that
   * already loaded an image keeps showing it after it is withdrawn; "what a visitor sees
   * after withdrawal" is therefore a new visitor, not a reload.
   */
  async function freshVisitor(): Promise<void> {
    await quitDriver(driver);
    driver = await createDriver();
  }

  async function waitForPublishAssetStatus(assetId: string, status: number, timeoutMs = 30_000): Promise<number> {
    const deadline = Date.now() + timeoutMs;
    let last = -1;
    while (Date.now() < deadline) {
      last = await fetch(`${env.publishUrl}/dam/renditions/${assetId}`).then((r) => r.status).catch(() => -1);
      if (last === status) return last;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return last;
  }

  async function publishAsset(assetId: string, action: 'publish' | 'unpublish'): Promise<number> {
    const base = env.authorApiUrl.replace(/\/+$/, '');
    const res = await fetch(`${base}/author/assets/${assetId}/${action}?userId=admin`, { method: 'POST' });
    return res.status;
  }

  before(async () => {
    const siteUp = await fetch(env.publishSiteUrl).then((r) => r.status).catch(() => -1);
    expect(
      siteUp,
      `the publish-backed reference site must be running at ${env.publishSiteUrl} (PUBLISH_SITE_URL); ` +
        'see the header of this spec for the start command',
    ).to.be.within(200, 499);

    asset = await api.uploadAsset({
      bytes: testPngBytes(),
      filename: 'render.png',
      contentType: 'image/png',
      path: assetPath,
      siteId: SITE_ID,
    });

    await api.deleteNode(PAGE_LTREE).catch(() => undefined);
    await api.createNode({
      parentPath: SITE_ROOT_LTREE,
      name: FIXTURE_PAGE,
      resourceType: 'flexcms/page',
      properties: { 'jcr:title': 'ECMS-03B asset render', siteId: SITE_ID },
    });
    await api.waitForNode(PAGE_LTREE);
    // Authored with the legacy author-only URL on purpose: that is what existing content
    // holds, and every layer must turn it into something a visitor can load.
    await api.createNode({
      parentPath: PAGE_LTREE,
      name: 'hero-image',
      resourceType: 'flexcms/image',
      properties: { src: api.assetContentUrl(asset.id), alt: `ECMS-03B ${runId}` },
    });
    await api.waitForNode(`${PAGE_LTREE}.hero-image`);

    driver = await createDriver();
  });

  after(async () => {
    try {
      await api.deleteNode(PAGE_LTREE);
    } catch {
      // Best-effort cleanup; must not mask a test result.
    }
    try {
      await api.deleteAsset(assetPath);
    } catch {
      // Best-effort cleanup.
    }
    await quitDriver(driver);
  });

  it('S1 keeps an unpublished asset off the publish tier but shows it in draft preview', async () => {
    expect(await waitForPublishAssetStatus(asset.id, 404), 'publish must not serve an unpublished asset').to.equal(404);

    const preview = await imageOn(`${env.siteUrl}/preview${SITE_PATH}`, asset.id);
    expect(preview.found, 'the draft preview must render the image component').to.equal(true);
    expect(preview.src, 'preview routes assets through the author proxy').to.equal(`/draft-dam/renditions/${asset.id}`);
    expect(preview.naturalWidth, 'the unpublished image must decode in draft preview').to.be.greaterThan(0);
  });

  it('S2 publishing the page publishes its image, which renders on the publish-backed site (TC05)', async () => {
    await api.bulkPublish([PAGE_LTREE]);
    await api.waitForNodeStatus(PAGE_LTREE, 'PUBLISHED');
    expect(await waitForPublishAssetStatus(asset.id, 200), 'the referenced asset must reach publish').to.equal(200);
    expect(await api.waitForPublishMarker(SITE_PATH, `/dam/renditions/${asset.id}`), 'publish JSON must carry the canonical URL')
      .to.equal(true);

    const published = await api.getPublishRenderedPage(SITE_PATH);
    expect(JSON.stringify(published), 'publish JSON must never point at the author API').to.not.include('/api/author/');

    const live = await imageOn(`${env.publishSiteUrl}${SITE_PATH}`, asset.id);
    expect(live.found, 'the publish-backed site must render the image component').to.equal(true);
    expect(live.src, 'the rendered src is the relative canonical URL').to.equal(`/dam/renditions/${asset.id}`);
    expect(live.naturalWidth, 'the published image must decode for a visitor').to.be.greaterThan(0);
  });

  it('S3 the default site proxies the same canonical URL (control)', async () => {
    const control = await imageOn(`${env.siteUrl}${SITE_PATH}`, asset.id);
    expect(control.src).to.equal(`/dam/renditions/${asset.id}`);
    expect(control.naturalWidth, 'the site proxy must serve /dam/renditions').to.be.greaterThan(0);
  });

  it('S4 withdrawing the asset breaks it on the publish-backed site only, and re-publishing restores it', async () => {
    expect(await publishAsset(asset.id, 'unpublish')).to.equal(200);
    expect(await waitForPublishAssetStatus(asset.id, 404)).to.equal(404);

    await freshVisitor();
    const withdrawn = await imageOn(`${env.publishSiteUrl}${SITE_PATH}`, asset.id);
    expect(withdrawn.found, 'the page itself is still published').to.equal(true);
    expect(withdrawn.naturalWidth, 'publish, not author, serves the live image: it must break once withdrawn')
      .to.equal(0);

    const stillInPreview = await imageOn(`${env.siteUrl}/preview${SITE_PATH}`, asset.id);
    expect(stillInPreview.naturalWidth, 'draft preview is unaffected by publish state').to.be.greaterThan(0);

    expect(await publishAsset(asset.id, 'publish')).to.equal(200);
    expect(await waitForPublishAssetStatus(asset.id, 200)).to.equal(200);
    const restored = await imageOn(`${env.publishSiteUrl}${SITE_PATH}`, asset.id);
    expect(restored.naturalWidth, 'the image must render again after re-publishing').to.be.greaterThan(0);
  });

  it('S5 the admin DAM Copy URL action offers the canonical public URL', async () => {
    const dam = new DamPage(driver as WebDriver);
    await dam.open();
    await dam.setSearch('render.png');
    expect(await dam.waitForAssetPresence('render.png', true), 'the fixture asset never appeared').to.equal(true);

    await dam.openAssetMenu(asset.id);
    await dam.clickMenuItem('dam-asset-copy-url');
    const notice = await dam.waitForActionNotice(/copied|clipboard/i);

    // Whether or not the headless browser grants clipboard access, the notice names the URL.
    expect(notice ?? '', 'Copy URL must offer the canonical URL').to.include(`/dam/renditions/${asset.id}`);
    expect(notice ?? '', 'Copy URL must not offer the author-only route').to.not.include('/api/author/');
  });

  it('S6 deleting the asset on author removes it from the publish-backed site', async () => {
    expect(await api.deleteAsset(assetPath)).to.equal(200);
    expect(await waitForPublishAssetStatus(asset.id, 404)).to.equal(404);

    await freshVisitor();
    const gone = await imageOn(`${env.publishSiteUrl}${SITE_PATH}`, asset.id);
    expect(gone.found, 'the page itself still renders its image component').to.equal(true);
    expect(gone.naturalWidth, 'a deleted asset must not render for visitors').to.equal(0);
  });
});
