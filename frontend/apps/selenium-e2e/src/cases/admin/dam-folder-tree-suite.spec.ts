/**
 * FlexCMS Selenium E2E — DAM folder tree.
 *
 * The asset library used to present every asset as one flat grid beside a sidebar
 * that looked like a folder tree but was not one: its four entries — Images, Videos,
 * Documents, Archives — were a hardcoded list, and an asset's "folder" was derived
 * from its MIME type. The `folderPath` an asset was actually stored under was never
 * read, so the structure an author organised their library into was invisible and
 * unnavigable.
 *
 * What these scenarios pin down:
 *
 * - **The tree reflects stored paths, not file types.** A folder appears because an
 *   asset's path put it there.
 * - **Intermediate folders are reconstructed.** Folders are derived from asset paths
 *   rather than stored as rows, so a folder holding no assets of its own exists only
 *   as a prefix of its descendants' paths. `brand` must still appear above
 *   `brand/logos`.
 * - **Selecting a folder lists its subtree.** A parent that showed nothing until you
 *   found its leaf would make the tree useless, so counts and grid contents both
 *   include descendants — and the scenarios assert those two agree.
 * - **Test-owned paths only.** Every asset goes under a run-unique prefix, and
 *   cleanup only ever targets that prefix.
 */
import { expect } from 'chai';
import type { WebDriver } from 'selenium-webdriver';
import { createDriver, quitDriver } from '../../driver/browser';
import { attachFailureScreenshot } from '../../reports/hooks';
import { AuthorApiClient } from '../../pages/AuthorApiClient';
import { DamPage } from '../../pages/DamPage';
import { testPngBytes } from '../../fixtures/dam-assets';

const SITE_ID = 'tut-usa';

