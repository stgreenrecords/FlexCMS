/**
 * FlexCMS Selenium E2E — REB-23: PIM catalog and product authoring.
 *
 * The PIM is a separate datasource (`flexcms_pim`) behind `/api/pim/v1`, so nothing
 * here assumes CMS content nodes (AC1).
 *
 * Conventions:
 *
 * - **Test-owned data only** (AC2). Every catalog, SKU and variant carries a run-unique
 *   prefix. The seeded `TUT 2026 Model Lineup` catalog and its four products are read
 *   for the route smoke and never mutated.
 * - **Cleanup respects referential integrity.** Carryforward makes the target product
 *   reference the source, and a catalog cannot be dropped while it holds products, so
 *   teardown deletes products before catalogs and carried-forward copies before their
 *   sources. Those constraints are deliberate; the suite works with them rather than
 *   around them.
 * - **Behaviour was probed against the running API before it was asserted.** That is
 *   what surfaced the defects fixed under this task — see the summary artifact.
 */
import { expect } from 'chai';
import { By, type WebDriver } from 'selenium-webdriver';
import { createDriver, quitDriver } from '../../driver/browser';
import { attachFailureScreenshot } from '../../reports/hooks';
import { loadEnv } from '../../driver/env';
import { waitForPageReady } from '../../driver/waits';
import { OperationMatrixRecorder, type OperationOutcome } from '../../reports/operationMatrix';

const TASK_ID = 'REB-23';

interface ApiResult<T = unknown> {
  status: number;
  body: T;
}

