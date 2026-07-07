'use client';

import { FlexCmsClient, type PageResponse } from '@flexcms/sdk';
import { FlexCmsProvider, FlexCmsPage } from '@flexcms/react';
import { componentMap } from '../../components/component-map';
import { NavigationRenderer, FooterRenderer } from '../../components/homepageRenderers';

interface CmsPageClientProps {
  pageData: PageResponse;
  apiUrl: string;
  defaultSite: string;
  defaultLocale: string;
}

const clientCache = new Map<string, FlexCmsClient>();

function getClient(apiUrl: string, defaultSite: string, defaultLocale: string): FlexCmsClient {
  const key = `${apiUrl}|${defaultSite}|${defaultLocale}`;
  if (!clientCache.has(key)) {
    clientCache.set(key, new FlexCmsClient({ apiUrl, defaultSite, defaultLocale }));
  }
  return clientCache.get(key)!;
}

export function CmsPageClient({ pageData, apiUrl, defaultSite, defaultLocale }: CmsPageClientProps) {
  const client = getClient(apiUrl, defaultSite, defaultLocale);
  const resourceTypes = new Set(pageData.components.map((component) => component.resourceType));
  const isGlobalHome = pageData.page.template === 'global-home-page';
  const hasNavigation = resourceTypes.has('tut-usa/navigation-search-discovery/navigation');
  const hasFooter = resourceTypes.has('tut-usa/navigation-search-discovery/footer');

  return (
    <FlexCmsProvider client={client} componentMap={componentMap}>
      {isGlobalHome && !hasNavigation ? <NavigationRenderer data={{}} resourceType="tut-usa/navigation-search-discovery/navigation" /> : null}
      <FlexCmsPage pageData={pageData} />
      {isGlobalHome && !hasFooter ? <FooterRenderer data={{}} resourceType="tut-usa/navigation-search-discovery/footer" /> : null}
    </FlexCmsProvider>
  );
}
