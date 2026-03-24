'use client';

import { useState, useEffect } from 'react';
import type { PageResponse } from '@flexcms/sdk';
import { useFlexCms } from './FlexCmsProvider';

export interface UseFlexCmsPageOptions {
  site?: string;
  locale?: string;
}

export interface UseFlexCmsPageResult {
  pageData: PageResponse | null;
  loading: boolean;
  error: Error | null;
}

/**
 * React hook that fetches a CMS page on the client side.
 * For SSR, prefer fetching in getServerSideProps / Server Components and passing pageData directly.
 *
 * @example
 * ```tsx
 * function AboutPage() {
 *   const { pageData, loading, error } = useFlexCmsPage('/about');
 *   if (loading) return <Spinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *   return <FlexCmsPage pageData={pageData!} />;
 * }
 * ```
 */
export function useFlexCmsPage(
  path: string,
  options?: UseFlexCmsPageOptions
): UseFlexCmsPageResult {
  const { client } = useFlexCms();
  const [pageData, setPageData] = useState<PageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    client
      .getPage(path, options)
      .then((data) => {
        if (!cancelled) {
          setPageData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [path, options?.site, options?.locale]);

  return { pageData, loading, error };
}

