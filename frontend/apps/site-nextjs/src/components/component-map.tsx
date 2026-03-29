/**
 * Reference site component map — registers React renderers for each CMS component type.
 * This is where the frontend team maps backend resourceTypes to React components.
 *
 * The backend team defines the data schema (the contract).
 * The frontend team builds the renderer (this file).
 * Neither side touches the other's code.
 */
'use client';

import { ComponentMapper } from '@flexcms/sdk';
import type { FlexCmsRenderer } from '@flexcms/react';

// ---------------------------------------------------------------------------
// Core component renderers
// ---------------------------------------------------------------------------

/** flexcms/rich-text — renders HTML content */
function RichText({ data }: { data: Record<string, unknown> }) {
  return (
    <div
      className="prose max-w-none"
      dangerouslySetInnerHTML={{ __html: (data.content as string) ?? '' }}
    />
  );
}

/** flexcms/image — renders a responsive image */
function Image({ data }: { data: Record<string, unknown> }) {
  return (
    <figure>
      <img
        src={data.src as string}
        alt={(data.alt as string) ?? ''}
        width={data.width as number}
        height={data.height as number}
        loading="lazy"
      />
      {data.caption != null && <figcaption>{String(data.caption)}</figcaption>}
    </figure>
  );
}

/** flexcms/container — renders children in a layout */
function Container({ data, children }: { data: Record<string, unknown>; children?: React.ReactNode }) {
  const layout = (data.layout as string) ?? 'single';
  const layoutClass = {
    single: '',
    'two-equal': 'grid grid-cols-2 gap-6',
    'three-equal': 'grid grid-cols-3 gap-6',
  }[layout] ?? '';

  return <div className={layoutClass}>{children}</div>;
}

/** flexcms/shared-header — site header */
function Header({ data }: { data: Record<string, unknown> }) {
  return (
    <header className="border-b py-4 px-6">
      <nav className="flex items-center gap-6">
        <strong>{(data.logo as string) ?? 'FlexCMS Site'}</strong>
      </nav>
    </header>
  );
}

/** flexcms/shared-footer — site footer */
function Footer({ data }: { data: Record<string, unknown> }) {
  return (
    <footer className="border-t py-8 px-6 text-center text-sm text-gray-500">
      © {new Date().getFullYear()} FlexCMS Site
    </footer>
  );
}

// ---------------------------------------------------------------------------
// TUT component renderers
// ---------------------------------------------------------------------------

export { HeroBanner } from './tut/HeroBanner';
export { TextImage } from './tut/TextImage';
export { CardGrid } from './tut/CardGrid';
export { Card } from './tut/Card';
export { ProductTeaser } from './tut/ProductTeaser';
export { ProductSpecs } from './tut/ProductSpecs';
export { Gallery } from './tut/Gallery';
export { CtaBanner } from './tut/CtaBanner';
export { Accordion } from './tut/Accordion';
export { AccordionItem } from './tut/AccordionItem';
export { VideoEmbed } from './tut/VideoEmbed';
export { Navigation } from './tut/Navigation';
export { Breadcrumb } from './tut/Breadcrumb';
export { FooterLinks } from './tut/FooterLinks';
export { LanguageSelector } from './tut/LanguageSelector';
export { StatCounter } from './tut/StatCounter';
export { Testimonial } from './tut/Testimonial';
export { ModelComparison } from './tut/ModelComparison';

