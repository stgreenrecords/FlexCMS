import { expect } from 'chai';
import type { WebDriver } from 'selenium-webdriver';
import { createDriver, quitDriver } from '../../driver/browser';
import { attachFailureScreenshot } from '../../reports/hooks';
import { AuthorApiClient, type AuthorChildNode } from '../../pages/AuthorApiClient';
import { ContentTreePage } from '../../pages/ContentTreePage';
import { EditorPage } from '../../pages/EditorPage';

describe('REB-18 content tree and page lifecycle suite @smoke', function () {
  this.timeout(300_000);

  let driver: WebDriver | undefined;
  let authorApi: AuthorApiClient;
  let contentTreePage: ContentTreePage;
  let editorPage: EditorPage;

  const createdPaths: string[] = [];

  before(async () => {
    driver = await createDriver();
    if (!driver) throw new Error('driver was not initialized');

    authorApi = new AuthorApiClient();
    contentTreePage = new ContentTreePage(driver);
    editorPage = new EditorPage(driver);
  });

  after(async () => {
    for (const path of createdPaths.reverse()) {
      try {
        await authorApi.deleteNode(path);
      } catch {
        // Best-effort cleanup for test-owned nodes.
      }
    }
    await quitDriver(driver);
  });

  attachFailureScreenshot(() => driver);

  it('loads content tree root, supports navigation, search, selection, and row action links', async () => {
    if (!driver) throw new Error('driver was not initialized');

    await contentTreePage.open();

    const rootRows = await contentTreePage.readVisibleRowNames();
    expect(rootRows.length).to.be.greaterThan(0);

    const bodyText = (await contentTreePage.readBodyText()).toLowerCase();
    expect(bodyText).to.not.include('404');

    const rootChildren = await authorApi.getChildren('content');
    const rootChildNames = new Set(rootChildren.map((node) => normalizeName(node.name)));
    expect(rootRows.some((name) => rootChildNames.has(normalizeName(name)))).to.equal(true);

    const navigableNode = await findNavigableNode(authorApi, rootChildren);
    expect(navigableNode).to.not.equal(null);

    const navigable = navigableNode as AuthorChildNode;
    await contentTreePage.clickRowByName(navigable.name);

    const navigableChildren = await authorApi.getChildren(navigable.path);
    const visibleAfterNavigation = await contentTreePage.readVisibleRowNames();
    const expectedChildNames = new Set(navigableChildren.map((node) => normalizeName(node.name)));
    expect(visibleAfterNavigation.some((name) => expectedChildNames.has(normalizeName(name)))).to.equal(true);

    await contentTreePage.clickNavigateUp();

    const filterTarget = rootRows[0];
    await contentTreePage.setSearch(filterTarget);
    const filteredRows = await contentTreePage.readVisibleRowNames();
    expect(filteredRows.length).to.be.greaterThan(0);
    expect(filteredRows.every((name) => name.toLowerCase().includes(filterTarget.toLowerCase()))).to.equal(true);

    await contentTreePage.selectRowCheckboxByName(filteredRows[0]);
    expect(await contentTreePage.isRowCheckboxChecked(filteredRows[0])).to.equal(true);

    await contentTreePage.clearSearch();
    const unfilteredRows = await contentTreePage.readVisibleRowNames();
    expect(unfilteredRows.length).to.be.greaterThan(0);

    const firstVisibleRow = unfilteredRows[0];
    if (await contentTreePage.isRowCheckboxChecked(firstVisibleRow)) {
      await contentTreePage.uncheckRowCheckboxByName(firstVisibleRow);
    }
    expect(await contentTreePage.readCheckedVisibleRowCount()).to.equal(0);

    await contentTreePage.toggleSelectAll();
    const selectedAllCount = await contentTreePage.readCheckedVisibleRowCount();
    expect(selectedAllCount).to.equal(unfilteredRows.length);

    await contentTreePage.toggleSelectAll();
    expect(await contentTreePage.readCheckedVisibleRowCount()).to.equal(0);

    const actionCandidates = await authorApi.discoverAllTutUsaPagePaths();
    const actionTargetPath = actionCandidates.find((path) => path.split('/').filter(Boolean).length > 2)
      ?? actionCandidates[0];
    const actionTargetName = actionTargetPath.split('/').filter(Boolean).pop() as string;
    const actionTargetParentPath = deriveParentPath(actionTargetPath);

    await contentTreePage.open();
    await navigateToFolder(contentTreePage, actionTargetParentPath);

    const rowName = actionTargetName;
    const rowPath = await contentTreePage.readRowUrlPathByName(rowName);
    const encodedPath = encodeURIComponent(rowPath);

    const editHref = await contentTreePage.readActionHref(rowName, 'Edit');
    const previewHref = await contentTreePage.readActionHref(rowName, 'Preview');

    expect(editHref).to.include('/editor?path=');
    expect(editHref).to.include(encodedPath);
    expect(previewHref).to.include('/preview?path=');
    expect(previewHref).to.include(encodedPath);

    await driver.get(editHref);
    await contentTreePage.waitForUrlContains('/editor?path=');
    const editorText = (await contentTreePage.readBodyText()).toLowerCase();
    expect(editorText).to.not.include('404');

    await driver.get(previewHref);
    await contentTreePage.waitForUrlContains('/preview?path=');
    const previewText = (await contentTreePage.readBodyText()).toLowerCase();
    expect(previewText).to.not.include('404');
  });

  it('creates a unique test page, publishes it, verifies author availability, and verifies publish visibility', async () => {
    const seedPath = await authorApi.discoverTargetPagePath();
    const seedNode = await authorApi.getPageNode(seedPath);

    const parentPath = deriveParentPath(seedPath);
    const nodeName = `reb18-e2e-${Date.now()}`;
    const createProps: Record<string, unknown> = {
      title: `REB-18 ${nodeName}`,
    };
    const template = typeof seedNode.properties?.['template'] === 'string' ? String(seedNode.properties?.['template']) : '';
    if (template) {
      createProps['template'] = template;
    }

    // REB-18 blocker note: current content page UI exposes "Create New Page" but does not wire create action yet.
    await authorApi.createNode({
      parentPath,
      name: nodeName,
      resourceType: 'flexcms/page',
      properties: createProps,
    });

    const createdPath = `${parentPath}/${nodeName}`;
    createdPaths.push(createdPath);

    await authorApi.waitForNode(createdPath);

    await contentTreePage.open();
    await navigateToFolder(contentTreePage, parentPath);
    await contentTreePage.setSearch(nodeName);

    const rows = await contentTreePage.readVisibleRowNames();
    expect(rows).to.include(nodeName);

    await contentTreePage.openEditor(createdPath);
    expect(await editorPage.hasElementByTestId('editor-save-button')).to.equal(true);

    await authorApi.bulkPublish([createdPath]);
    const publishedNode = await authorApi.waitForNodeStatus(createdPath, 'PUBLISHED');
    expect(publishedNode.status).to.equal('PUBLISHED');

    const publishParentPath = AuthorApiClient.toSitePath(parentPath);
    const publishChildren = await authorApi.waitForPublishChild(publishParentPath, nodeName);
    expect(publishChildren.some((node) => normalizeName(node.name) === normalizeName(nodeName))).to.equal(true);
  });

  it('descends into a page that has child pages, and lists pages rather than components', async () => {
    if (!driver) throw new Error('driver was not initialized');

    // `GET /children` returns a page's components next to its child pages. Find a page
    // that genuinely has both, from the live tree rather than a hardcoded name.
    const siteChildren = await authorApi.getChildren('content.tut-usa');
    let parent: AuthorChildNode | null = null;
    let childPageNames: string[] = [];
    let componentNames: string[] = [];

    for (const candidate of siteChildren) {
      if (candidate.resourceType !== 'flexcms/page') continue;
      const kids = await authorApi.getChildren(candidate.path);
      const pages = kids.filter((k) => k.resourceType === 'flexcms/page');
      if (pages.length > 0) {
        parent = candidate;
        childPageNames = pages.map((p) => p.name);
        componentNames = kids
          .filter((k) => !k.resourceType.startsWith('flexcms/'))
          .map((k) => k.name);
        break;
      }
    }

    expect(parent, 'no page in the site has child pages, so this cannot be verified')
      .to.not.equal(null);
    const parentNode = parent as AuthorChildNode;

    await contentTreePage.open();
    await contentTreePage.clickRowByName('tut-usa');
    await contentTreePage.waitForRowNames([parentNode.name]);

    // Before opening it: the row must advertise that it can be opened, and say how many
    // pages are under it. Navigation alone left an author guessing which rows go
    // anywhere, since a page with six child pages looked identical to a leaf.
    expect(
      await contentTreePage.hasExpandableMarker(parentNode.name),
      `"${parentNode.name}" has ${childPageNames.length} child pages but shows no expandable marker`,
    ).to.equal(true);
    expect(
      await contentTreePage.childCountForRow(parentNode.name),
      `the child count shown for "${parentNode.name}" disagrees with the API`,
    ).to.equal(childPageNames.length);

    // The regression: the tree refused to enter any `flexcms/page`, so every child page
    // of `vehicles`, `innovation`, `owners` and `learn` was unreachable from here.
    await contentTreePage.clickRowByName(parentNode.name);
    await contentTreePage.waitForRowNames(childPageNames.slice(0, 1));

    const rows = await contentTreePage.readVisibleRowNames();
    const normalized = new Set(rows.map(normalizeName));
    for (const name of childPageNames) {
      expect(
        normalized.has(normalizeName(name)),
        `child page "${name}" is missing after opening "${parentNode.name}"`,
      ).to.equal(true);
    }

    // Components live on the canvas, not in the tree. Listing them here would present
    // page content as navigable pages.
    for (const name of componentNames) {
      expect(
        normalized.has(normalizeName(name)),
        `component "${name}" is being listed as a tree row`,
      ).to.equal(false);
    }
  });

  it('stays put when a page has no child pages, so it remains a leaf', async () => {
    if (!driver) throw new Error('driver was not initialized');

    const siteChildren = await authorApi.getChildren('content.tut-usa');
    let leaf: AuthorChildNode | null = null;
    for (const candidate of siteChildren) {
      if (candidate.resourceType !== 'flexcms/page') continue;
      const kids = await authorApi.getChildren(candidate.path);
      if (!kids.some((k) => k.resourceType.startsWith('flexcms/'))) {
        leaf = candidate;
        break;
      }
    }

    expect(leaf, 'every page has child pages, so leaf behaviour cannot be verified')
      .to.not.equal(null);
    const leafNode = leaf as AuthorChildNode;

    await contentTreePage.open();
    await contentTreePage.clickRowByName('tut-usa');
    await contentTreePage.waitForRowNames([leafNode.name]);
    const before = await contentTreePage.readVisibleRowNames();

    // A leaf must not advertise an affordance it cannot honour.
    expect(
      await contentTreePage.hasExpandableMarker(leafNode.name),
      `leaf "${leafNode.name}" shows an expandable marker but has no child pages`,
    ).to.equal(false);
    expect(
      await contentTreePage.childCountForRow(leafNode.name),
      `leaf "${leafNode.name}" shows a child count`,
    ).to.equal(null);

    await contentTreePage.clickRowByName(leafNode.name);

    // The counterpart to the test above: opening a page must not become "navigate into
    // an empty level". A leaf keeps the level it is on, which is also what leaves
    // double-click free to open the page on publish.
    const after = await contentTreePage.readVisibleRowNames();
    expect(after.map(normalizeName).sort(), `clicking leaf "${leafNode.name}" changed the level`)
      .to.deep.equal(before.map(normalizeName).sort());
  });
});

async function findNavigableNode(authorApi: AuthorApiClient, nodes: AuthorChildNode[]): Promise<AuthorChildNode | null> {
  for (const node of nodes) {
    const children = await authorApi.getChildren(node.path);
    if (children.length > 0) {
      return node;
    }
  }
  return nodes.length > 0 ? nodes[0] : null;
}

function deriveParentPath(path: string): string {
  const segments = path.split('/').filter(Boolean);
  if (segments.length <= 2) {
    return '/content/tut-usa';
  }
  return `/${segments.slice(0, -1).join('/')}`;
}

async function navigateToFolder(contentTreePage: ContentTreePage, folderPath: string): Promise<void> {
  const segments = folderPath.split('/').filter(Boolean);
  const folderSegments = segments.slice(1); // drop leading "content"
  for (const segment of folderSegments) {
    await contentTreePage.clickRowByName(segment);
  }
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

