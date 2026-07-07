'use client';

import { FlexCmsClient, type PageResponse } from '@flexcms/sdk';
import { FlexCmsProvider } from '@flexcms/react';
import { componentMap } from '../../components/component-map';
import { templateMap, DefaultTemplate } from '../../components/templates/template-map';
import React from 'react';

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

  const TemplateComponent = templateMap[pageData.page.template] || DefaultTemplate;

  return (
    <FlexCmsProvider client={client} componentMap={componentMap}>
      <TemplateComponent pageData={pageData} />
    </FlexCmsProvider>
  );
}