import { HeroBanner } from './tut/HeroBanner';
import { TextImage } from './tut/TextImage';
import { CardGrid } from './tut/CardGrid';
import { Card } from './tut/Card';
import { ProductTeaser } from './tut/ProductTeaser';
import { ProductSpecs } from './tut/ProductSpecs';
import { Gallery } from './tut/Gallery';
import { CtaBanner } from './tut/CtaBanner';
import { Accordion } from './tut/Accordion';
import { AccordionItem } from './tut/AccordionItem';
import { VideoEmbed } from './tut/VideoEmbed';
import { Navigation } from './tut/Navigation';
import { Breadcrumb } from './tut/Breadcrumb';
import { FooterLinks } from './tut/FooterLinks';
import { LanguageSelector } from './tut/LanguageSelector';
import { StatCounter } from './tut/StatCounter';
import { Testimonial } from './tut/Testimonial';
import { ModelComparison } from './tut/ModelComparison';
import {
  SearchBar,
  SearchResults,
  TutUsaBreadcrumb,
  TutUsaNavigation,
  PrimaryNavigation,
  LinksGroupNavigation,
  MegaMenu,
  SecondaryNavigation,
  TutUsaFooter,
  LinksGroupFooter,
  TutUsaLogo,
  AccountSignIn,
  TutUsaSiteMap,
  BackToTop,
  SideNavigation,
  AnchorLinks,
  TextLink,
  ButtonGroup,
  LinkList,
  RelatedContent,
  RecommendedArticles,
  CategoryCard,
  CategoryGrid,
  BookmarkButton,
  SkipLink,
  LanguageSwitcher,
  CountrySelector,
  CurrencySelector,
} from './tut-usa/navigation';
import {
  SectionDivider,
  Spacer,
  Container as LayoutContainer,
  GridLayout,
  TwoColumnLayout,
  TwoColumnsGrid,
  ThreeColumnLayout,
  CardGrid as LayoutCardGrid,
  SidebarPromo,
  StickyCta,
  ModalDialog,
  SidePanel,
  DrawerNavigation,
  Tooltip,
  Popover,
  Badge,
  MediaObject,
  PageHeader,
  PageFooterSection,
  PageMetadata,
  EmptyState,
  Pagination,
  FilterPanel,
  SortControl,
  TagList,
  IconList,
  IconCard,
  FramedMessage,
  ErrorPage404,
  ErrorPage500,
  ProgressBar,
  StepIndicator,
} from './tut-usa/layout';
import React from 'react';

// ---------------------------------------------------------------------------
// Build the component map (the bridge between contract and rendering)
// ---------------------------------------------------------------------------

