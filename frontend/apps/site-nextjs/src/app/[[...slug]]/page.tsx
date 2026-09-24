import { FlexCmsClient } from '@flexcms/sdk';
import { CmsPageClient } from './CmsPageClient';
import { normalizePageAssetUrls } from '../lib/normalizeAssetUrls';
import { liveApiUrl, publicApiUrl as resolvePublicApiUrl } from '../../../apiBases';

// Public CMS pages must always render latest author/publish payloads.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  const path = params.slug ? `/${params.slug.join('/')}` : `/${defaultSite}/home`;

  // Same resolution the `/dam/renditions` proxy uses (apiBases.js), so assets come from
  // the tier the page came from.
  const apiUrl = liveApiUrl();
  const publicApiUrl = resolvePublicApiUrl();

  const client = new FlexCmsClient({ apiUrl, defaultSite, defaultLocale });

  try {
    const pageData = normalizePageAssetUrls(await client.getPage(path), 'live');
    return (
      <CmsPageClient
        pageData={pageData}
        apiUrl={publicApiUrl}
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
