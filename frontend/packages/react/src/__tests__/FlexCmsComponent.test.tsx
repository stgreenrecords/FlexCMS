import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FlexCmsProvider, type FlexCmsRenderer } from '../FlexCmsProvider';
import { FlexCmsComponent } from '../FlexCmsComponent';
import { FlexCmsClient, ComponentMapper } from '@flexcms/sdk';
import type { ComponentNode } from '@flexcms/sdk';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function node(name: string, resourceType: string, data: Record<string, unknown> = {}, children?: ComponentNode[]): ComponentNode {
  return { name, resourceType, data, children };
}

const HeroRenderer: FlexCmsRenderer = ({ data, children }) => (
  <section data-testid="hero" data-title={data.title as string}>
    {children}
  </section>
);

const TextRenderer: FlexCmsRenderer = ({ data }) => (
  <p data-testid="text">{String(data.content ?? '')}</p>
);

function renderWithMapper(
  ui: React.ReactElement,
  renderers: Record<string, FlexCmsRenderer> = {}
) {
  const client = new FlexCmsClient({ apiUrl: 'http://api.test' });
  const mapper = new ComponentMapper<FlexCmsRenderer>();
  mapper.registerAll(renderers);
  return render(
    <FlexCmsProvider client={client} componentMap={mapper}>
      {ui}
    </FlexCmsProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FlexCmsComponent', () => {
  it('renders the registered renderer with node data', () => {
    renderWithMapper(
      <FlexCmsComponent node={node('hero', 'myapp/hero', { title: 'Hello' })} />,
      { 'myapp/hero': HeroRenderer }
    );
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('hero')).toHaveAttribute('data-title', 'Hello');
  });

  it('renders children of container components', () => {
    renderWithMapper(
      <FlexCmsComponent
        node={node('hero', 'myapp/hero', {}, [
          node('text', 'myapp/text', { content: 'Child text' }),
        ])}
      />,
      {
        'myapp/hero': HeroRenderer,
        'myapp/text': TextRenderer,
      }
    );
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('text')).toBeInTheDocument();
    expect(screen.getByTestId('text').textContent).toBe('Child text');
  });

  it('returns null for unknown resourceType in production', () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const { container } = renderWithMapper(
      <FlexCmsComponent node={node('hero', 'myapp/unknown')} />,
      {}
    );
    expect(container.firstChild).toBeNull();

    process.env.NODE_ENV = origEnv;
  });

  it('renders dev placeholder for unknown type in development', () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    renderWithMapper(
      <FlexCmsComponent node={node('hero', 'myapp/unknown')} />,
      {}
    );
    const placeholder = document.querySelector('[data-flexcms-missing]');
    expect(placeholder).not.toBeNull();
    expect(placeholder?.getAttribute('data-flexcms-missing')).toBe('myapp/unknown');

    process.env.NODE_ENV = origEnv;
  });

  it('renders fallback when type is unknown and fallback provided', () => {
    render(
      <FlexCmsProvider
        client={new FlexCmsClient({ apiUrl: 'http://api.test' })}
        componentMap={new ComponentMapper<FlexCmsRenderer>()}
      >
        <FlexCmsComponent
          node={node('hero', 'myapp/unknown')}
          fallback={<span data-testid="fallback">Fallback content</span>}
        />
      </FlexCmsProvider>
    );
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
  });

  it('does not render children when node has no children array', () => {
    renderWithMapper(
      <FlexCmsComponent node={node('hero', 'myapp/hero', { title: 'Solo' })} />,
      { 'myapp/hero': HeroRenderer }
    );
    const hero = screen.getByTestId('hero');
    expect(hero.children).toHaveLength(0);
  });

  it('does not render children when node has empty children array', () => {
    renderWithMapper(
      <FlexCmsComponent node={node('hero', 'myapp/hero', {}, [])} />,
      { 'myapp/hero': HeroRenderer }
    );
    const hero = screen.getByTestId('hero');
    expect(hero.children).toHaveLength(0);
  });
});