export const componentMap = new ComponentMapper<any>()
  .registerAll({
    // Core components
    'flexcms/rich-text': RichText,
    'flexcms/image': Image,
    'flexcms/container': Container,
    'flexcms/shared-header': Header,
    'flexcms/shared-footer': Footer,
    // TUT components
    'tut/hero-banner': HeroBanner,
    'tut/text-image': TextImage,
    'tut/card-grid': CardGrid,
    'tut/card': Card,
    'tut/product-teaser': ProductTeaser,
    'tut/product-specs': ProductSpecs,
    'tut/gallery': Gallery,
    'tut/cta-banner': CtaBanner,
    'tut/accordion': Accordion,
    'tut/accordion-item': AccordionItem,
    'tut/video-embed': VideoEmbed,
    'tut/navigation': Navigation,
    'tut/breadcrumb': Breadcrumb,
    'tut/footer-links': FooterLinks,
    'tut/language-selector': LanguageSelector,
    'tut/stat-counter': StatCounter,
    'tut/testimonial': Testimonial,
    'tut/model-comparison': ModelComparison,
    // TUT USA — Navigation, Search & Discovery
    'tut-usa/navigation-search-discovery/search-bar': SearchBar,
    'tut-usa/navigation-search-discovery/search-results': SearchResults,
    'tut-usa/navigation-search-discovery/breadcrumb': TutUsaBreadcrumb,
    'tut-usa/navigation-search-discovery/navigation': TutUsaNavigation,
    'tut-usa/navigation-search-discovery/primary-navigation': PrimaryNavigation,
    'tut-usa/navigation-search-discovery/links-group-navigation': LinksGroupNavigation,
    'tut-usa/navigation-search-discovery/mega-menu': MegaMenu,
    'tut-usa/navigation-search-discovery/secondary-navigation': SecondaryNavigation,
    'tut-usa/navigation-search-discovery/footer': TutUsaFooter,
    'tut-usa/navigation-search-discovery/links-group-footer': LinksGroupFooter,
    'tut-usa/navigation-search-discovery/logo': TutUsaLogo,
    'tut-usa/navigation-search-discovery/account-sign-in': AccountSignIn,
    'tut-usa/navigation-search-discovery/site-map': TutUsaSiteMap,
    'tut-usa/navigation-search-discovery/back-to-top': BackToTop,
    'tut-usa/navigation-search-discovery/side-navigation': SideNavigation,
    'tut-usa/navigation-search-discovery/anchor-links': AnchorLinks,
    'tut-usa/navigation-search-discovery/text-link': TextLink,
    'tut-usa/navigation-search-discovery/button-group': ButtonGroup,
    'tut-usa/navigation-search-discovery/link-list': LinkList,
    'tut-usa/navigation-search-discovery/related-content': RelatedContent,
    'tut-usa/navigation-search-discovery/recommended-articles': RecommendedArticles,
    'tut-usa/navigation-search-discovery/category-card': CategoryCard,
    'tut-usa/navigation-search-discovery/category-grid': CategoryGrid,
    'tut-usa/navigation-search-discovery/bookmark-button': BookmarkButton,
    'tut-usa/navigation-search-discovery/skip-link': SkipLink,
    'tut-usa/navigation-search-discovery/language-switcher': LanguageSwitcher,
    'tut-usa/navigation-search-discovery/country-selector': CountrySelector,
    'tut-usa/navigation-search-discovery/currency-selector': CurrencySelector,
    // TUT USA — Layout & Page Structure
    'tut-usa/layout-page-structure/section-divider': SectionDivider,
    'tut-usa/layout-page-structure/spacer': Spacer,
    'tut-usa/layout-page-structure/container': LayoutContainer,
    'tut-usa/layout-page-structure/grid-layout': GridLayout,
    'tut-usa/layout-page-structure/two-column-layout': TwoColumnLayout,
    'tut-usa/layout-page-structure/two-columns-grid': TwoColumnsGrid,
    'tut-usa/layout-page-structure/three-column-layout': ThreeColumnLayout,
    'tut-usa/layout-page-structure/card-grid': LayoutCardGrid,
    'tut-usa/layout-page-structure/sidebar-promo': SidebarPromo,
    'tut-usa/layout-page-structure/sticky-cta': StickyCta,
    'tut-usa/layout-page-structure/modal-dialog': ModalDialog,
    'tut-usa/layout-page-structure/side-panel': SidePanel,
    'tut-usa/layout-page-structure/drawer-navigation': DrawerNavigation,
    'tut-usa/layout-page-structure/tooltip': Tooltip,
    'tut-usa/layout-page-structure/popover': Popover,
    'tut-usa/layout-page-structure/badge': Badge,
    'tut-usa/layout-page-structure/media-object': MediaObject,
    'tut-usa/layout-page-structure/page-header': PageHeader,
    'tut-usa/layout-page-structure/page-footer-section': PageFooterSection,
    'tut-usa/layout-page-structure/page-metadata': PageMetadata,
    'tut-usa/layout-page-structure/empty-state': EmptyState,
    'tut-usa/layout-page-structure/pagination': Pagination,
    'tut-usa/layout-page-structure/filter-panel': FilterPanel,
    'tut-usa/layout-page-structure/sort-control': SortControl,
    'tut-usa/layout-page-structure/tag-list': TagList,
    'tut-usa/layout-page-structure/icon-list': IconList,
    'tut-usa/layout-page-structure/icon-card': IconCard,
    'tut-usa/layout-page-structure/framed-message': FramedMessage,
    'tut-usa/layout-page-structure/error-page-404': ErrorPage404,
    'tut-usa/layout-page-structure/error-page-500': ErrorPage500,
    'tut-usa/layout-page-structure/progress-bar': ProgressBar,
    'tut-usa/layout-page-structure/step-indicator': StepIndicator,
  })
  .setFallback(({ data }: any) => (
    <div className="p-4 border border-dashed border-gray-300 rounded">
      <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>
    </div>
  ));
