import { test as base, expect, request } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { env } from '../env';

/**
 * Fixtures for tests that talk to the real backend (levels `api` and `e2e`).
 *
 *   import { test, expect } from '../../src/fixtures/api.fixture';
 *
 *   test('ECMS-01-TC01 creates a tag', { tag: ['@ECMS-01'] }, async ({ authorApi }) => {
 *     const res = await authorApi.post('/api/author/tags', { data: { ... } });
 *     expect(res.status()).toBe(201);
 *   });
 *
 * Nothing here is mocked: a stopped backend must make these tests fail.
 */
type ApiFixtures = {
  /** Request context bound to the Author tier root (`AUTHOR_URL`). */
  authorApi: APIRequestContext;
  /** Request context bound to the Publish tier root (`PUBLISH_URL`). */
  publishApi: APIRequestContext;
};

async function newContext(baseURL: string): Promise<APIRequestContext> {
  return request.newContext({
    baseURL,
    extraHTTPHeaders: { Accept: 'application/json' },
  });
}

export const test = base.extend<ApiFixtures>({
  authorApi: async ({}, use) => {
    const ctx = await newContext(env.authorUrl);
    await use(ctx);
    await ctx.dispose();
  },
  publishApi: async ({}, use) => {
    const ctx = await newContext(env.publishUrl);
    await use(ctx);
    await ctx.dispose();
  },
});

export { expect };
