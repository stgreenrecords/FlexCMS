/**
 * Reference site component map — registers React renderers for each CMS component type.
 * This is where the frontend team maps backend resourceTypes to React components.
 *
 * The backend team defines the data schema (the contract).
 * The frontend team builds the renderer (this file).
 * Neither side touches the other's code.
 */
'use client';

import React from 'react';
import { ComponentMapper } from '@flexcms/sdk';
import componentContracts from '../../../../../Design/tut-usa/generated/component-contracts.json';
import { buildTutRendererEntries, defaultTutRenderer, type TutComponentContract } from './tutGroupedRenderers';
import {
  CampaignHeroRenderer,
  FeaturedContentRenderer,
  FeatureListRenderer,
  FooterRenderer,
  HeroBannerRenderer,
  LatestNewsRenderer,
  NavigationRenderer,
  PageMetadataRenderer,
  ProductGridRenderer,
  DealerLocatorRenderer,
  NewsletterSignupRenderer,
} from './homepageRenderers';
import { PageHeaderRenderer, ProductHeroRenderer } from './tutPriorityRenderers';
import { OfferCardRenderer, PlanCardRenderer, PricingTableRenderer } from './tutCampaignRenderers';
import { CourseCardRenderer, CourseCatalogRenderer, FaqRenderer, ResourceListRenderer } from './tutLearningRenderers';
import {
  CategoryGridRenderer,
  ComparisonToolRenderer,
  CtaButtonRenderer,
  FilterPanelRenderer,
  ProductCardRenderer,
  SortControlRenderer,
} from './tutVehiclesRenderers';

function RichText({ data }: { data: Record<string, unknown> }) {
  return (
    <div
      className="prose max-w-none"
      dangerouslySetInnerHTML={{ __html: (data.content as string) ?? '' }}
    />
  );
}

function Image({ data }: { data: Record<string, unknown> }) {
  return (
    <figure>
      <img
        src={(data.src as string) ?? ''}
        alt={(data.alt as string) ?? ''}
        width={typeof data.width === 'number' ? data.width : undefined}
        height={typeof data.height === 'number' ? data.height : undefined}
        loading="lazy"
      />
      {data.caption != null && <figcaption>{String(data.caption)}</figcaption>}
    </figure>
  );
}

function Container({ data, children }: { data: Record<string, unknown>; children?: React.ReactNode }) {
  const layout = (data.layout as string) ?? 'single';
  const layoutClass = {
    single: '',
    'two-equal': 'grid grid-cols-1 gap-6 md:grid-cols-2',
    'three-equal': 'grid grid-cols-1 gap-6 md:grid-cols-3',
  }[layout] ?? '';

  return <div className={layoutClass}>{children}</div>;
}

const ContractFallback = ({ data, resourceType, name }: { data: Record<string, unknown>; resourceType?: string; name?: string }) => (
  <section
    data-flexcms-unimplemented={resourceType ?? 'unknown'}
    style={{
      backgroundColor: 'var(--color-surface-container-low)',
      border: '1px dashed var(--color-outline)',
      borderRadius: '8px',
      color: 'var(--color-on-surface-variant)',
      margin: '0.75rem 0',
      padding: '1rem',
    }}
  >
    <p style={{ fontWeight: 700, margin: 0 }}>Renderer pending: {resourceType ?? 'unknown'}</p>
    {name ? <p style={{ margin: '0.25rem 0 0.5rem' }}>Component: {name}</p> : null}
    <pre style={{ fontSize: '0.75rem', margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(data, null, 2)}</pre>
  </section>
);

const tutRendererEntries = buildTutRendererEntries(componentContracts as TutComponentContract[]);
const DefaultTutRenderer = defaultTutRenderer;

const TutAwareFallback = (props: { data: Record<string, unknown>; resourceType?: string; name?: string; children?: React.ReactNode }) => {
  if (props.resourceType === 'flexcms/page' || props.resourceType?.startsWith('tut-usa/')) {
    return <DefaultTutRenderer {...props} />;
  }
  return <ContractFallback {...props} />;
};

export const componentMap = new ComponentMapper<React.ComponentType<{ data: Record<string, unknown>; resourceType?: string; name?: string; children?: React.ReactNode }>>()
  .registerAll(tutRendererEntries)
  .registerAll({
    'flexcms/rich-text': RichText,
    'flexcms/image': Image,
    'flexcms/container': Container,
    'tut-usa/layout-page-structure/page-metadata': PageMetadataRenderer,
    'tut-usa/navigation-search-discovery/navigation': NavigationRenderer,
    'tut-usa/calls-to-action-promotions-campaigns/hero-banner': HeroBannerRenderer,
    'tut-usa/calls-to-action-promotions-campaigns/campaign-hero': CampaignHeroRenderer,
    'tut-usa/commerce-catalog-merchandising/product-grid': ProductGridRenderer,
    'tut-usa/editorial-article-content/feature-list': FeatureListRenderer,
    'tut-usa/calls-to-action-promotions-campaigns/featured-content': FeaturedContentRenderer,
    'tut-usa/editorial-article-content/latest-news': LatestNewsRenderer,
    'tut-usa/navigation-search-discovery/footer': FooterRenderer,
    'tut-usa/location-local-physical-presence/dealer-locator': DealerLocatorRenderer,
    'tut-usa/calls-to-action-promotions-campaigns/newsletter-signup': NewsletterSignupRenderer,
    'tut-usa/layout-page-structure/page-header': PageHeaderRenderer,
    'tut-usa/calls-to-action-promotions-campaigns/product-hero': ProductHeroRenderer,
    'tut-usa/navigation-search-discovery/category-grid': CategoryGridRenderer,
    'tut-usa/layout-page-structure/filter-panel': FilterPanelRenderer,
    'tut-usa/layout-page-structure/sort-control': SortControlRenderer,
    'tut-usa/commerce-catalog-merchandising/product-card': ProductCardRenderer,
    'tut-usa/commerce-catalog-merchandising/comparison-tool': ComparisonToolRenderer,
    'tut-usa/calls-to-action-promotions-campaigns/pricing-table': PricingTableRenderer,
    'tut-usa/calls-to-action-promotions-campaigns/plan-card': PlanCardRenderer,
    'tut-usa/calls-to-action-promotions-campaigns/offer-card': OfferCardRenderer,
    'tut-usa/calls-to-action-promotions-campaigns/cta-button': CtaButtonRenderer,
    'tut-usa/education-learning-developer-content/course-card': CourseCardRenderer,
    'tut-usa/education-learning-developer-content/course-catalog': CourseCatalogRenderer,
    'tut-usa/media-visual-storytelling-assets/resource-list': ResourceListRenderer,
    'tut-usa/editorial-article-content/faq': FaqRenderer,
  })
  .setFallback(TutAwareFallback);
