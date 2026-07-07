import React from 'react';
import { PageResponse } from '@flexcms/sdk';
import { FlexCmsPage, useFlexCms } from '@flexcms/react';
import { GlobalHomePageTemplate } from './GlobalHomePageTemplate';
import { StandardPageTemplate } from './StandardPageTemplate';

export interface TemplateProps {
  pageData: PageResponse;
}

export const DefaultTemplate = ({ pageData }: TemplateProps) => {
  return <FlexCmsPage pageData={pageData} />;
};

export const templateMap: Record<string, React.ComponentType<TemplateProps>> = {
  'default': DefaultTemplate,
  'global-home-page': GlobalHomePageTemplate,
  'brand-story-about-tut-page': StandardPageTemplate,
  'model-overview-lineup-landing-page': StandardPageTemplate,
  'vehicle-model-detail-page': StandardPageTemplate,
  'build-configure-page': StandardPageTemplate,
  'compare-models-page': StandardPageTemplate,
  'innovation-hub-page': StandardPageTemplate,
  'innovation-feature-detail-page': StandardPageTemplate,
  'news-updates-landing-page': StandardPageTemplate,
  'news-press-article-detail-page': StandardPageTemplate,
  'owners-hub-landing-page': StandardPageTemplate,
  'owner-manual-technical-documentation-page': StandardPageTemplate,
  'service-maintenance-page': StandardPageTemplate,
  'dealer-showroom-locator-page': StandardPageTemplate,
  'book-test-drive-page': StandardPageTemplate,
  'offers-financing-leasing-page': StandardPageTemplate,
  'accessories-lifestyle-collection-page': StandardPageTemplate,
  'learning-education-hub-page': StandardPageTemplate,
  'safety-charging-ownership-how-to-page': StandardPageTemplate,
  'contact-concierge-support-page': StandardPageTemplate,
  'tut-sovereign-brand-page': StandardPageTemplate,
};




