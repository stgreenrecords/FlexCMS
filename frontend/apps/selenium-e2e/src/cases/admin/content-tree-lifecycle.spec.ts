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

