import { FlexCmsClient } from '@flexcms/sdk';

/**
 * Server-side FlexCMS client for the Admin UI.
 * Used in Next.js Server Components and server actions.
 */
export function createServerClient() {
  return new FlexCmsClient({
    apiUrl: process.env.FLEXCMS_API_URL ?? 'http://localhost:8080',
    defaultSite: process.env.FLEXCMS_DEFAULT_SITE ?? 'corporate',
    defaultLocale: process.env.FLEXCMS_DEFAULT_LOCALE ?? 'en',
  });
}

import { getApiBase } from './apiBase';

/**
 * Client-side FlexCMS client config.
 * Used in React Query hooks and client components.
 */
export const clientConfig = {
  apiUrl: process.env.NEXT_PUBLIC_FLEXCMS_API_URL ?? getApiBase(),
  defaultSite: process.env.NEXT_PUBLIC_FLEXCMS_DEFAULT_SITE ?? 'corporate',
  defaultLocale: process.env.NEXT_PUBLIC_FLEXCMS_DEFAULT_LOCALE ?? 'en',
};

