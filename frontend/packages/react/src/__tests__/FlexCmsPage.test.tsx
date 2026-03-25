import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FlexCmsProvider, type FlexCmsRenderer } from '../FlexCmsProvider';
import { FlexCmsPage } from '../FlexCmsPage';
import { FlexCmsClient, ComponentMapper } from '@flexcms/sdk';
import type { PageResponse } from '@flexcms/sdk';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const HeroRenderer: FlexCmsRenderer = ({ data }) => (
  <section data-testid="hero">{String(data.title ?? '')}</section>
);

const TextRenderer: FlexCmsRenderer = ({ data }) => (
  <p data-testid="text">{String(data.content ?? '')}</p>
);

function makePage(overrides: Partial<PageResponse> = {}): PageResponse {
  return {
    page: {
      path: '/about',
      title: 'About Us',
      description: '',
      template: 'default',
      locale: 'en',
      lastModified: '2024-01-01',
    },
    components: [],
    ...overrides,
  };
}

function renderPage(pageData: PageResponse, renderers: Record<string, FlexCmsRenderer> = {}, className?: string) {
  const client = new FlexCmsClient({ apiUrl: 'http://api.test' });
  const mapper = new ComponentMapper<FlexCmsRenderer>();
  mapper.registerAll(renderers);
  return render(
    <FlexCmsProvider client={client} componentMap={mapper}>
      <FlexCmsPage pageData={pageData} className={className} />
    </FlexCmsProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FlexCmsPage', () => {
  it('renders a wrapper div with data-flexcms-page attribute set to the page path', () => {
    const { container } = renderPage(makePage({ page: { ...makePage().page, path: '/about' } }));
    const div = container.querySelector('[data-flexcms-page]');
    expect(div).not.toBeNull();
    expect(div?.getAttribute('data-flexcms-page')).toBe('/about');
  });

  it('applies className to the wrapper div', () => {
    const { container } = renderPage(makePage(), {}, 'my-page-class');
    const div = container.querySelector('[data-flexcms-page]');
    expect(div?.className).toBe('my-page-class');
  });

  it('renders all top-level components', () => {
    const page = makePage({
      components: [
        { name: 'hero', resourceType: 'myapp/hero', data: { title: 'Hero' } },
        { name: 'text', resourceType: 'myapp/text', data: { content: 'Body text' } },
      ],
    });
    renderPage(page, { 'myapp/hero': HeroRenderer, 'myapp/text': TextRenderer });
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('text')).toBeInTheDocument();
  });

  it('renders empty page with no components without error', () => {
    const { container } = renderPage(makePage({ components: [] }));
    const div = container.querySelector('[data-flexcms-page]');
    expect(div).not.toBeNull();
    expect(div?.children).toHaveLength(0);
  });

  it('renders components in order', () => {
    const page = makePage({
      components: [
        { name: 'first', resourceType: 'myapp/hero', data: { title: 'First' } },
        { name: 'second', resourceType: 'myapp/hero', data: { title: 'Second' } },
      ],
    });
    renderPage(page, { 'myapp/hero': HeroRenderer });
    const heroes = screen.getAllByTestId('hero');
    expect(heroes).toHaveLength(2);
  });
});
