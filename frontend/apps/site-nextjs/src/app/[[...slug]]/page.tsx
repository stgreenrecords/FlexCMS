import { FlexCmsClient } from '@flexcms/sdk';
import { CmsPageClient } from './CmsPageClient';
import { normalizePageAssetUrls } from '../lib/normalizeAssetUrls';

/**
 * Catch-all page route — fetches CMS content server-side via @flexcms/sdk
 * and passes the data to a client component for rendering.
 *
 * Server component: data fetching, SSR
 * Client component (CmsPageClient): FlexCMS context, component tree rendering
 */
export default async function CmsPage({ params }: { params: { slug?: string[] } }) {
  const defaultSite = process.env.FLEXCMS_DEFAULT_SITE ?? 'tut-usa';
  const defaultLocale = process.env.FLEXCMS_DEFAULT_LOCALE ?? 'en';
  const path = params.slug ? `/${params.slug.join('/')}` : `/${defaultSite}/${defaultLocale}/home`;

  const apiUrl = process.env.FLEXCMS_API_URL ?? 'http://localhost:8080';

  const client = new FlexCmsClient({ apiUrl, defaultSite, defaultLocale });

  try {
    const pageData = normalizePageAssetUrls(await client.getPage(path));
    return (
      <CmsPageClient
        pageData={pageData}
        apiUrl={apiUrl}
        defaultSite={defaultSite}
        defaultLocale={defaultLocale}
      />
    );
  } catch {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold">Page not found</h1>
      </div>
    );
  }
}
