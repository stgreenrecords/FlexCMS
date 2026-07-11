import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CourseCatalogRenderer, FaqRenderer, ResourceListRenderer } from '../tutLearningRenderers';

describe('tutLearningRenderers', () => {
  it('renders the learning catalog and authored courses', () => {
    const { container } = render(
      <CourseCatalogRenderer
        data={{
          title: 'Learning catalog',
          searchEnabled: true,
          filters: ['Ownership', 'Technology'],
          courses: [
            { courseTitle: 'Charging strategy', level: 'Buying', duration: '30 min', summary: 'Learn the basics.' },
            { courseTitle: 'Luxury EV ownership', cta: { label: 'Start course', url: '/learn/luxury-ev' } },
          ],
        }}
      />
    );

    expect(screen.getByRole('heading', { name: 'Learning catalog' })).toBeTruthy();
    expect(screen.getByText('Charging strategy')).toBeTruthy();
    expect(screen.getByText('Ownership')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Start course/ }).getAttribute('href')).toBe('/learn/luxury-ev');
    expect(container.querySelector('pre')).toBeNull();
  });

  it('renders resource download links', () => {
    render(<ResourceListRenderer data={{ title: 'Recommended downloads', resources: ['/learn/ev-buying-guide.pdf', '/learn/charging-basics.pdf'] }} />);

    expect(screen.getByRole('heading', { name: 'Recommended downloads' })).toBeTruthy();
    expect(screen.getByRole('link', { name: '/learn/ev-buying-guide.pdf' }).getAttribute('href')).toBe('/learn/ev-buying-guide.pdf');
  });

  it('renders FAQ questions without exposing contract metadata', () => {
    const { container } = render(<FaqRenderer data={{ title: 'Learning questions', questions: [{ question: 'How do I charge?' }] }} />);

    expect(screen.getByRole('heading', { name: 'Learning questions' })).toBeTruthy();
    expect(screen.getByText('How do I charge?')).toBeTruthy();
    expect(container.querySelector('pre')).toBeNull();
  });
});

