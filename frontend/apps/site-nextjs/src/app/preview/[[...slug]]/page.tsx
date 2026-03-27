import { FlexCmsClient } from '@flexcms/sdk';
import { CmsPageClient } from '../../[[...slug]]/CmsPageClient';

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
  const path = params.slug ? `/${params.slug.join('/')}` : '/homepage';

  const apiUrl = process.env.FLEXCMS_API_URL ?? 'http://localhost:8080';
  const defaultSite = process.env.FLEXCMS_DEFAULT_SITE ?? 'corporate';
  const defaultLocale = process.env.FLEXCMS_DEFAULT_LOCALE ?? 'en';

  const client = new FlexCmsClient({ apiUrl, defaultSite, defaultLocale });

  try {
    const pageData = await client.getPage(path);
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
