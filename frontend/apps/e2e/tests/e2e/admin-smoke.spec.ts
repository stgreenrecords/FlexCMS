import { test, expect } from '../../src/fixtures/api.fixture';
import { ContentTreePage } from '../../src/pages/ContentTreePage';

/**
 * Level: e2e — real Admin UI + real Author backend, no mocks.
 *
 * Reference example for full-stack journeys: read (or create) the expected state
 * through the API fixture, drive the UI, then assert the UI and — for writes —
 * the backend result. A stopped backend must make this test fail.
 */
test.describe('Admin smoke (full stack)', () => {
  test('Content Tree lists the root nodes returned by the Author API', { tag: ['@smoke'] }, async ({ page, authorApi }) => {
    const res = await authorApi.get('/api/author/content/children', { params: { path: 'content' } });
    expect(res.status()).toBe(200);
    const roots: Array<{ name: string }> = await res.json();
    expect(roots.length).toBeGreaterThan(0);

    const tree = new ContentTreePage(page);
    await tree.goto();

    for (const root of roots) {
      await expect(tree.rowByName(root.name)).toBeVisible();
    }
  });
});
