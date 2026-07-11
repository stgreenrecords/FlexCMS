import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageHeaderRenderer, ProductHeroRenderer } from '../tutPriorityRenderers';

describe('tutPriorityRenderers', () => {
  it('renders page headers as visual content instead of field metadata', () => {
    render(
      <PageHeaderRenderer
        resourceType="tut-usa/layout-page-structure/page-header"
        data={{
          title: 'Vehicles',
          subtitle: 'Browse the TUT vehicle portfolio.',
          breadcrumbs: [{ label: 'Home', url: '/' }, { label: 'Vehicles' }],
          backgroundImage: '/tut-usa/assets/images/header.jpg',
        }}
      />
    );

    expect(screen.getByRole('heading', { name: 'Vehicles' })).toBeInTheDocument();
    expect(screen.getByText('Browse the TUT vehicle portfolio.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Vehicles' })).toHaveAttribute('src', '/tut-usa/assets/images/header.jpg');
    expect(screen.queryByText('Not provided')).not.toBeInTheDocument();
  });

  it('renders product hero items and CTA as authored content', () => {
    render(
      <ProductHeroRenderer
        resourceType="tut-usa/calls-to-action-promotions-campaigns/product-hero"
        data={{
          title: 'Vehicles',
          description: 'Compare the TUT portfolio.',
          items: ['Flagship sedan', { title: 'Luxury SUV' }],
          cta: { label: 'Compare Vehicles', url: '/tut-usa/vehicles/compare-vehicles' },
        }}
      />
    );

    expect(screen.getByRole('heading', { name: 'Vehicles' })).toBeInTheDocument();
    expect(screen.getByText('Flagship sedan')).toBeInTheDocument();
    expect(screen.getByText('Luxury SUV')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Compare Vehicles' })).toHaveAttribute(
      'href',
      '/tut-usa/vehicles/compare-vehicles'
    );
  });
});

