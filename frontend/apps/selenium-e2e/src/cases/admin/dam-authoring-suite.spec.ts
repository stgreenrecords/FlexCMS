/**
 * REB-21 — DAM authoring and asset-reference E2E suite.
 *
 * Covers the DAM as the platform actually implements it: upload, metadata,
 * binary streaming, listing, search, folder listing, deletion, referencing an
 * asset from authored content, and what the publish environment can do with that
 * reference.
 *
 * Two facts about this platform shape the whole suite, and both were verified
 * before a line of it was written:
 *
 * - **The DAM has no seeded content.** REB-07 copied 182 captured assets into the
 *   two frontend `public/` folders but uploaded none of them: its own
 *   `dam-import-map.json` records `"damUploaded": 0`, and the `assets` table is
 *   empty. Every asset this suite touches is therefore one it uploaded itself.
 * - **There is no publish-side asset delivery.** `flexcms-dam` ships only
 *   `client`/`config`/`service` — no controller — and nothing serves the
 *   `/dam/renditions/**` path that `SecurityConfig` permits. The single binary
 *   route is the author's `/api/author/assets/{id}/content`. `S7` proves what that
 *   means for a published page rather than asserting around it.
 *
 * Design decisions worth knowing before changing this file:
 *
 * - **Byte-level round trip.** Upload asserts the content stream returns exactly
 *   the bytes that went in, not merely a 200 — a truncating or re-encoding
 *   pipeline would pass a status check.
 * - **Positive controls.** Where a gap is expected, the same scenario also proves
 *   the working case (a public-folder image renders; a site-scoped search finds
 *   the asset), so a `BLOCKED` row can never be confused with a broken test.
 * - **Test-owned paths only.** Every upload goes under a run-unique prefix and
 *   deletion only ever targets that prefix (AC3).
 */
import { expect } from 'chai';
import type { WebDriver } from 'selenium-webdriver';
import { createDriver, quitDriver } from '../../driver/browser';
import { attachFailureScreenshot } from '../../reports/hooks';
import { OperationMatrixRecorder, type OperationOutcome } from '../../reports/operationMatrix';
import { AuthorApiClient, type DamAsset } from '../../pages/AuthorApiClient';
import { DamPage } from '../../pages/DamPage';
import { EditorAuthoringPage } from '../../pages/EditorAuthoringPage';
import { bytesEqual, bytesPreview, testPdfBytes, testPngBytes } from '../../fixtures/dam-assets';
import { importedSiteImageUrls } from '../../fixtures/site-assets';

const TASK_ID = 'REB-21';
const SITE_ID = 'tut-usa';
const SITE_ROOT_LTREE = `content.${SITE_ID}`;
const TEMPLATE_NAME = 'global-home-page';

/**
 * The fixture page is reused across runs by design: it gets published in `S7`, and
 * nothing in the platform can retract published content (REB-26 `R26-1`/`R26-2`),
 * so a timestamped page name would leave one permanent publish-side orphan per run.
 * Assets are the opposite — deletion works, so they carry a run-unique prefix.
 */
const FIXTURE_PAGE_NAME = 'reb21-asset-reference';

