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
      <main className="mx-auto w-full max-w-[1440px] px-4 py-4 sm:px-6 lg:px-10">
        <FlexCmsPage pageData={pageData} />
      </main>
      {!hasFooter && Footer && <Footer data={{}} />}
    </>
  );
};


