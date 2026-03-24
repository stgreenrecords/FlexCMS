import { FlexCmsClient } from '@flexcms/sdk';
import { FlexCmsProvider, FlexCmsPage } from '@flexcms/react';
import { componentMap } from '../components/component-map';

/**
 * Catch-all page route — fetches CMS content via @flexcms/sdk
 * and renders using @flexcms/react. Zero HTML comes from the backend.
 *
 * This is the reference implementation showing how Next.js SSR works
 * with FlexCMS. The same pattern applies to any page route.
 */
export default async function CmsPage({ params }: { params: { slug?: string[] } }) {
  const path = params.slug ? `/${params.slug.join('/')}` : '/homepage';

  const client = new FlexCmsClient({
    apiUrl: process.env.FLEXCMS_API_URL ?? 'http://localhost:8080',
    defaultSite: process.env.FLEXCMS_DEFAULT_SITE ?? 'corporate',
    defaultLocale: process.env.FLEXCMS_DEFAULT_LOCALE ?? 'en',
  });

  try {
    const pageData = await client.getPage(path);

    return (
      <FlexCmsProvider client={client} componentMap={componentMap}>
        <FlexCmsPage pageData={pageData} />
      </FlexCmsProvider>
    );
  } catch {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold">Page not found</h1>
      </div>
    );
  }
}