describe('REB-23 PIM catalog and product authoring suite', function () {
  this.timeout(900_000);

  const env = loadEnv();
  const pim = `${env.authorApiUrl}/pim/v1`;

  const runId = `reb23-${Date.now()}`;
  const sku = `${runId}-SKU`;
  const recorder = new OperationMatrixRecorder(TASK_ID, 'pim-operation-matrix.csv');
  const blockers: string[] = [];
  const observations: string[] = [];

  let driver: WebDriver | undefined;

  /** Populated by S2 and consumed by everything after it. */
  let schemaId = '';
  let catalogId = '';
  let targetCatalogId = '';
  let productId = '';

  attachFailureScreenshot(() => driver);

  async function call<T = unknown>(method: string, url: string, body?: unknown): Promise<ApiResult<T>> {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let parsed: unknown = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }
    return { status: res.status, body: parsed as T };
  }

  function record(row: {
    scenarioId: string;
    scenario: string;
    operation: string;
    target: string;
    api?: string;
    ui?: string;
    publish?: string;
    outcome: OperationOutcome;
    notes?: string;
  }): void {
    recorder.add({
      scenarioId: row.scenarioId,
      scenario: row.scenario,
      operation: row.operation,
      target: row.target,
      apiEvidence: row.api ?? '',
      uiEvidence: row.ui ?? '',
      publishEvidence: row.publish ?? '',
      outcome: row.outcome,
      notes: row.notes ?? '',
    });
  }

  before(async () => {
    driver = await createDriver();
  });

  after(async () => {
    // Order matters: the carried-forward copy references the source product, and a
    // catalog cannot be deleted while it still holds products.
    const carried = await call<{ content?: Array<{ sku: string }> }>(
      'GET',
      `${pim}/products?catalogId=${targetCatalogId}`,
    ).catch(() => ({ status: 0, body: {} }) as ApiResult<{ content?: Array<{ sku: string }> }>);

    for (const product of carried.body?.content ?? []) {
      await call('DELETE', `${pim}/products/${encodeURIComponent(product.sku)}`).catch(() => undefined);
    }
    await call('DELETE', `${pim}/products/${encodeURIComponent(sku)}`).catch(() => undefined);
    for (const id of [targetCatalogId, catalogId]) {
      if (id) await call('DELETE', `${pim}/catalogs/${id}`).catch(() => undefined);
    }

    const matrixPath = recorder.write();
    console.log(
      `[${TASK_ID}] matrix rows: ${recorder.size} ` +
        `(PASS ${recorder.countByOutcome('PASS')}, BLOCKED ${recorder.countByOutcome('BLOCKED')}) ` +
        `-> ${matrixPath}`,
    );
    if (blockers.length > 0) {
      console.log(`[${TASK_ID}] implementation blockers observed:`);
      for (const blocker of blockers) console.log(`- ${blocker}`);
    }
    if (observations.length > 0) {
      console.log(`[${TASK_ID}] documented behaviour:`);
      for (const observation of observations) console.log(`- ${observation}`);
    }
    await quitDriver(driver);
  });

  it('S1 opens the PIM routes and shows API-backed data', async () => {
    const d = driver as WebDriver;

    const catalogs = await call<{ items?: Array<{ id: string; name: string; schema?: { id: string } }> }>(
      'GET',
      `${pim}/catalogs`,
    );
    expect(catalogs.status).to.equal(200);
    const seeded = (catalogs.body.items ?? [])[0];
    expect(seeded, 'no seeded catalog to smoke the routes against').to.not.equal(undefined);
    schemaId = seeded.schema?.id ?? '';
    expect(schemaId, 'the seeded catalog has no schema').to.not.equal('');

    const routes = ['/pim', '/pim/schema', '/pim/import', `/pim/${seeded.id}`];
    const visited: string[] = [];
    for (const route of routes) {
      await d.get(`${env.adminUrl}${route}`);
      await waitForPageReady(d);
      const body = (await (await d.findElement(By.css('body'))).getText()).toLowerCase();
      expect(body, `${route} rendered a not-found page`).to.not.contain('404');
      expect(body, `${route} rendered an application error`).to.not.contain('application error');
      visited.push(route);
    }

    // The catalog detail route must show data that came from the API, not a shell.
    const detailText = await (await d.findElement(By.css('body'))).getText();
    expect(detailText, 'the catalog detail route shows no seeded product')
      .to.contain('TUT');

    record({
      scenarioId: 'S1',
      scenario: 'opens the PIM routes and shows API-backed data',
      operation: 'pim:route-smoke',
      target: visited.join(' | '),
      api: `GET /pim/v1/catalogs returned "${seeded.name}"`,
      ui: 'catalog list, schema, import and catalog detail all rendered without a 404 or error',
      outcome: 'PASS',
    });
  });

  it('S2 creates a catalog and a product, and finds the product again', async () => {
    const catalog = await call<{ id?: string }>('POST', `${pim}/catalogs`, {
      name: `${runId} catalog`,
      year: 2026,
      season: 'test',
      description: 'REB-23 test catalog',
      schemaId,
      settings: {},
      userId: 'admin',
    });
    expect(catalog.status, 'creating the test catalog failed').to.equal(200);
    catalogId = catalog.body.id as string;

    const product = await call<{ id?: string; status?: string }>('POST', `${pim}/products`, {
      sku,
      name: `${runId} product`,
      catalogId,
      attributes: { name: `${runId} product`, tagline: 'original tagline' },
      userId: 'admin',
    });
    // Product creation used to fail outright whenever the search cluster was
    // unavailable, because indexing ran inline and rethrew.
    expect(product.status, 'creating a product failed').to.equal(200);
    productId = product.body.id as string;
    expect(product.body.status, 'a new product should start as DRAFT').to.equal('DRAFT');

    const fetched = await call<{ sku?: string }>('GET', `${pim}/products/${encodeURIComponent(sku)}`);
    expect(fetched.status).to.equal(200);
    expect(fetched.body.sku).to.equal(sku);

    const listed = await call<{ content?: Array<{ sku: string }> }>(
      'GET',
      `${pim}/products?catalogId=${catalogId}`,
    );
    expect(listed.body.content?.map((p) => p.sku), 'the product is missing from its catalog listing')
      .to.include(sku);

    record({
      scenarioId: 'S2',
      scenario: 'creates a catalog and a product, and finds the product again',
      operation: 'pim:product.create',
      target: sku,
      api: 'POST /catalogs and /products 200; get by SKU and catalog listing both resolve it',
      outcome: 'PASS',
    });
  });

  it('S3 updates product attributes and reads the marker back', async () => {
    const marker = `${runId}-marker`;

    const updated = await call<{ attributes?: Record<string, unknown> }>(
      'PUT',
      `${pim}/products/${encodeURIComponent(sku)}`,
      { attributes: { tagline: marker }, userId: 'admin' },
    );
    // Every update used to collide on (product_id, version_number): the version
    // snapshot read the version before the @PreUpdate increment had flushed.
    expect(updated.status, 'updating a product failed').to.equal(200);
    expect(updated.body.attributes?.tagline, 'the update did not take').to.equal(marker);

    const fetched = await call<{ attributes?: Record<string, unknown> }>(
      'GET',
      `${pim}/products/${encodeURIComponent(sku)}`,
    );
    expect(fetched.body.attributes?.tagline, 'the update did not persist').to.equal(marker);
    // Merging, not replacing: an attribute the update did not mention survives.
    expect(fetched.body.attributes?.name, 'update dropped an attribute it was not given')
      .to.equal(`${runId} product`);

    record({
      scenarioId: 'S3',
      scenario: 'updates product attributes and reads the marker back',
      operation: 'pim:product.update',
      target: sku,
      api: `attribute marker ${marker} present after re-read; untouched attributes preserved`,
      outcome: 'PASS',
    });
  });

  it('S4 transitions the product through DRAFT, PUBLISHED and ARCHIVED', async () => {
    for (const status of ['PUBLISHED', 'ARCHIVED', 'DRAFT']) {
      const response = await call<{ status?: string }>(
        'PUT',
        `${pim}/products/${encodeURIComponent(sku)}/status`,
        { status, userId: 'admin' },
      );
      // Status changes hit both defects at once: the version collision, and a lazily
      // loaded catalog/schema that failed to serialise once the session had closed.
      expect(response.status, `transition to ${status} failed`).to.equal(200);
      expect(response.body.status, `product did not report ${status}`).to.equal(status);

      const fetched = await call<{ status?: string }>(
        'GET',
        `${pim}/products/${encodeURIComponent(sku)}`,
      );
      expect(fetched.body.status, `${status} did not persist`).to.equal(status);
    }

    record({
      scenarioId: 'S4',
      scenario: 'transitions the product through DRAFT, PUBLISHED and ARCHIVED',
      operation: 'pim:product.status',
      target: sku,
      api: 'each transition returned the new status and survived a re-read',
      outcome: 'PASS',
    });
  });

  it('S5 creates, updates and deletes a variant', async () => {
    const variantSku = `${sku}-V1`;

    const created = await call<{ id?: string; variantSku?: string }>(
      'POST',
      `${pim}/products/${encodeURIComponent(sku)}/variants`,
      { variantSku, attributes: { colour: 'black' }, pricing: {}, inventory: {} },
    );
    // Returning a variant used to serialise its parent product and catalog, which were
    // lazy proxies outside the session — every variant call answered 500.
    expect(created.status, 'creating a variant failed').to.equal(200);
    const variantId = created.body.id as string;

    const afterCreate = await call<Array<{ variantSku: string }>>(
      'GET',
      `${pim}/products/${encodeURIComponent(sku)}/variants`,
    );
    expect(afterCreate.body.map((v) => v.variantSku)).to.include(variantSku);

    const updated = await call<{ attributes?: Record<string, unknown> }>(
      'PUT',
      `${pim}/products/variants/${variantId}`,
      { attributes: { colour: 'silver' }, pricing: {}, inventory: {} },
    );
    expect(updated.status, 'updating the variant failed').to.equal(200);
    expect(updated.body.attributes?.colour).to.equal('silver');

    const deleted = await call('DELETE', `${pim}/products/variants/${variantId}`);
    expect(deleted.status).to.be.oneOf([200, 204]);

    const afterDelete = await call<Array<{ variantSku: string }>>(
      'GET',
      `${pim}/products/${encodeURIComponent(sku)}/variants`,
    );
    expect(afterDelete.body.map((v) => v.variantSku), 'the deleted variant is still listed')
      .to.not.include(variantSku);

    record({
      scenarioId: 'S5',
      scenario: 'creates, updates and deletes a variant',
      operation: 'pim:variant.lifecycle',
      target: variantSku,
      api: 'create/list/update/delete each verified against a re-read of the variant list',
      outcome: 'PASS',
    });
  });

  it('S6 links, updates and unlinks a DAM asset reference', async () => {
    const assetPath = 'content/dam/tut-usa/heroes/orlando-resort.png';

    const linked = await call<{ id?: string; role?: string }>(
      'POST',
      `${pim}/products/${encodeURIComponent(sku)}/assets`,
      { assetPath, role: 'primary', orderIndex: 0 },
    );
    expect(linked.status, 'linking an asset failed').to.equal(200);
    const refId = linked.body.id as string;

    const listed = await call<Array<{ assetPath: string; role: string }>>(
      'GET',
      `${pim}/products/${encodeURIComponent(sku)}/assets`,
    );
    expect(listed.body.map((a) => a.assetPath)).to.include(assetPath);

    // The reference is by path, not a foreign key: the PIM database knows nothing of
    // the DAM schema, which is what makes this loose coupling worth asserting.
    const updated = await call<{ role?: string }>('PUT', `${pim}/products/assets/${refId}`, {
      role: 'gallery',
      orderIndex: 2,
    });
    expect(updated.status, 'updating the asset reference failed').to.equal(200);
    expect(updated.body.role).to.equal('gallery');

    const unlinked = await call('DELETE', `${pim}/products/assets/${refId}`);
    expect(unlinked.status).to.be.oneOf([200, 204]);

    const afterUnlink = await call<Array<{ assetPath: string }>>(
      'GET',
      `${pim}/products/${encodeURIComponent(sku)}/assets`,
    );
    expect(afterUnlink.body.map((a) => a.assetPath), 'the unlinked asset is still referenced')
      .to.not.include(assetPath);

    record({
      scenarioId: 'S6',
      scenario: 'links, updates and unlinks a DAM asset reference',
      operation: 'pim:asset-ref.lifecycle',
      target: `${sku} -> ${assetPath}`,
      api: 'link/list/update/unlink each verified against a re-read of the reference list',
      outcome: 'PASS',
    });
  });

  it('S7 records version history and restores a previous version', async () => {
    await call('PUT', `${pim}/products/${encodeURIComponent(sku)}`, {
      attributes: { tagline: 'version A' },
      userId: 'admin',
    });
    await call('PUT', `${pim}/products/${encodeURIComponent(sku)}`, {
      attributes: { tagline: 'version B' },
      userId: 'admin',
    });

    const history = await call<Array<{ versionNumber: number; attributes: Record<string, unknown> }>>(
      'GET',
      `${pim}/products/${productId}/versions`,
    );
    expect(history.status).to.equal(200);
    expect(history.body.length, 'history should hold a row per write').to.be.greaterThan(2);

    // Version numbers must be distinct — the collision this task fixed showed up here
    // first, as a duplicate key on (product_id, version_number).
    const numbers = history.body.map((v) => v.versionNumber);
    expect(new Set(numbers).size, `version numbers repeat: ${numbers.join(', ')}`)
      .to.equal(numbers.length);

    const versionA = history.body.find((v) => v.attributes?.tagline === 'version A');
    expect(versionA, 'no snapshot captured "version A"').to.not.equal(undefined);

    const restored = await call<{ attributes?: Record<string, unknown> }>(
      'POST',
      `${pim}/products/${productId}/versions/${versionA?.versionNumber}/restore?userId=admin`,
    );
    expect(restored.status, 'restoring a version failed').to.equal(200);

    const fetched = await call<{ attributes?: Record<string, unknown> }>(
      'GET',
      `${pim}/products/${encodeURIComponent(sku)}`,
    );
    expect(fetched.body.attributes?.tagline, 'the restore did not revert the attribute')
      .to.equal('version A');

    record({
      scenarioId: 'S7',
      scenario: 'records version history and restores a previous version',
      operation: 'pim:version.restore',
      target: sku,
      api: `history held ${history.body.length} distinct versions; restore reverted the attribute`,
      outcome: 'PASS',
    });
  });

  it('S8 carries a product forward, reports the delta, and merges inherited attributes', async () => {
    const target = await call<{ id?: string }>('POST', `${pim}/catalogs`, {
      name: `${runId} target catalog`,
      year: 2027,
      season: 'test',
      description: 'REB-23 carryforward target',
      schemaId,
      settings: {},
      userId: 'admin',
    });
    expect(target.status).to.equal(200);
    targetCatalogId = target.body.id as string;

    const carried = await call<{ carriedForward?: number }>('POST', `${pim}/products/carryforward`, {
      sourceCatalogId: catalogId,
      targetCatalogId,
      userId: 'admin',
    });
    expect(carried.status).to.equal(200);
    expect(carried.body.carriedForward, 'nothing was carried forward').to.be.greaterThan(0);

    const delta = await call<{
      sourceTotalCount: number;
      targetTotalCount: number;
      carriedForwardCount: number;
    }>('GET', `${pim}/products/carryforward/delta?sourceCatalogId=${catalogId}&targetCatalogId=${targetCatalogId}`);
    expect(delta.status).to.equal(200);
    expect(delta.body.carriedForwardCount, 'the delta report does not see the carried product')
      .to.be.greaterThan(0);
    expect(delta.body.sourceTotalCount).to.equal(delta.body.targetTotalCount);

    // Merging resolves inherited attributes onto the child and breaks the chain.
    const merged = await call<{ sourceProduct?: unknown }>(
      'POST',
      `${pim}/products/${encodeURIComponent(sku)}/merge-inherited?userId=admin`,
    );
    expect(merged.status, 'merging inherited attributes failed').to.equal(200);

    record({
      scenarioId: 'S8',
      scenario: 'carries a product forward, reports the delta, and merges inherited attributes',
      operation: 'pim:carryforward',
      target: `${catalogId} -> ${targetCatalogId}`,
      api: `carriedForward=${carried.body.carriedForward}; delta counts agree; merge-inherited 200`,
      outcome: 'PASS',
      notes: 'test catalogs only — the seeded lineup is never a carryforward source or target (AC4)',
    });
  });

  it('S9 infers a schema from an uploaded file and rejects a call missing its source type', async () => {
    // Deliberately tiny, and inference only: nothing is imported into a catalog, so
    // there is nothing for this to damage in a shared environment (AC4).
    const csv = 'sku,name,price\n' + `${runId}-A,Probe A,100\n` + `${runId}-B,Probe B,200\n`;

    const form = new FormData();
    form.append('file', new Blob([csv], { type: 'text/csv' }), 'probe.csv');

    const inferred = await fetch(`${pim}/imports/infer-schema?sourceType=csv`, {
      method: 'POST',
      body: form,
    });
    expect(inferred.status, 'schema inference failed').to.equal(200);
    const schema = (await inferred.json()) as { properties?: Record<string, unknown> };
    expect(Object.keys(schema.properties ?? {}), 'the inferred schema lost the CSV columns')
      .to.include.members(['sku', 'name', 'price']);

    // Omitting a required parameter is the caller's error, and used to answer 500.
    const missingType = await fetch(`${pim}/imports/infer-schema`, {
      method: 'POST',
      body: (() => {
        const f = new FormData();
        f.append('file', new Blob([csv], { type: 'text/csv' }), 'probe.csv');
        return f;
      })(),
    });
    expect(missingType.status, 'a missing required parameter should be 400').to.equal(400);

    record({
      scenarioId: 'S9',
      scenario: 'infers a schema from an uploaded file and rejects a call missing its source type',
      operation: 'pim:import.infer-schema',
      target: 'probe.csv (inference only, no import)',
      api: 'inferred sku/name/price; omitting sourceType answered 400',
      outcome: 'PASS',
    });
  });

  it('S10 records the state of product search and rendered integration', async () => {
    // --- search
    const search = await call<{ detail?: string }>(
      'GET',
      `${pim}/search?q=${encodeURIComponent(runId)}`,
    );

    if (search.status === 200) {
      record({
        scenarioId: 'S10a',
        scenario: 'product search returns the test product',
        operation: 'pim:search',
        target: runId,
        api: 'GET /pim/v1/search 200',
        outcome: 'PASS',
      });
    } else {
      blockers.push(
        'Product search is unavailable: GET /api/pim/v1/search answers ' +
          `${search.status}. Spring Boot 4.1 manages spring-data-elasticsearch 6.1, which ` +
          'brings elasticsearch-java 9.4.2, while docker-compose pins the server to ' +
          'elasticsearch:8.13.4 — the 9.x client sends a compatible-with=9 media type that ' +
          'an 8.x server rejects with media_type_header_exception. The pom still declares ' +
          '<elasticsearch.version>8.13.4</elasticsearch.version>, which no longer takes ' +
          'effect. Resolving it is a version decision: move the container to 9.x, or hold ' +
          'the client at 8.x and accept an older spring-data-elasticsearch.',
      );
      record({
        scenarioId: 'S10a',
        scenario: 'product search returns the test product',
        operation: 'pim:search',
        target: runId,
        api: `GET /pim/v1/search answered ${search.status}`,
        outcome: 'BLOCKED',
        notes: 'Elasticsearch client 9.4.2 against server 8.13.4 — a version decision, not a code defect',
      });
    }

    // Product writes must survive that outage, which is the point of the change made
    // under this task: indexing is best effort, authoring is not.
    const stillWrites = await call<{ status?: string }>(
      'PUT',
      `${pim}/products/${encodeURIComponent(sku)}`,
      { attributes: { tagline: 'written while search is down' }, userId: 'admin' },
    );
    expect(
      stillWrites.status,
      'a search outage must not stop a product being authored',
    ).to.equal(200);

    // --- rendered integration
    observations.push(
      'No TUT component consumes PIM data: the shared renderers and the site app contain ' +
        'no reference to /api/pim or a product SKU, so the spec\'s conditional rendered-' +
        'integration scenario has nothing to verify. Product data reaches pages only if a ' +
        'renderer is written for it.',
    );
    record({
      scenarioId: 'S10b',
      scenario: 'rendered integration for PIM-backed components',
      operation: 'pim:rendered-integration',
      target: 'site renderers',
      api: 'no renderer references /api/pim or a product SKU',
      outcome: 'PASS',
      notes: 'conditional in the spec ("if any TUT product component consumes PIM data") — it does not',
    });
  });
});
