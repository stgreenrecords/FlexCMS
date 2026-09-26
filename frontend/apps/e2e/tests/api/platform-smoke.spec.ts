import { test, expect } from '../../src/fixtures/api.fixture';

/**
 * Level: api — real Author and Publish tiers, no mocks.
 *
 * Reference example for API-level tests: use the `authorApi` / `publishApi`
 * fixtures, assert status codes and response bodies, never mock.
 */
test.describe('Platform smoke (live backend)', () => {
  test('author tier reports UP', { tag: ['@smoke'] }, async ({ authorApi }) => {
    const res = await authorApi.get('/actuator/health');
    expect(res.status()).toBe(200);
    expect((await res.json()).status).toBe('UP');
  });

  test('publish tier reports UP', { tag: ['@smoke'] }, async ({ publishApi }) => {
    const res = await publishApi.get('/actuator/health');
    expect(res.status()).toBe(200);
    expect((await res.json()).status).toBe('UP');
  });

  test('component registry returns a data schema for every component', async ({ authorApi }) => {
    const res = await authorApi.get('/api/content/v1/component-registry');
    expect(res.status()).toBe(200);

    const body: { components: Array<{ resourceType: string; dataSchema: unknown }> } = await res.json();
    expect(body.components.length).toBeGreaterThan(0);
    for (const component of body.components) {
      expect(component.resourceType).toBeTruthy();
      expect(component.dataSchema, `${component.resourceType} has no dataSchema`).toBeTruthy();
    }
  });
});
