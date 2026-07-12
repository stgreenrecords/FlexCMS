import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  FeaturedContentRenderer,
  FooterRenderer,
  HeroBannerRenderer,
  NavigationRenderer,
  ProductGridRenderer,
} from '../homepageRenderers';

describe('homepageRenderers authored links', () => {
  it('renders authored navigation destinations and secure external attributes', () => {
    render(
      <NavigationRenderer
        data={{
          logo: 'TUT',
          primaryLinks: [{ label: 'Vehicles', url: '/tut-usa/vehicles' }],
          utilityLinks: [{ label: 'LinkedIn', url: 'https://www.linkedin.com/company/tutmotors', openInNewTab: true }],
          accountEntry: { label: 'Book a Test Drive', url: '/tut-usa/offers-and-finance/book-a-test-drive' },
        }}
      />
    );

    expect(screen.getByRole('link', { name: 'Vehicles' }).getAttribute('href')).toBe('/tut-usa/vehicles');
    const external = screen.getByRole('link', { name: 'LinkedIn' });
    expect(external.getAttribute('target')).toBe('_blank');
    expect(external.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('renders authored hero CTAs and omits invalid destinations', () => {
    const { rerender } = render(
      <HeroBannerRenderer
        data={{
          headline: 'Hero',
          primaryCta: { label: 'Explore Vehicles', url: '/tut-usa/vehicles' },
          secondaryCta: { label: 'Invalid', url: 'javascript:alert(1)' },
        }}
      />
    );

    expect(screen.getByRole('link', { name: 'Explore Vehicles' }).getAttribute('href')).toBe('/tut-usa/vehicles');
    expect(screen.queryByRole('link', { name: 'Invalid' })).toBeNull();
    expect(document.querySelector('a[href="#"], a[href=""], a[href^="javascript:"]')).toBeNull();

    rerender(<HeroBannerRenderer data={{ headline: 'No links' }} />);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('renders authored featured cards and product-grid CTAs', () => {
    render(
      <>
        <FeaturedContentRenderer data={{ title: 'Stories', items: [{ label: 'Innovation', url: '/tut-usa/innovation' }] }} />
        <ProductGridRenderer data={{ title: 'Vehicles', products: [{ productName: 'TUT S', cta: { label: 'Explore TUT S', url: '/tut-usa/vehicles/sedans/tut-s' } }] }} />
      </>
    );

    expect(screen.getByRole('link', { name: 'Innovation' }).getAttribute('href')).toBe('/tut-usa/innovation');
    expect(screen.getByRole('link', { name: 'Explore TUT S' }).getAttribute('href')).toBe('/tut-usa/vehicles/sedans/tut-s');
  });

  it('renders authored footer groups, legal links, and social links', () => {
    render(
      <FooterRenderer
        data={{
          brandName: 'TUT',
          footerLinkGroups: [{ title: 'Vehicles', links: [{ label: 'Sedans', url: '/tut-usa/vehicles/sedans' }] }],
          socialLinks: [{ label: 'Instagram', url: 'https://www.instagram.com/tutmotors', openInNewTab: true }],
          legalLinks: [{ label: 'Privacy', url: '/tut-usa/legal/privacy' }],
        }}
      />
    );

    expect(screen.getByRole('link', { name: 'Sedans' }).getAttribute('href')).toBe('/tut-usa/vehicles/sedans');
    expect(screen.getByRole('link', { name: 'Privacy' }).getAttribute('href')).toBe('/tut-usa/legal/privacy');
    expect(screen.getByRole('link', { name: 'Instagram' }).getAttribute('rel')).toBe('noopener noreferrer');
  });
});

