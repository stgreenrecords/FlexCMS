import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { FlexCmsProvider, type FlexCmsRenderer } from '../FlexCmsProvider';
import { useFlexCmsPage } from '../useFlexCmsPage';
import { FlexCmsClient, ComponentMapper, FlexCmsApiError } from '@flexcms/sdk';
import type { PageResponse } from '@flexcms/sdk';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_PAGE: PageResponse = {
  page: {
    path: '/about',
    title: 'About',
    description: '',
    template: 'default',
    locale: 'en',
    lastModified: '2024-01-01',
  },
  components: [],
};

function makeWrapper(mockGetPage: ReturnType<typeof vi.fn>) {
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(MOCK_PAGE),
  } as unknown as Response);

  const client = new FlexCmsClient({
    apiUrl: 'http://api.test',
    fetch: mockFetch as unknown as typeof globalThis.fetch,
  });

  // Directly override getPage to avoid needing a running server
  (client as any).getPage = mockGetPage;

  const mapper = new ComponentMapper<FlexCmsRenderer>();

  return ({ children }: { children: React.ReactNode }) => (
    <FlexCmsProvider client={client} componentMap={mapper}>
      {children}
    </FlexCmsProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useFlexCmsPage', () => {
  it('returns loading:true and no data initially', () => {
    const mockGetPage = vi.fn().mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useFlexCmsPage('/about'), {
      wrapper: makeWrapper(mockGetPage),
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.pageData).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('sets pageData and loading:false on successful fetch', async () => {
    const mockGetPage = vi.fn().mockResolvedValue(MOCK_PAGE);
    const { result } = renderHook(() => useFlexCmsPage('/about'), {
      wrapper: makeWrapper(mockGetPage),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.pageData).toEqual(MOCK_PAGE);
    expect(result.current.error).toBeNull();
  });

  it('sets error and loading:false on fetch failure', async () => {
    const mockGetPage = vi.fn().mockRejectedValue(
      new FlexCmsApiError(404, 'Not Found', 'http://api.test/pages/about')
    );
    const { result } = renderHook(() => useFlexCmsPage('/about'), {
      wrapper: makeWrapper(mockGetPage),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.pageData).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain('404');
  });

  it('calls getPage with the provided path', async () => {
    const mockGetPage = vi.fn().mockResolvedValue(MOCK_PAGE);
    renderHook(() => useFlexCmsPage('/about'), { wrapper: makeWrapper(mockGetPage) });

    await waitFor(() => expect(mockGetPage).toHaveBeenCalled());
    expect(mockGetPage).toHaveBeenCalledWith('/about', undefined);
  });

  it('passes site and locale options to getPage', async () => {
    const mockGetPage = vi.fn().mockResolvedValue(MOCK_PAGE);
    renderHook(
      () => useFlexCmsPage('/about', { site: 'corporate', locale: 'de' }),
      { wrapper: makeWrapper(mockGetPage) }
    );

    await waitFor(() => expect(mockGetPage).toHaveBeenCalled());
    expect(mockGetPage).toHaveBeenCalledWith(
      '/about',
      expect.objectContaining({ site: 'corporate', locale: 'de' })
    );
  });

  it('re-fetches when path changes', async () => {
    const mockGetPage = vi.fn().mockResolvedValue(MOCK_PAGE);
    const { result, rerender } = renderHook(
      ({ path }: { path: string }) => useFlexCmsPage(path),
      {
        wrapper: makeWrapper(mockGetPage),
        initialProps: { path: '/about' },
      }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockGetPage).toHaveBeenCalledTimes(1);

    rerender({ path: '/contact' });
    await waitFor(() => expect(mockGetPage).toHaveBeenCalledTimes(2));
    expect(mockGetPage).toHaveBeenLastCalledWith('/contact', undefined);
  });

  it('wraps non-Error rejections in an Error', async () => {
    const mockGetPage = vi.fn().mockRejectedValue('plain string error');
    const { result } = renderHook(() => useFlexCmsPage('/about'), {
      wrapper: makeWrapper(mockGetPage),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('plain string error');
  });
});
