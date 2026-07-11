import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  buildTutRendererEntries,
  groupedTutRenderersByGroup,
  semanticGroupRenderers,
  type TutComponentContract,
} from '../tutGroupedRenderers';

describe('tutGroupedRenderers', () => {
  it('maps contracts to grouped renderers and falls back when the group is unknown', () => {
    const contracts: TutComponentContract[] = [
      {
        resourceType: 'tut-usa/layout-page-structure/section-divider',
        groupName: 'Layout & Page Structure',
      },
      {
        resourceType: 'tut-usa/unknown/new-component',
        groupName: 'Not A Known Group',
      },
    ];

    const entries = buildTutRendererEntries(contracts);

    expect(entries['tut-usa/layout-page-structure/section-divider']).toBe(
      groupedTutRenderersByGroup['Layout & Page Structure']
    );
    expect(entries['tut-usa/unknown/new-component']).toBeDefined();
    expect(entries['tut-usa/unknown/new-component']).not.toBe(
      groupedTutRenderersByGroup['Layout & Page Structure']
    );
  });

  it('uses the semantic CTA renderer for every CTA-group contract', () => {
    const renderer = buildTutRendererEntries([
      {
        resourceType: 'tut-usa/calls-to-action-promotions-campaigns/offer-card',
        groupName: 'Calls to Action, Promotions & Campaigns',
      },
    ]);

    expect(renderer['tut-usa/calls-to-action-promotions-campaigns/offer-card']).toBe(
      semanticGroupRenderers['Calls to Action, Promotions & Campaigns']
    );
    expect(renderer['tut-usa/calls-to-action-promotions-campaigns/offer-card']).not.toBe(
      groupedTutRenderersByGroup['Calls to Action, Promotions & Campaigns']
    );
  });

  it('uses the semantic learning renderer for Education contracts', () => {
    const renderer = buildTutRendererEntries([
      {
        resourceType: 'tut-usa/education-learning-developer-content/course-catalog',
        groupName: 'Education, Learning & Developer Content',
      },
    ]);

    expect(renderer['tut-usa/education-learning-developer-content/course-catalog']).toBe(
      semanticGroupRenderers['Education, Learning & Developer Content']
    );
  });

  it('renders missing and empty field states plus child content', () => {
    const Renderer = groupedTutRenderersByGroup['Support, Documentation & Knowledge'];

    render(
      <Renderer
        resourceType="tut-usa/support-documentation-knowledge/faq"
        data={{
          title: null,
          answers: [],
          heroImage: { id: 'missing-url' },
        }}
      >
        <div data-testid="child-content">Nested child renderer content</div>
      </Renderer>
    );

    expect(screen.getByText('Not provided')).toBeInTheDocument();
    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(screen.getByText('Image unavailable')).toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('renders image fields and long text safely', () => {
    const Renderer = groupedTutRenderersByGroup['Media, Visual Storytelling & Assets'];
    const longCopy = 'A'.repeat(260);

    const { container } = render(
      <Renderer
        resourceType="tut-usa/media-visual-storytelling-assets/image-gallery"
        data={{
          headline: longCopy,
          thumbnailImage: { url: '/tut-usa/assets/images/test.jpg' },
        }}
      />
    );

    const image = container.querySelector('img[alt="thumbnail Image"]');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/tut-usa/assets/images/test.jpg');
    expect(screen.getByText(longCopy)).toBeInTheDocument();
  });

  it('renders nested links and object-list labels without exposing raw JSON', () => {
    const Renderer = groupedTutRenderersByGroup['Calls to Action, Promotions & Campaigns'];

    const { container } = render(
      <Renderer
        resourceType="tut-usa/calls-to-action-promotions-campaigns/product-hero"
        data={{
          cta: { label: 'Compare Vehicles', url: '/tut-usa/vehicles/compare-vehicles' },
          items: [{ title: 'Flagship sedan' }, { title: 'Luxury SUV' }],
        }}
      />
    );

    expect(screen.getByRole('link', { name: 'Compare Vehicles' })).toHaveAttribute(
      'href',
      '/tut-usa/vehicles/compare-vehicles'
    );
    expect(screen.getByText('Flagship sedan')).toBeInTheDocument();
    expect(screen.getByText('Luxury SUV')).toBeInTheDocument();
    expect(container.querySelector('pre')).toBeNull();
  });
});