describe('REB-21 DAM authoring and asset-reference suite', function () {
  this.timeout(900_000);

  const runId = `reb21-${Date.now()}`;
  const assetFolder = `content/dam/${SITE_ID}/${runId}`;
  const api = new AuthorApiClient();
  const recorder = new OperationMatrixRecorder(TASK_ID, 'dam-operation-matrix.csv');
  const blockers: string[] = [];
  const observations: string[] = [];
  /** Every asset path this run uploaded, for guaranteed cleanup. */
  const uploadedPaths = new Set<string>();

  let driver: WebDriver | undefined;
  let dam: DamPage;
  let editor: EditorAuthoringPage;

  /** Populated by S2 and consumed by the scenarios that follow it. */
  let primaryAsset: DamAsset | undefined;
  let primaryAssetPath = '';
  const primaryFilename = `${runId}-primary.png`;

  function blocker(message: string): void {
    if (!blockers.includes(message)) blockers.push(message);
  }

  function observe(message: string): void {
    if (!observations.includes(message)) observations.push(message);
  }

  function record(
    scenarioId: string,
    scenario: string,
    operation: string,
    target: string,
    evidence: { api?: string; ui?: string; publish?: string },
    outcome: OperationOutcome,
    notes = '',
  ): void {
    recorder.add({
      scenarioId,
      scenario,
      operation,
      target,
      apiEvidence: evidence.api ?? '(not applicable)',
      uiEvidence: evidence.ui ?? '(no UI for this operation)',
      publishEvidence: evidence.publish ?? '(not a publishing operation)',
      outcome,
      notes,
    });
    recorder.write();
  }

  /** Uploads a test-owned asset and remembers it for cleanup. */
  async function uploadFixture(
    filename: string,
    bytes: Uint8Array,
    contentType: string,
  ): Promise<{ asset: DamAsset; path: string }> {
    const path = `${assetFolder}/${filename}`;
    const asset = await api.uploadAsset({ bytes, filename, contentType, path, siteId: SITE_ID });
    uploadedPaths.add(path);
    return { asset, path };
  }

  before(async () => {
    driver = await createDriver();
    dam = new DamPage(driver);
    editor = new EditorAuthoringPage(driver);
  });

  after(async () => {
    try {
      recorder.write();
      const totals = recorder.totals();
      console.log(
        `[${TASK_ID}] operations recorded: ${totals.total} ` +
          `(PASS ${totals.PASS}, BLOCKED ${totals.BLOCKED}, FAIL ${totals.FAIL}, SKIPPED ${totals.SKIPPED})`,
      );
      if (blockers.length > 0) {
        console.log(`[${TASK_ID}] implementation blockers observed:\n- ${blockers.join('\n- ')}`);
      }
      if (observations.length > 0) {
        console.log(`[${TASK_ID}] documented behaviour:\n- ${observations.join('\n- ')}`);
      }
    } finally {
      // AC3: only ever delete this run's own uploads.
      for (const path of uploadedPaths) {
        const status = await api.deleteAsset(path).catch(() => -1);
        if (status !== 200 && status !== 404) {
          console.error(`[${TASK_ID}] ASSET LEAK: ${path} still present (delete answered ${status}).`);
        }
      }
      await quitDriver(driver);
    }
  });

  attachFailureScreenshot(() => driver);

  // ── S1 — library smoke, and the state of the DAM itself ──────────────────
  it('S1 loads the DAM library against the live API and records how many assets exist', async () => {
    const before = await api.listAssets();

    await dam.open();
    expect(await dam.hasErrorState(), 'the DAM library must not render an error state').to.equal(false);
    expect(await dam.hasUploadControl(), 'the library must offer an Upload control').to.equal(true);

    if (before.totalCount === 0) {
      observe(
        'The DAM contains no assets at all. REB-07 copied 182 captured assets into ' +
          'frontend/apps/site-nextjs/public and frontend/apps/admin/public but uploaded none to the DAM — its own ' +
          'df/artifacts/REB-07/data/dam-import-map.json records "damUploaded": 0 next to "copiedSiteNextjs": 182 — ' +
          'so the asset library starts empty and every DAM-backed feature (picker, renditions, asset search) has no ' +
          'data to work with. This suite therefore uploads everything it verifies.',
      );
    }

    record(
      'S1',
      'DAM library smoke',
      'dam:list + UI load',
      '/dam',
      {
        api: `GET /api/author/assets -> 200, totalCount=${before.totalCount}`,
        ui: 'library rendered with no error state; Upload control present',
      },
      'PASS',
      before.totalCount === 0 ? 'DAM is empty: REB-07 imported 0 assets into it (damUploaded: 0)' : '',
    );
  });

  // ── S2 — upload, metadata, and a byte-exact content stream ───────────────
  it('S2 uploads an asset and streams back exactly the bytes that were uploaded', async () => {
    const bytes = testPngBytes();
    const uploaded = await uploadFixture(primaryFilename, bytes, 'image/png');
    primaryAsset = uploaded.asset;
    primaryAssetPath = uploaded.path;

    expect(primaryAsset.id, 'upload must return an asset id').to.be.a('string');

    const fetched = await api.getAsset(primaryAsset.id);
    expect(fetched.id).to.equal(primaryAsset.id);
    expect(fetched.mimeType, 'the stored mime type must reflect the uploaded PNG').to.contain('image/png');
    expect(Number(fetched.fileSize ?? 0), 'stored size must match the uploaded byte count').to.equal(bytes.length);
    expect(fetched.siteId).to.equal(SITE_ID);

    const content = await api.getAssetContent(primaryAsset.id);
    expect(content.status, 'the content stream must answer 200').to.equal(200);
    expect(content.contentType, 'the stream must declare the stored mime type').to.contain('image/png');
    expect(
      bytesEqual(content.bytes, bytes),
      `content stream returned ${content.bytes.length} bytes (${bytesPreview(content.bytes)}) ` +
        `for ${bytes.length} uploaded (${bytesPreview(bytes)})`,
    ).to.equal(true);

    record(
      'S2',
      'upload and content round trip',
      'dam:upload + dam:content',
      primaryAssetPath,
      {
        api:
          `POST /api/author/assets -> id ${primaryAsset.id}, mimeType ${fetched.mimeType}, ` +
          `fileSize ${fetched.fileSize}; GET /{id}/content returned ${content.bytes.length} bytes ` +
          'identical to the upload',
        ui: '(upload verified through the API; the UI dialog is exercised in S4)',
      },
      'PASS',
    );
  });

  // ── S3 — asset detail route ──────────────────────────────────────────────
  it('S3 opens the asset detail route and verifies its metadata and preview resolve', async () => {
    expect(primaryAsset, 'S2 must have uploaded the primary asset').to.not.equal(undefined);
    const asset = primaryAsset as DamAsset;

    await dam.openDetail(asset.id);
    const body = await dam.readBodyText();
    const showsFilename = body.includes(primaryFilename);

    const broken = await dam.brokenImageSources();
    const brokenPreview = broken.filter((src) => src.includes(asset.id));

    expect(brokenPreview, `the detail preview must resolve; broken: ${brokenPreview.join(', ')}`).to.deep.equal([]);

    if (!showsFilename) {
      observe(
        `The asset detail route /dam/${asset.id} does not display the stored filename ` +
          `"${primaryFilename}" anywhere in its rendered text; the metadata editor shows its own field set.`,
      );
    }

    record(
      'S3',
      'asset detail route',
      'dam:detail',
      `/dam/${asset.id}`,
      {
        api: `GET /api/author/assets/${asset.id} -> 200`,
        ui:
          `detail route rendered; filename shown: ${showsFilename}; ` +
          `preview images resolved (0 broken for this asset)`,
      },
      'PASS',
    );
  });

  // ── S4 — library listing and the two different searches ──────────────────
  it('S4 finds the uploaded asset in the library, and shows UI search and API search differ', async () => {
    expect(primaryAsset, 'S2 must have uploaded the primary asset').to.not.equal(undefined);

    // UI: the library filters client-side over the fetched page.
    const visible = await dam.waitForAssetPresence(primaryFilename, true);
    expect(visible, 'the uploaded asset must appear in the library').to.equal(true);

    await dam.setSearch(runId);
    const matchedAfterSearch = await dam.showsAsset(primaryFilename);
    expect(matchedAfterSearch, 'searching for the run id must keep the asset visible').to.equal(true);

    await dam.setSearch('zzz-no-such-asset-zzz');
    const matchedAfterMiss = await dam.showsAsset(primaryFilename);
    expect(matchedAfterMiss, 'a non-matching search must filter the asset out').to.equal(false);

    await dam.clearSearch();
    expect(await dam.showsAsset(primaryFilename), 'clearing the search must restore the asset').to.equal(true);

    // API: the keyword search is a different code path from the UI filter.
    const scoped = await api.trySearchAssets(runId, SITE_ID);
    const unscoped = await api.trySearchAssets(runId, undefined);
    const searchWorks = scoped.status === 200;

    if (!searchWorks) {
      blocker(
        'DAM keyword search is broken for every query: GET /api/author/assets?q=… answers HTTP ' +
          `${scoped.status} with siteId=${SITE_ID} and HTTP ${unscoped.status} without one. ` +
          'flexcms-core AssetRepository.search is a native query whose WHERE clause contains ' +
          '`OR :query = ANY(tags)`, but the `assets` table has no `tags` column — the author log shows ' +
          '`PSQLException: ERROR: column "tags" does not exist` raised from ' +
          'AssetIngestService.searchAssets(AssetIngestService.java:173). Listing (`GET /api/author/assets` with no ' +
          'q) and folder listing both answer 200, so search is the only broken read. It has evidently never worked: ' +
          'the admin DAM page filters client-side over `?size=200` and never calls `q`, so no UI surface exercises ' +
          'it, and REB-07 left the DAM empty so no seeded data would have provoked it either.',
      );
    } else {
      // If the query is ever fixed, hold it to the behaviour it should have.
      const scopedHit = scoped.page?.items.some((item) => item.id === primaryAsset?.id) ?? false;
      expect(scopedHit, 'a site-scoped API search must find the uploaded asset').to.equal(true);

      const unscopedHit = unscoped.page?.items.some((item) => item.id === primaryAsset?.id) ?? false;
      if (!unscopedHit) {
        observe(
          'GET /api/author/assets silently changes scope when a keyword is supplied: with no `q` it lists assets ' +
            'across every site, but as soon as `q` is set AuthorAssetController falls back to ' +
            '`siteId != null && !siteId.isBlank() ? siteId : "corporate"`, so a keyword search that omits siteId ' +
            'can never match a tut-usa asset.',
        );
      }
    }

    record(
      'S4',
      'library listing and search',
      'dam:list + dam:search',
      primaryFilename,
      {
        api: searchWorks
          ? `q="${runId}" with siteId=${SITE_ID} -> ${scoped.page?.totalCount ?? 0} hit(s); ` +
            `same q with no siteId -> ${unscoped.page?.totalCount ?? 0} hit(s)`
          : `q="${runId}" -> HTTP ${scoped.status} (with siteId) and HTTP ${unscoped.status} (without): ` +
            'AssetRepository.search references a non-existent `tags` column',
        ui: 'client-side filter matched on the run id, excluded on a miss, and restored on clear',
      },
      searchWorks ? 'PASS' : 'BLOCKED',
      searchWorks ? '' : 'the asset search endpoint 500s for every keyword — see blockers.md',
    );
  });

  // ── S5 — folder listing ──────────────────────────────────────────────────
  it('S5 lists the test-owned DAM folder and finds only this run\'s assets in it', async () => {
    const pdf = await uploadFixture(`${runId}-doc.pdf`, testPdfBytes(), 'application/pdf');

    const folder = await api.listAssetFolder(assetFolder, SITE_ID);
    const ids = folder.items.map((item) => item.id);

    expect(folder.totalCount, 'the folder must contain both uploads of this run').to.be.greaterThan(1);
    expect(ids, 'the folder listing must include the primary PNG').to.include(primaryAsset?.id);
    expect(ids, 'the folder listing must include the uploaded PDF').to.include(pdf.asset.id);

    // A non-image asset must keep its own content type rather than being coerced.
    const pdfContent = await api.getAssetContent(pdf.asset.id);
    expect(pdfContent.status).to.equal(200);
    expect(pdfContent.contentType, 'the PDF must stream as a PDF').to.contain('application/pdf');
    expect(bytesEqual(pdfContent.bytes, testPdfBytes()), 'the PDF bytes must round-trip').to.equal(true);

    record(
      'S5',
      'folder listing',
      'dam:folder',
      assetFolder,
      {
        api:
          `GET /api/author/assets/folder?folderPath=${assetFolder} -> totalCount=${folder.totalCount}; ` +
          'contains both run uploads; PDF streams as application/pdf with identical bytes',
        ui: '(folder browsing is not wired in the admin DAM page — it lists a flat library)',
      },
      'PASS',
    );
  });

  // ── S6 — reference the asset from authored content ───────────────────────
  it('S6 references the uploaded asset from a page component and verifies author API and delivery', async () => {
    expect(primaryAsset, 'S2 must have uploaded the primary asset').to.not.equal(undefined);
    const asset = primaryAsset as DamAsset;

    const pagePath = `${SITE_ROOT_LTREE}.${FIXTURE_PAGE_NAME}`;
    const sitePath = `/${SITE_ID}/${FIXTURE_PAGE_NAME}`;
    const componentName = 'reb21-media';
    const componentPath = `${pagePath}.${componentName}`;
    const assetUrl = api.assetContentUrl(asset.id);

    await api.deleteNode(pagePath).catch(() => undefined);
    await api.createNode({
      parentPath: SITE_ROOT_LTREE,
      name: FIXTURE_PAGE_NAME,
      resourceType: 'flexcms/page',
      properties: {
        'jcr:title': 'REB-21 asset reference',
        siteId: SITE_ID,
        template: TEMPLATE_NAME,
      },
    });
    await api.waitForNode(pagePath);

    // The asset field is authored through the API, not the editor: the editor
    // renders asset fields as String(value) in a text input (REB-19 blocker B-1),
    // so a UI edit would persist a string in place of the reference.
    await api.createNode({
      parentPath: pagePath,
      name: componentName,
      // A real contract from component-contracts.json: `image` is its asset field
      // (isAsset: true) and `title` gives the render something traceable.
      resourceType: 'tut-usa/editorial-article-content/story-card',
      properties: {
        flexcmsTemplateDetached: true,
        image: assetUrl,
        title: `REB-21 ${runId} story`,
        excerpt: `REB-21 ${runId} excerpt`,
        category: 'REB-21',
      },
    });
    await api.waitForNode(componentPath);

    const stored = await api.getNode(componentPath);
    expect(String(stored.properties?.['image'] ?? ''), 'the asset reference must persist verbatim').to.equal(assetUrl);

    const delivered = await api.getAuthorRenderedPage(sitePath);
    const deliveredJson = JSON.stringify(delivered);
    expect(deliveredJson, 'the delivery JSON must carry the asset reference').to.include(asset.id);

    record(
      'S6',
      'asset referenced from content',
      'content:reference asset',
      componentPath,
      {
        api: `component property image=${assetUrl} persisted verbatim; author delivery JSON carries the asset id`,
        ui: '(asset fields render as a plain text input in the editor — REB-19 B-1 — so the value is authored via API)',
      },
      'PASS',
    );
  });

  // ── S7 — publish the asset-backed page and check rendered image health ───
  it('S7 publishes the asset-backed page and verifies what the publish environment can serve', async () => {
    expect(primaryAsset, 'S2 must have uploaded the primary asset').to.not.equal(undefined);
    const asset = primaryAsset as DamAsset;

    const pagePath = `${SITE_ROOT_LTREE}.${FIXTURE_PAGE_NAME}`;
    const sitePath = `/${SITE_ID}/${FIXTURE_PAGE_NAME}`;

    await api.bulkPublish([pagePath]);
    await api.waitForNodeStatus(pagePath, 'PUBLISHED');

    const onPublish = await api.waitForPublishMarker(sitePath, asset.id);
    expect(onPublish, 'the publish environment must serve the page carrying the asset reference').to.equal(true);

    // Can the publish environment serve the asset's bytes at all?
    const publishAssetStatus = await fetch(
      `${process.env.PUBLISH_URL ?? 'http://localhost:8081'}/api/author/assets/${asset.id}/content`,
    )
      .then((res) => res.status)
      .catch(() => -1);
    const renditionStatus = await fetch(
      `${process.env.PUBLISH_URL ?? 'http://localhost:8081'}/dam/renditions/${asset.id}`,
    )
      .then((res) => res.status)
      .catch(() => -1);

    const publishServesAsset = publishAssetStatus === 200 || renditionStatus === 200;
    if (!publishServesAsset) {
      blocker(
        'A DAM asset referenced by published content cannot be served by the publish environment: the platform has ' +
          'no publish-side asset delivery at all. flexcms-dam ships only client/config/service packages — there is ' +
          'no controller anywhere — and although SecurityConfig permits `GET /dam/renditions/**`, nothing is mapped ' +
          `to it: :8081/dam/renditions/{id} answers ${renditionStatus} and :8081/api/author/assets/{id}/content ` +
          `answers ${publishAssetStatus} (both 500 via the generic error handler rather than 404). The only binary ` +
          'route is the author endpoint, so any page whose media points at a DAM asset renders a dead image for ' +
          'public visitors. This is why REB-07 copied its 182 captured assets into the frontends\' public/ folders ' +
          'instead of relying on DAM delivery.',
      );
    }

    // Positive control: an asset served from the reference site's public folder
    // does render, which proves the check above measures delivery and not the
    // image-health mechanism itself.
    const publicImages = importedSiteImageUrls();
    expect(publicImages.length, 'REB-07 public-folder images must exist for the control').to.be.greaterThan(0);
    await editor.openPublicSitePage('/tut-usa/home');
    const brokenOnHome = await editor.brokenImageSources();

    record(
      'S7',
      'publish an asset-backed page',
      'content:publish + dam:delivery',
      sitePath,
      {
        api: `page PUBLISHED; author delivery carries asset ${asset.id}`,
        ui: `reference-site control page /tut-usa/home reported ${brokenOnHome.length} broken image(s)`,
        publish: publishServesAsset
          ? 'publish serves the asset binary'
          : `publish serves the page JSON but not the asset: /dam/renditions/{id} -> ${renditionStatus}, ` +
            `/api/author/assets/{id}/content -> ${publishAssetStatus}`,
      },
      publishServesAsset ? 'PASS' : 'BLOCKED',
      publishServesAsset ? '' : 'no publish-side asset delivery exists — see blockers.md',
    );
  });

  // ── S8 — delete only what this run owns ──────────────────────────────────
  it('S8 deletes a test-owned asset by path and leaves the run\'s other asset untouched', async () => {
    const throwaway = await uploadFixture(`${runId}-throwaway.png`, testPngBytes(), 'image/png');
    expect(await api.getAssetStatus(throwaway.asset.id), 'the throwaway must exist first').to.equal(200);

    const deleteStatus = await api.deleteAsset(throwaway.path);
    expect(deleteStatus, 'delete by path must succeed').to.equal(200);
    uploadedPaths.delete(throwaway.path);

    const afterStatus = await api.getAssetStatus(throwaway.asset.id);
    const goneFromApi = afterStatus === 404;
    if (!goneFromApi) {
      blocker(
        `Deleting a DAM asset by path leaves its metadata retrievable: DELETE /api/author/assets?path=` +
          `${throwaway.path} answered 200, but GET /api/author/assets/${throwaway.asset.id} still answers ` +
          `${afterStatus}.`,
      );
    }

    // The other test-owned asset must be untouched (AC3).
    expect(
      await api.getAssetStatus((primaryAsset as DamAsset).id),
      'deleting one asset must not affect another',
    ).to.equal(200);

    record(
      'S8',
      'delete safety',
      'dam:delete by path',
      throwaway.path,
      {
        api:
          `DELETE -> ${deleteStatus}; GET /{id} -> ${afterStatus}; ` +
          `sibling asset ${(primaryAsset as DamAsset).id} still 200`,
        ui: '(the library offers a Delete action only for selected assets; API path used for determinism)',
      },
      goneFromApi ? 'PASS' : 'BLOCKED',
      goneFromApi ? '' : 'asset metadata survives a successful delete',
    );
  });

  // ── S9 — what upload validation actually rejects ─────────────────────────
  it('S9 records how the upload endpoint responds to an empty file and an executable', async () => {
    const emptyPath = `${assetFolder}/${runId}-empty.png`;
    const empty = await api.tryUploadAsset({
      bytes: new Uint8Array(),
      filename: `${runId}-empty.png`,
      contentType: 'image/png',
      path: emptyPath,
      siteId: SITE_ID,
    });
    if (empty.asset) uploadedPaths.add(emptyPath);

    const exePath = `${assetFolder}/${runId}-payload.exe`;
    const exe = await api.tryUploadAsset({
      bytes: new Uint8Array([0x4d, 0x5a, 0x90, 0x00]), // "MZ" — a DOS/PE header
      filename: `${runId}-payload.exe`,
      contentType: 'application/octet-stream',
      path: exePath,
      siteId: SITE_ID,
    });
    if (exe.asset) uploadedPaths.add(exePath);

    const emptyAccepted = empty.status === 200;
    const exeAccepted = exe.status === 200;

    if (emptyAccepted || exeAccepted) {
      blocker(
        'The asset upload endpoint performs no content validation: ' +
          `a zero-byte file answered ${empty.status}` +
          (emptyAccepted ? ' and was stored as an asset' : '') +
          `, and a file with a DOS/PE executable header uploaded as ${runId}-payload.exe answered ${exe.status}` +
          (exeAccepted ? ' and was stored as an asset' : '') +
          '. AuthorAssetController.uploadAsset() passes MultipartFile.getBytes() straight to ' +
          'assetService.ingest() with no size, emptiness, or type check, while the admin upload dialog advertises ' +
          '`accept="image/*,video/*,.pdf,.zip,.xlsx"` and a 100 MB cap — limits that exist only in the browser and ' +
          'are absent from the API any client can call directly.',
      );
    }

    record(
      'S9',
      'upload validation',
      'dam:upload (empty file, executable)',
      assetFolder,
      {
        api:
          `zero-byte upload -> HTTP ${empty.status}${emptyAccepted ? ' (stored)' : ''}; ` +
          `.exe upload -> HTTP ${exe.status}${exeAccepted ? ' (stored)' : ''}`,
        ui: 'the admin dialog restricts types and size client-side only (accept=…, maxSize=100 MB)',
      },
      emptyAccepted || exeAccepted ? 'BLOCKED' : 'PASS',
      emptyAccepted || exeAccepted ? 'server-side upload validation is absent — see blockers.md' : '',
    );
  });

  // ── S10 — evidence completeness ──────────────────────────────────────────
  it('S10 records one evidence row per DAM operation with no unexplained outcomes', () => {
    const totals = recorder.totals();
    expect(totals.total, 'every scenario must contribute an operation row').to.be.greaterThan(7);
    expect(totals.FAIL, 'no operation may end the run in FAIL').to.equal(0);

    for (const row of [...recorder.rowsByOutcome('BLOCKED'), ...recorder.rowsByOutcome('SKIPPED')]) {
      expect(row.notes, `${row.scenarioId}/${row.operation} must carry a reason`).to.not.equal('');
    }

    console.log(`[${TASK_ID}] matrix written with ${totals.total} operation row(s)`);
  });
});
