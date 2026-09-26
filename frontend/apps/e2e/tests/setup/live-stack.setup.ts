import { test as setup, expect, request } from '@playwright/test';
import { env } from '../../src/env';

/**
 * Runs before the live projects (ui-live, api, e2e). It fails fast, with an
 * actionable message, instead of letting every test fail for the same reason.
 */
setup('live stack is enabled and reachable', async () => {
  expect(
    env.liveApi,
    'Live projects must run with USE_LIVE_API=true, otherwise UI specs silently use mocks. ' +
      'Use `pnpm test:live`, `pnpm test:api` or `pnpm test:e2e`.',
  ).toBe(true);

  const ctx = await request.newContext();
  try {
    for (const [name, url] of [
      ['Author', `${env.authorUrl}/actuator/health`],
      ['Publish', `${env.publishUrl}/actuator/health`],
    ] as const) {
      const res = await ctx.get(url, { timeout: 10_000 }).catch(() => null);
      expect(res?.ok(), `${name} is not reachable at ${url} — start the stack with \`flex start local all\`.`).toBe(true);
    }
  } finally {
    await ctx.dispose();
  }
});
