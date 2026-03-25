import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FlexCmsClient, FlexCmsApiError } from '../client';
import type { PageResponse, NavigationItem, SearchResult, Asset } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

function makeClient(overrides?: Record<string, unknown>) {
  const mockFetch = vi.fn<[string, RequestInit], Promise<Response>>();
  const client = new FlexCmsClient({
    apiUrl: 'http://api.test',
    fetch: mockFetch as unknown as typeof globalThis.fetch,
    ...overrides,
  });
  return { client, mockFetch };
}

// ---------------------------------------------------------------------------
// FlexCmsClient — getPage
// ---------------------------------------------------------------------------

describe('FlexCmsClient.getPage', () => {
  it('calls the correct URL for a path', async () => {
    const { client, mockFetch } = makeClient();
    const page: PageResponse = {
      page: { path: '/about', title: 'About', description: '', template: 'default', locale: 'en', lastModified: '' },
      components: [],
    };
    mockFetch.mockResolvedValue(makeResponse(page));

    await client.getPage('/about');

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe('http://api.test/api/content/v1/pages/about');
  });

  it('strips leading slash from path', async () => {
    const { client, mockFetch } = makeClient();
    mockFetch.mockResolvedValue(makeResponse({}));

    await client.getPage('about'); // no leading slash

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/pages/about');
  });

  it('sends X-FlexCMS-Site header when site option provided', async () => {
    const { client, mockFetch } = makeClient();
    mockFetch.mockResolvedValue(makeResponse({}));

    await client.getPage('/home', { site: 'corporate' });

    const [, init] = mockFetch.mock.calls[0];
    expect((init?.headers as Record<string, string>)['X-FlexCMS-Site']).toBe('corporate');
  });

  it('sends X-FlexCMS-Locale header when locale option provided', async () => {
    const { client, mockFetch } = makeClient();
    mockFetch.mockResolvedValue(makeResponse({}));

    await client.getPage('/home', { locale: 'de' });

    const [, init] = mockFetch.mock.calls[0];
    expect((init?.headers as Record<string, string>)['X-FlexCMS-Locale']).toBe('de');
  });

  it('uses defaultSite and defaultLocale from config when options not provided', async () => {
    const { client, mockFetch } = makeClient({ defaultSite: 'brand', defaultLocale: 'fr' });
    mockFetch.mockResolvedValue(makeResponse({}));

    await client.getPage('/home');

    const [, init] = mockFetch.mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers['X-FlexCMS-Site']).toBe('brand');
    expect(headers['X-FlexCMS-Locale']).toBe('fr');
  });

  it('option overrides config default', async () => {
    const { client, mockFetch } = makeClient({ defaultSite: 'brand' });
    mockFetch.mockResolvedValue(makeResponse({}));

    await client.getPage('/home', { site: 'override' });

    const [, init] = mockFetch.mock.calls[0];
    expect((init?.headers as Record<string, string>)['X-FlexCMS-Site']).toBe('override');
  });

  it('throws FlexCmsApiError on non-2xx response', async () => {
    const { client, mockFetch } = makeClient();
    mockFetch.mockResolvedValue(makeResponse({ error: 'Not found' }, 404));

    await expect(client.getPage('/missing')).rejects.toThrow(FlexCmsApiError);
  });

  it('FlexCmsApiError contains status, statusText, url', async () => {
    const { client, mockFetch } = makeClient();
    mockFetch.mockResolvedValue(makeResponse({}, 500));

    const err = await client.getPage('/boom').catch((e) => e);

    expect(err).toBeInstanceOf(FlexCmsApiError);
    expect(err.status).toBe(500);
    expect(err.url).toContain('api.test');
  });

  it('includes custom headers from config in every request', async () => {
    const { client, mockFetch } = makeClient({ headers: { 'X-API-Key': 'secret' } });
    mockFetch.mockResolvedValue(makeResponse({}));

    await client.getPage('/home');

    const [, init] = mockFetch.mock.calls[0];
    expect((init?.headers as Record<string, string>)['X-API-Key']).toBe('secret');
  });
});

// ---------------------------------------------------------------------------
// FlexCmsClient — getNavigation
// ---------------------------------------------------------------------------

describe('FlexCmsClient.getNavigation', () => {
  it('calls correct URL with site, locale, and depth', async () => {
    const { client, mockFetch } = makeClient();
    const nav: NavigationItem[] = [{ title: 'Home', url: '/' }];
    mockFetch.mockResolvedValue(makeResponse(nav));

    await client.getNavigation('corporate', 'en', 2);

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe('http://api.test/api/content/v1/navigation/corporate/en?depth=2');
  });

  it('defaults depth to 3', async () => {
    const { client, mockFetch } = makeClient();
    mockFetch.mockResolvedValue(makeResponse([]));

    await client.getNavigation('corp', 'en');

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('depth=3');
  });
});

// ---------------------------------------------------------------------------
// FlexCmsClient — search
// ---------------------------------------------------------------------------

describe('FlexCmsClient.search', () => {
  it('includes query param q', async () => {
    const { client, mockFetch } = makeClient();
    const result: SearchResult = { totalCount: 0, items: [] };
    mockFetch.mockResolvedValue(makeResponse(result));

    await client.search('hello world');

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('q=hello+world');
  });

  it('includes optional site, locale, page, size params', async () => {
    const { client, mockFetch } = makeClient();
    mockFetch.mockResolvedValue(makeResponse({ totalCount: 0, items: [] }));

    await client.search('test', { site: 'corp', locale: 'en', page: 2, size: 20 });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('site=corp');
    expect(url).toContain('locale=en');
    expect(url).toContain('page=2');
    expect(url).toContain('size=20');
  });
});

// ---------------------------------------------------------------------------
// FlexCmsClient — getComponentRegistry
// ---------------------------------------------------------------------------

describe('FlexCmsClient.getComponentRegistry', () => {
  it('calls the component registry endpoint', async () => {
    const { client, mockFetch } = makeClient();
    mockFetch.mockResolvedValue(makeResponse({ components: [], version: '1', generatedAt: '' }));

    await client.getComponentRegistry();

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe('http://api.test/api/content/v1/component-registry');
  });
});

// ---------------------------------------------------------------------------
// FlexCmsClient — getAsset
// ---------------------------------------------------------------------------

describe('FlexCmsClient.getAsset', () => {
  it('calls the asset endpoint with given id', async () => {
    const { client, mockFetch } = makeClient();
    const asset: Asset = { id: 'abc', path: '/dam/logo.png', mimeType: 'image/png', renditions: [] };
    mockFetch.mockResolvedValue(makeResponse(asset));

    const result = await client.getAsset('abc');

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe('http://api.test/api/dam/abc');
    expect(result.id).toBe('abc');
  });
});

// ---------------------------------------------------------------------------
// FlexCmsApiError
// ---------------------------------------------------------------------------

describe('FlexCmsApiError', () => {
  it('has correct name and message', () => {
    const err = new FlexCmsApiError(404, 'Not Found', 'http://api.test/pages/x');
    expect(err.name).toBe('FlexCmsApiError');
    expect(err.message).toContain('404');
    expect(err.message).toContain('Not Found');
    expect(err.message).toContain('http://api.test/pages/x');
  });

  it('is an instance of Error', () => {
    const err = new FlexCmsApiError(500, 'Internal Server Error', 'http://x');
    expect(err).toBeInstanceOf(Error);
  });
});
