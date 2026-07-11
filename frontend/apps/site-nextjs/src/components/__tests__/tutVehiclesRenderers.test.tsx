import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  CategoryGridRenderer,
  ComparisonToolRenderer,
  FilterPanelRenderer,
  ProductCardRenderer,
  SortControlRenderer,
} from '../tutVehiclesRenderers';

describe('tutVehiclesRenderers', () => {
  it('renders category links instead of metadata fields', () => {
    render(<CategoryGridRenderer data={{ title: 'Browse by segment', categories: ['Sedans', 'SUVs'] }} />);

    expect(screen.getByRole('heading', { name: 'Browse by segment' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Sedans/ })).toBeTruthy();
    expect(screen.queryByText('categories:')).toBeNull();
  });

  it('renders filter and sort controls from authored options', () => {
    render(
      <>
        <FilterPanelRenderer data={{ title: 'Refine', filters: [{ label: 'Powertrain', options: ['Electric'] }] }} />
        <SortControlRenderer data={{ label: 'Sort', options: ['Featured', 'Price'], defaultOption: 'Featured' }} />
      </>
    );

    expect(screen.getByLabelText('Powertrain')).toBeTruthy();
    expect(screen.getByDisplayValue('Featured')).toBeTruthy();
  });

  it('renders comparison values in a table without raw JSON', () => {
    const { container } = render(
      <ComparisonToolRenderer
        data={{
          title: 'Compare',
          comparisonFields: ['Range', 'Price'],
          items: [
            { name: 'TUT S', values: { Range: '400 mi', Price: '$80,000' } },
            { name: 'TUT X', values: { Range: '350 mi', Price: '$90,000' } },
          ],
        }}
      />
    );

    expect(screen.getByRole('table')).toBeTruthy();
    expect(screen.getByText('400 mi')).toBeTruthy();
    expect(screen.getByText('$90,000')).toBeTruthy();
    expect(container.querySelector('pre')).toBeNull();
  });

  it('renders authored product cards instead of contract metadata', () => {
    const { container } = render(
      <ProductCardRenderer
        data={{
          productName: 'TUT S',
          image: '/tut-usa/assets/images/tut-s.jpg',
          price: 80000,
          shortDescription: 'Electric performance sedan',
          cta: { label: 'Explore TUT S', url: '/tut-usa/vehicles/tut-s' },
        }}
      />
    );

    expect(screen.getByRole('heading', { name: 'TUT S' })).toBeTruthy();
    expect(screen.getByText('$80,000')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Explore TUT S/ }).getAttribute('href')).toBe('/tut-usa/vehicles/tut-s');
    expect(container.querySelector('pre')).toBeNull();
  });
});