describe('DAM folder tree suite', function () {
  this.timeout(600_000);

  const runId = `damtree-${Date.now()}`;
  /** Run-unique root, so the tree under test is entirely this run's own. */
  const root = `content/dam/${SITE_ID}/${runId}`;
  const api = new AuthorApiClient();

  /**
   * Deliberately uneven. `brand` and `marketing` hold nothing directly, so they
   * exist only as prefixes and the tree has to reconstruct them; `logos` holds two
   * and `icons` one, so a parent's count cannot be mistaken for a child's.
   */
  const FIXTURE = [
    `${root}/brand/logos/logo-primary.png`,
    `${root}/brand/logos/logo-mono.png`,
    `${root}/brand/icons/favicon.png`,
    `${root}/marketing/campaigns/spring/hero.png`,
    `${root}/loose.png`,
  ];

  const uploadedPaths = new Set<string>();
  let driver: WebDriver | undefined;
  let dam: DamPage;

  attachFailureScreenshot(() => driver);

  before(async () => {
    for (const path of FIXTURE) {
      const filename = path.split('/').pop() as string;
      const asset = await api.uploadAsset({
        bytes: testPngBytes(),
        filename,
        contentType: 'image/png',
        path,
        siteId: SITE_ID,
      });
      expect(asset, `fixture upload failed for ${path}`).to.not.equal(undefined);
      uploadedPaths.add(path);
    }

    driver = await createDriver();
    dam = new DamPage(driver);
  });

  after(async () => {
    for (const path of uploadedPaths) {
      try {
        await api.deleteAsset(path);
      } catch {
        // Cleanup is best-effort; a failure here must not mask a test result.
      }
    }
    await quitDriver(driver);
  });

  it('S1 reports every folder holding an asset, scoped to the site', async () => {
    const folders = await api.listAssetFolders(SITE_ID);
    const paths = folders.map((f) => f.path);

    expect(paths, 'folder with two assets missing').to.include(`${root}/brand/logos`);
    expect(paths, 'folder with one asset missing').to.include(`${root}/brand/icons`);
    expect(paths, 'deeply nested folder missing').to.include(`${root}/marketing/campaigns/spring`);
    expect(paths, 'root holding a loose asset missing').to.include(root);

    // Folders are derived from asset paths, so a folder with no assets of its own is
    // not reported — the tree reconstructs it. This asserts the contract rather than
    // treating the absence as an oversight.
    expect(paths, 'a folder with no direct assets should not be reported').to.not.include(
      `${root}/brand`,
    );

    const logos = folders.find((f) => f.path === `${root}/brand/logos`);
    expect(logos?.assetCount, 'direct asset count wrong').to.equal(2);
  });

  it('S2 renders a tree whose folders come from stored paths', async () => {
    await dam.open();
    expect(await dam.hasFolderTree(), 'folder tree did not render').to.equal(true);

    const visible = await dam.visibleFolderPaths();
    expect(visible, 'run folder missing from the tree').to.include(root);

    // The old sidebar's four MIME buckets must be gone: they were never folders.
    const leaves = visible.map((p) => p.split('/').pop());
    const seededByMime = ['images', 'videos', 'documents', 'archives'].filter((name) =>
      leaves.includes(name),
    );
    expect(
      seededByMime,
      'sidebar still shows MIME-type buckets rather than stored folders',
    ).to.deep.equal([]);
  });

  it('S3 reconstructs a folder that holds no assets of its own', async () => {
    await dam.open();

    const visible = await dam.visibleFolderPaths();
    expect(
      visible,
      'intermediate folder was not reconstructed from its descendants',
    ).to.include(`${root}/brand`);
    expect(visible, 'a deeper intermediate folder is missing').to.include(
      `${root}/marketing/campaigns`,
    );
  });

  it('S4 counts a folder by its whole subtree', async () => {
    await dam.open();

    // brand holds nothing directly: 2 logos + 1 icon, all from below it.
    expect(await dam.folderCount(`${root}/brand`), 'subtree count wrong for brand').to.equal('3');
    expect(await dam.folderCount(`${root}/brand/logos`), 'count wrong for logos').to.equal('2');
    // The run root adds its own loose asset to everything beneath it.
    expect(await dam.folderCount(root), 'subtree count wrong for the run root').to.equal('5');
  });

  it('S5 collapses and expands a folder without selecting it', async () => {
    await dam.open();

    expect(await dam.isFolderExpanded(`${root}/brand`), 'brand should start expanded').to.equal(true);

    await dam.toggleFolder(`${root}/brand`);
    expect(await dam.isFolderExpanded(`${root}/brand`), 'collapse had no effect').to.equal(false);
    expect(
      await dam.visibleFolderPaths(),
      'children stayed visible after collapsing the parent',
    ).to.not.include(`${root}/brand/logos`);

    await dam.toggleFolder(`${root}/brand`);
    expect(
      await dam.visibleFolderPaths(),
      'children did not come back after expanding',
    ).to.include(`${root}/brand/logos`);
  });

  it('S6 filters the grid to the selected folder and its descendants', async () => {
    await dam.open();

    await dam.selectFolder(`${root}/brand/logos`);
    expect(await dam.showsAsset('logo-primary.png'), 'selected folder hides its own asset')
      .to.equal(true);
    expect(await dam.showsAsset('favicon.png'), 'sibling folder leaked into the grid')
      .to.equal(false);

    // A parent lists everything beneath it, so it never looks empty.
    await dam.selectFolder(`${root}/brand`);
    expect(await dam.showsAsset('logo-primary.png'), 'parent did not list a descendant asset')
      .to.equal(true);
    expect(await dam.showsAsset('favicon.png'), 'parent did not list its other descendant')
      .to.equal(true);
    expect(await dam.showsAsset('hero.png'), 'an unrelated subtree leaked into the grid')
      .to.equal(false);
  });

  it('S7 walks back up through the breadcrumb', async () => {
    await dam.open();
    await dam.selectFolder(`${root}/marketing/campaigns/spring`);

    const segments = await dam.breadcrumbSegments();
    expect(segments.slice(-3), 'breadcrumb does not spell out the path').to.deep.equal([
      'marketing',
      'campaigns',
      'spring',
    ]);

    await dam.clickBreadcrumb(`${root}/marketing`);
    expect(
      await dam.showsAsset('hero.png'),
      'ancestor selected from the breadcrumb does not list its subtree',
    ).to.equal(true);

    await dam.clickBreadcrumbRoot();
    expect(
      await dam.showsAsset('favicon.png'),
      'returning to Assets did not clear the folder filter',
    ).to.equal(true);
  });

  /**
   * The delete button used to filter React state and never call the server, so the
   * asset vanished from the grid and was back on the next refresh. Both scenarios
   * below therefore assert against the **server**, not against the grid: a UI-only
   * assertion is precisely what the defect would have satisfied.
   */
  it('S8 deleting an asset through the row menu removes it from the server', async () => {
    const filename = `delete-me-${Date.now()}.png`;
    const path = `${root}/${filename}`;
    const asset = await api.uploadAsset({
      bytes: testPngBytes(),
      filename,
      contentType: 'image/png',
      path,
      siteId: SITE_ID,
    });
    uploadedPaths.add(path);

    await dam.open();
    await dam.setSearch(filename);
    expect(await dam.waitForAssetPresence(filename, true), 'the fixture asset never appeared')
      .to.equal(true);

    await dam.deleteAssetViaMenu(asset.id);

    expect(
      await dam.waitForAssetPresence(filename, false),
      'the row is still in the grid after deleting it',
    ).to.equal(true);

    // The assertion that matters: the server agrees it is gone.
    expect(
      await api.getAssetStatus(asset.id),
      'the grid dropped the row but the server still has the asset — the delete never left the browser',
    ).to.equal(404);

    // And it stays gone across a reload, which is where the old behaviour gave itself away.
    await dam.open();
    await dam.setSearch(filename);
    expect(
      await dam.waitForAssetPresence(filename, false),
      'the deleted asset came back after a refresh',
    ).to.equal(true);

    uploadedPaths.delete(path);
  });

  it('S9 a delete the server rejects leaves the row in place and says so', async () => {
    const filename = `reject-me-${Date.now()}.png`;
    const path = `${root}/${filename}`;
    const asset = await api.uploadAsset({
      bytes: testPngBytes(),
      filename,
      contentType: 'image/png',
      path,
      siteId: SITE_ID,
    });
    uploadedPaths.add(path);

    await dam.open();
    await dam.setSearch(filename);
    expect(await dam.waitForAssetPresence(filename, true), 'the fixture asset never appeared')
      .to.equal(true);

    // Remove it behind the page's back, so the next UI delete must fail. This is how a
    // stale grid behaves in practice — someone else deleted the asset first.
    expect(await api.deleteAsset(path), 'the out-of-band delete did not succeed').to.equal(200);

    await dam.deleteAssetViaMenu(asset.id);

    const message = await dam.deleteErrorText();
    expect(message, 'a failed delete reported no error to the author').to.not.equal(null);
    expect(message ?? '', 'the error does not name the asset that failed').to.contain(filename);

    // The row must survive: dropping it would repeat the original lie, just with a
    // different cause.
    expect(
      await dam.showsAsset(filename),
      'the row was removed even though the server refused the delete',
    ).to.equal(true);

    uploadedPaths.delete(path);
  });

  it('S10 offers working Download and Copy URL actions, and no dead Move item', async () => {
    const filename = `menu-actions-${Date.now()}.png`;
    const path = `${root}/${filename}`;
    const asset = await api.uploadAsset({
      bytes: testPngBytes(),
      filename,
      contentType: 'image/png',
      path,
      siteId: SITE_ID,
    });
    uploadedPaths.add(path);

    await dam.open();
    await dam.setSearch(filename);
    expect(await dam.waitForAssetPresence(filename, true), 'the fixture asset never appeared')
      .to.equal(true);

    await dam.openAssetMenu(asset.id);

    // `Move to folder` had no handler at all, like Download and Copy URL. There is no
    // move endpoint on the asset API, so it is disabled rather than silently inert —
    // this asserts it stays that way instead of quietly becoming a no-op again.
    expect(
      await dam.isMenuItemDisabled('dam-asset-move'),
      'Move to folder must be disabled while no move endpoint exists',
    ).to.equal(true);

    // Copy URL reports what it did. Clipboard access can be refused in a headless
    // browser, in which case the page shows the URL instead — either way it must speak.
    await dam.clickMenuItem('dam-asset-copy-url');
    const notice = await dam.actionNoticeText();
    expect(notice, 'Copy URL produced no feedback at all').to.not.equal(null);
    expect(notice ?? '', 'the notice mentions neither the asset nor its URL')
      .to.satisfy((t: string) => t.includes(filename) || t.includes(asset.id));

    // Download: the confirmation is only set after the bytes have been fetched and a
    // blob built, so it stands in for "the download path actually ran". The saved file
    // itself is the browser's business and not observable from here.
    await dam.openAssetMenu(asset.id);
    await dam.clickMenuItem('dam-asset-download');
    const downloaded = await dam.waitForActionNotice(/downloaded/i);
    expect(downloaded, 'Download produced no confirmation, so the fetch did not succeed')
      .to.not.equal(null);
    expect(downloaded ?? '', 'the confirmation does not name the downloaded asset')
      .to.contain(filename);
  });
});
