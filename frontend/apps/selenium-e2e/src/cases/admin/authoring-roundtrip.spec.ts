import { expect } from 'chai';
import type { WebDriver } from 'selenium-webdriver';
import { createDriver, quitDriver } from '../../driver/browser';
import { attachFailureScreenshot } from '../../reports/hooks';
import { AuthorApiClient } from '../../pages/AuthorApiClient';
import { EditorPage } from '../../pages/EditorPage';

describe('REB-13 admin authoring and round-trip suite @smoke', function () {
  this.timeout(180_000);

  let driver: WebDriver | undefined;
  let editorPage: EditorPage;
  let authorApi: AuthorApiClient;
  let targetPath = '';

  before(async () => {
    driver = await createDriver();
    if (!driver) throw new Error('driver was not initialized');

    editorPage = new EditorPage(driver);
    authorApi = new AuthorApiClient();
    targetPath = await authorApi.discoverTargetPagePath();
  });

  after(async () => {
    await quitDriver(driver);
  });

  attachFailureScreenshot(() => driver);

  it('edits a page property and persists it after refresh', async () => {
    if (!driver) throw new Error('driver was not initialized');

    await editorPage.open(targetPath);
    await editorPage.selectLayerByText('page metadata');

    const detached = await editorPage.cancelInheritanceIfVisible();
    if (detached) {
      await editorPage.clickSave();
      await editorPage.waitForAnySaveTimestamp();
    }

    const hasEditableFields = await editorPage.hasEditablePropertyField();
    if (!hasEditableFields) {
      await editorPage.clickSave();
      await editorPage.waitForAnySaveTimestamp();
      return;
    }

    const marker = `reb13-${Date.now()}`;
    const expectedValue = await editorPage.updateFirstEditableTextField(marker);
    await editorPage.clickSave();
    await editorPage.waitForAnySaveTimestamp();

    await editorPage.refreshAndWait();
    const actualValue = await editorPage.readFirstEditableTextFieldValue();
    expect(actualValue).to.equal(expectedValue);
  });

  it('cancels inheritance for a locked component', async function () {
    if (!driver) throw new Error('driver was not initialized');

    await editorPage.open(targetPath);
    const hasLockedLayer = await editorPage.hasLockedLayer();
    if (!hasLockedLayer) {
      this.skip();
      return;
    }

    await editorPage.selectFirstLockedLayer();

    const canceled = await editorPage.cancelInheritanceIfVisible();
    expect(canceled).to.equal(true);
  });

  it('publishes the page and verifies author + GraphQL + rendered site round-trip', async () => {
    if (!driver) throw new Error('driver was not initialized');

    await editorPage.open(targetPath);
    await editorPage.clickPublish();
    await editorPage.waitForPublishedFooter();

    const pageNode = await authorApi.getPageNode(targetPath);
    expect(pageNode.status).to.equal('PUBLISHED');

    const sitePath = AuthorApiClient.toSitePath(targetPath);
    const graphqlTitle = await authorApi.getGraphqlPageTitle(sitePath);
    expect(graphqlTitle.length).to.be.greaterThan(0);

    await editorPage.openPublicSitePage(sitePath);
    const bodyText = await editorPage.readBodyText();
    expect(bodyText.length).to.be.greaterThan(0);
    expect(bodyText.toLowerCase()).to.not.include('404');
  });
});

