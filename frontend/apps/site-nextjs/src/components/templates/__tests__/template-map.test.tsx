import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import templateContracts from '../../../../../../../Design/tut-usa/generated/template-contracts.json';
import { DefaultTemplate, templateMap } from '../template-map';
import { GlobalHomePageTemplate } from '../GlobalHomePageTemplate';
import { StandardPageTemplate } from '../StandardPageTemplate';

vi.mock('@flexcms/react', () => {
  const FlexCmsPage = ({ pageData }: { pageData: { page: { template: string } } }) => (
    <div data-testid="flex-page" data-template={pageData.page.template} />
  );

  const Navigation = () => <nav data-testid="injected-navigation" />;
  const Footer = () => <footer data-testid="injected-footer" />;

  return {
    FlexCmsPage,
    useFlexCms: () => ({
      mapper: {
        resolve: (resourceType: string) => {
          if (resourceType === 'tut-usa/navigation-search-discovery/navigation') {
            return Navigation;
          }
          if (resourceType === 'tut-usa/navigation-search-discovery/footer') {
            return Footer;
          }
          return undefined;
        },
      },
    }),
  };
});

type MockPageData = {
  page: { template: string };
  components: Array<{ resourceType: string }>;
};

function makePageData(template: string, resourceTypes: string[] = []): MockPageData {
  return {
    page: { template },
    components: resourceTypes.map((resourceType) => ({ resourceType })),
  };
}

describe('template-map', () => {
  it('maps every generated template contract name to a template component', () => {
    const contractNames = (templateContracts as Array<{ name?: string }>)
      .map((template) => template.name)
      .filter((name): name is string => Boolean(name));

    expect(contractNames.length).toBeGreaterThan(0);
    for (const name of contractNames) {
      expect(templateMap[name], `missing template mapping for ${name}`).toBeDefined();
    }
  });

  it('keeps compatibility aliases for older naming variants', () => {
    expect(templateMap['model-overview-lineup-landing-page']).toBe(StandardPageTemplate);
    expect(templateMap['book-test-drive-page']).toBe(StandardPageTemplate);
    expect(templateMap['tut-sovereign-brand-page']).toBe(StandardPageTemplate);
  });

  it('uses specific template components for home and standard pages', () => {
    expect(templateMap['global-home-page']).toBe(GlobalHomePageTemplate);
    expect(templateMap['brand-story-about-tut-page']).toBe(StandardPageTemplate);
    expect(templateMap.default).toBe(DefaultTemplate);
  });
});

describe('template components', () => {
  it('injects navigation/footer for standard pages when missing from authored components', () => {
    render(<StandardPageTemplate pageData={makePageData('brand-story-about-tut-page') as never} />);

    expect(screen.getByTestId('injected-navigation')).toBeInTheDocument();
    expect(screen.getByTestId('injected-footer')).toBeInTheDocument();
    expect(screen.getByTestId('flex-page')).toHaveAttribute('data-template', 'brand-story-about-tut-page');
  });

  it('does not inject navigation/footer when already authored for standard pages', () => {
    render(
      <StandardPageTemplate
        pageData={
          makePageData('brand-story-about-tut-page', [
            'tut-usa/navigation-search-discovery/navigation',
            'tut-usa/navigation-search-discovery/footer',
          ]) as never
        }
      />
    );

    expect(screen.queryByTestId('injected-navigation')).not.toBeInTheDocument();
    expect(screen.queryByTestId('injected-footer')).not.toBeInTheDocument();
  });

  it('injects navigation/footer for global home pages when missing from authored components', () => {
    render(<GlobalHomePageTemplate pageData={makePageData('global-home-page') as never} />);

    expect(screen.getByTestId('injected-navigation')).toBeInTheDocument();
    expect(screen.getByTestId('injected-footer')).toBeInTheDocument();
    expect(screen.getByTestId('flex-page')).toHaveAttribute('data-template', 'global-home-page');
  });
});

