import React from 'react';
import { PageResponse } from '@flexcms/sdk';
import { FlexCmsPage } from '@flexcms/react';
import templateContracts from '../../../../../../Design/tut-usa/generated/template-contracts.json';
import { GlobalHomePageTemplate } from './GlobalHomePageTemplate';
import { StandardPageTemplate } from './StandardPageTemplate';

export interface TemplateProps {
  pageData: PageResponse;
}

export const DefaultTemplate = ({ pageData }: TemplateProps) => {
  return <FlexCmsPage pageData={pageData} />;
};

interface TemplateContract {
  name?: string;
}

const canonicalTemplateEntries = (templateContracts as TemplateContract[]).reduce<Record<string, React.ComponentType<TemplateProps>>>(
  (entries, contract) => {
    if (!contract.name) {
      return entries;
    }

    entries[contract.name] = contract.name === 'global-home-page' ? GlobalHomePageTemplate : StandardPageTemplate;
    return entries;
  },
  {}
);

const templateAliases: Record<string, React.ComponentType<TemplateProps>> = {
  // Compatibility aliases kept for older seeds/docs naming while contracts converge.
  'model-overview-lineup-landing-page': StandardPageTemplate,
  'book-test-drive-page': StandardPageTemplate,
  'tut-sovereign-brand-page': StandardPageTemplate,
};

export const templateMap: Record<string, React.ComponentType<TemplateProps>> = {
  default: DefaultTemplate,
  ...canonicalTemplateEntries,
  ...templateAliases,
};




