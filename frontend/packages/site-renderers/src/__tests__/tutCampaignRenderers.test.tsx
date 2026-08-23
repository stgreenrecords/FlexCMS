import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OfferCardRenderer, PlanCardRenderer, PricingTableRenderer } from '../tutCampaignRenderers';

describe('tutCampaignRenderers', () => {
  it('renders pricing pathways and highlighted plans as authored UI', () => {
    const { container } = render(
      <PricingTableRenderer
        data={{
          title: 'Illustrative ownership pathways',
          billingToggle: false,
          highlightedPlan: 'Lease',
          plans: [
            { planName: 'Purchase', price: '$2,100/mo', features: ['Flexible ownership'] },
            { planName: 'Lease', price: '$1,379/mo', badge: 'Most asked about', features: ['36-month structure'] },
          ],
        }}
      />
    );

    expect(screen.getByRole('heading', { name: 'Illustrative ownership pathways' })).toBeTruthy();
    expect(screen.getByText('$1,379/mo')).toBeTruthy();
    expect(screen.getByText('Most asked about')).toBeTruthy();
    expect(container.querySelector('pre')).toBeNull();
  });

  it('renders plan features and CTA links', () => {
    render(
      <PlanCardRenderer
        data={{
          planName: 'Lease with confidence',
          price: '$1,379/mo',
          features: ['36-month structure', '10,000 miles per year'],
          cta: { label: 'Ask a retailer', url: '/retail/contact' },
        }}
      />
    );

    expect(screen.getByRole('heading', { name: 'Lease with confidence' })).toBeTruthy();
    expect(screen.getByText('10,000 miles per year')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Ask a retailer' }).getAttribute('href')).toBe('/retail/contact');
  });

  it('renders offer details, code, expiry, and CTA', () => {
    render(
      <OfferCardRenderer
        data={{
          title: 'Spring delivery event',
          offerCode: 'SPRINGTUT',
          expiryDate: '2026-05-31',
          description: 'Complimentary home charging consultation.',
          cta: { label: 'Request offer details', url: '/retail/offers' },
        }}
      />
    );

    expect(screen.getByRole('heading', { name: 'Spring delivery event' })).toBeTruthy();
    expect(screen.getByText('SPRINGTUT')).toBeTruthy();
    expect(screen.getByText(/2026-05-31/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Request offer details' }).getAttribute('href')).toBe('/retail/offers');
  });
});

