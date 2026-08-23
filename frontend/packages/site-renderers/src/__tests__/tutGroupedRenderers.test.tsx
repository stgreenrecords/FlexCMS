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

    // With no usable content, the section still identifies itself from the resource
    // type rather than rendering an anonymous empty box...
    expect(screen.getByRole('heading', { name: /faq/i })).toBeInTheDocument();
    // ...and nested children are never dropped.
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('falls back to the field list when it can make nothing of the content', () => {
    const Renderer = groupedTutRenderersByGroup['Support, Documentation & Knowledge'];

    // No heading, no body, no media, no collection, no children: the layouts have
    // nothing to work with, so the field list renders instead of an empty section.
    render(
      <Renderer
        resourceType="tut-usa/support-documentation-knowledge/faq"
        data={{ answers: [], heroImage: { id: 'missing-url' } }}
      />
    );

    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(screen.getByText('Image unavailable')).toBeInTheDocument();
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

    // The image is now the section's own media rather than a field-list entry, so it
    // is identified by its source, and its alt text comes from the heading.
    const image = container.querySelector('img[src="/tut-usa/assets/images/test.jpg"]');
    expect(image).toBeInTheDocument();
    // `thumbnailImage` is only recognised because image fields are matched by name
    // shape; an exact-name list would miss every role-named image in the contracts.
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

