'use client';

import { FlexCmsClient, type PageResponse } from '@flexcms/sdk';
import { FlexCmsProvider, FlexCmsPage } from '@flexcms/react';
import { componentMap } from '../../components/component-map';

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
  return (
    <FlexCmsProvider client={client} componentMap={componentMap}>
      <FlexCmsPage pageData={pageData} />
    </FlexCmsProvider>
  );
}
