import React from 'react';
import { FlexCmsPage, useFlexCms } from '@flexcms/react';
import { TemplateProps } from './template-map';

export const GlobalHomePageTemplate = ({ pageData }: TemplateProps) => {
  const { mapper } = useFlexCms();
  const Navigation = mapper.resolve('tut-usa/navigation-search-discovery/navigation');
  const Footer = mapper.resolve('tut-usa/navigation-search-discovery/footer');

  const hasNavigation = pageData.components.some(c => c.resourceType === 'tut-usa/navigation-search-discovery/navigation');
  const hasFooter = pageData.components.some(c => c.resourceType === 'tut-usa/navigation-search-discovery/footer');

  return (
    <>
      {!hasNavigation && Navigation && <Navigation data={{}} />}
      <FlexCmsPage pageData={pageData} />
      {!hasFooter && Footer && <Footer data={{}} />}
    </>
  );
};


