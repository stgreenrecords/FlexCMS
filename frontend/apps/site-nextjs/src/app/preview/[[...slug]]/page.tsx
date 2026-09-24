import { FlexCmsClient } from '@flexcms/sdk';
import { CmsPageClient } from '../../[[...slug]]/CmsPageClient';
import { normalizePageAssetUrls } from '../../lib/normalizeAssetUrls';
import { previewApiUrl, publicApiUrl as resolvePublicApiUrl } from '../../../../apiBases';

/**
 * Draft preview route — /preview/...
 *
 * Renders content from the author API (port 8080) with no caching,
 * so editors always see the latest saved draft state.
 *
 * Accessed from the admin preview page when mode=draft.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PreviewPage({ params }: { params: { slug?: string[] } }) {
  const defaultSite = process.env.FLEXCMS_DEFAULT_SITE ?? 'tut-usa';
  const defaultLocale = process.env.FLEXCMS_DEFAULT_LOCALE ?? 'en';
  const path = params.slug ? `/${params.slug.join('/')}` : `/${defaultSite}/${defaultLocale}/home`;

  const apiUrl = previewApiUrl();
  const publicApiUrl = resolvePublicApiUrl();

  const client = new FlexCmsClient({ apiUrl, defaultSite, defaultLocale });

  try {
    // 'preview' routes asset URLs through /draft-dam/renditions, which proxies to author,
    // so assets that are not published yet still show in a draft.
    const pageData = normalizePageAssetUrls(await client.getPage(path), 'preview');
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-2xl font-bold">Preview not available</h1>
        <p className="text-muted-foreground text-sm">
          No content found at <code className="font-mono bg-muted px-1 rounded">{path}</code>.
          The page may not exist yet or may have unsaved changes.
        </p>
      </div>
    );
  }
}
