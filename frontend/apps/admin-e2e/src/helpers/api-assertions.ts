/**
 * API call assertion helpers.
 *
 * Use these in tests to verify that the correct API endpoint was called
 * with the expected parameters and/or request body.
 */
import type { Page, Request } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Wait for a specific API URL pattern to be requested and return it.
 */
export async function waitForApiCall(
  page: Page,
  urlPattern: string | RegExp,
  options: { method?: string; timeout?: number } = {},
): Promise<Request> {
  const { method = 'GET', timeout = 10_000 } = options;
  return page.waitForRequest(
    (req) => {
      const matchUrl =
        typeof urlPattern === 'string'
          ? req.url().includes(urlPattern)
          : urlPattern.test(req.url());
      const matchMethod = req.method() === method;
      return matchUrl && matchMethod;
    },
    { timeout },
  );
}

/**
 * Assert that an API endpoint was called with a specific JSON body property.
 */
export async function assertApiCalledWith(
  page: Page,
  urlPattern: string | RegExp,
  expectedBodySubset: Record<string, unknown>,
  options: { method?: string } = {},
): Promise<void> {
  const req = await waitForApiCall(page, urlPattern, { ...options, method: options.method ?? 'POST' });
  const body = req.postDataJSON() as Record<string, unknown>;
  for (const [key, value] of Object.entries(expectedBodySubset)) {
    expect(body[key]).toEqual(value);
  }
}

/**
 * Collect all API requests matching a URL pattern during page navigation.
 */
export function collectApiRequests(
  page: Page,
  urlPattern: string | RegExp,
): { requests: Request[]; stop: () => void } {
  const requests: Request[] = [];
  const handler = (req: Request) => {
    const matchUrl =
      typeof urlPattern === 'string'
        ? req.url().includes(urlPattern)
        : urlPattern.test(req.url());
    if (matchUrl) requests.push(req);
  };
  page.on('request', handler);
  return {
    requests,
    stop: () => page.off('request', handler),
  };
}

