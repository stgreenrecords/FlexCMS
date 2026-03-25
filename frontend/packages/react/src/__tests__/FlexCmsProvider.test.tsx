import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, render, screen } from '@testing-library/react';
import { FlexCmsProvider, useFlexCms } from '../FlexCmsProvider';
import { FlexCmsClient, ComponentMapper } from '@flexcms/sdk';
import type { FlexCmsRenderer } from '../FlexCmsProvider';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeClient() {
  return new FlexCmsClient({ apiUrl: 'http://api.test' });
}

function makeMapper() {
  return new ComponentMapper<FlexCmsRenderer>();
}

function wrapper(client = makeClient(), mapper = makeMapper()) {
  return ({ children }: { children: React.ReactNode }) => (
    <FlexCmsProvider client={client} componentMap={mapper}>
      {children}
    </FlexCmsProvider>
  );
}

// ---------------------------------------------------------------------------
// useFlexCms
// ---------------------------------------------------------------------------

describe('useFlexCms', () => {
  it('throws when used outside FlexCmsProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useFlexCms())).toThrow(
      'useFlexCms must be used within a <FlexCmsProvider>'
    );
    spy.mockRestore();
  });

  it('returns client and mapper from context', () => {
    const client = makeClient();
    const mapper = makeMapper();
    const { result } = renderHook(() => useFlexCms(), { wrapper: wrapper(client, mapper) });
    expect(result.current.client).toBe(client);
    expect(result.current.mapper).toBe(mapper);
  });
});

// ---------------------------------------------------------------------------
// FlexCmsProvider
// ---------------------------------------------------------------------------

describe('FlexCmsProvider', () => {
  it('renders children', () => {
    render(
      <FlexCmsProvider client={makeClient()} componentMap={makeMapper()}>
        <span data-testid="child">hello</span>
      </FlexCmsProvider>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('accepts a FlexCmsClient instance directly', () => {
    const client = makeClient();
    const { result } = renderHook(() => useFlexCms(), { wrapper: wrapper(client) });
    expect(result.current.client).toBeInstanceOf(FlexCmsClient);
    expect(result.current.client).toBe(client);
  });

  it('creates a FlexCmsClient from a config object', () => {
    const config = { apiUrl: 'http://from-config.test' };
    const W = ({ children }: { children: React.ReactNode }) => (
      <FlexCmsProvider client={config} componentMap={makeMapper()}>
        {children}
      </FlexCmsProvider>
    );
    const { result } = renderHook(() => useFlexCms(), { wrapper: W });
    expect(result.current.client).toBeInstanceOf(FlexCmsClient);
  });

  it('provides the same mapper that was passed in', () => {
    const mapper = makeMapper();
    mapper.register('myapp/hero', () => null as any);
    const { result } = renderHook(() => useFlexCms(), { wrapper: wrapper(makeClient(), mapper) });
    expect(result.current.mapper.has('myapp/hero')).toBe(true);
  });
});
