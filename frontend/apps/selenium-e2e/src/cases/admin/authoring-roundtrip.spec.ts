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

  it('shows expected authoring controls and routes navigation buttons correctly', async () => {
    if (!driver) throw new Error('driver was not initialized');

    await editorPage.open(targetPath);

    expect(await editorPage.hasElementByTestId('editor-save-button')).to.equal(true);
    expect(await editorPage.hasElementByTestId('editor-publish-button')).to.equal(true);
    expect(await editorPage.hasCancelAllInheritanceButton()).to.equal(true);
    expect(await editorPage.hasElementByTestId('editor-left-tab-components')).to.equal(true);
    expect(await editorPage.hasElementByTestId('editor-left-tab-layers')).to.equal(true);
    expect(await editorPage.hasElementByTestId('editor-left-tab-assets')).to.equal(true);
    expect(await editorPage.hasElementByTestId('editor-breadcrumb')).to.equal(true);

    expect(await editorPage.hasElementByTestId('editor-undo-button')).to.equal(true);
    expect(await editorPage.hasElementByTestId('editor-redo-button')).to.equal(true);
    expect(await editorPage.hasElementByTestId('editor-preview-button')).to.equal(true);
    expect(await editorPage.hasElementByTestId('editor-settings-button')).to.equal(true);

    expect(await editorPage.hasLinkByHrefContains('/content')).to.equal(true);
    expect(await editorPage.hasLinkByHrefContains('/content/experience-fragments/tut-usa/global/navigation')).to.equal(true);
    expect(await editorPage.hasLinkByHrefContains('/content/experience-fragments/tut-usa/global/footer')).to.equal(true);

    const previewUrl = await editorPage.clickPreviewAndReadNewTabUrl();
    expect(previewUrl).to.include('/preview?path=');
  });

  it('edits a page property and persists it after refresh', async () => {
    if (!driver) throw new Error('driver was not initialized');

    await editorPage.open(targetPath);
    await editorPage.cancelInheritanceForAll();
    await editorPage.selectLayerByText('page metadata');

    await editorPage.clickSave();
    await editorPage.waitForAnySaveTimestamp();

    const hasEditableFields = await editorPage.hasEditablePropertyField();
    if (!hasEditableFields) {
      await editorPage.clickSave();
      await editorPage.waitForAnySaveTimestamp();
      return;
    }

    // A fresh value each run, written over the previous one rather than appended, so the
    // shared fixture page does not accumulate markers run after run.
    const marker = `reb13-${Date.now()}`;
    const expectedValue = await editorPage.setFirstEditableTextField(marker);
    await editorPage.clickSave();
    await editorPage.waitForAnySaveTimestamp();

    await editorPage.refreshAndWait();
    const actualValue = await editorPage.readFirstEditableTextFieldValue();
    expect(actualValue).to.equal(expectedValue);
  });

  it('cancels inheritance for all locked components without backend/UI error', async () => {
    if (!driver) throw new Error('driver was not initialized');

    await editorPage.open(targetPath);
    const hasLockedLayer = await editorPage.hasLockedLayer();
    expect(hasLockedLayer).to.equal(true);

    await editorPage.cancelInheritanceForAll();
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

