'use client';

import React, { createContext, useContext, type ReactNode } from 'react';
import { FlexCmsClient, ComponentMapper, type FlexCmsConfig } from '@flexcms/sdk';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** React component that renders a CMS component's data */
export type FlexCmsRenderer = React.ComponentType<{
  data: Record<string, unknown>;
  children?: ReactNode;
}>;

/** Context value provided to all FlexCMS React components */
export interface FlexCmsContextValue {
  client: FlexCmsClient;
  mapper: ComponentMapper<FlexCmsRenderer>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const FlexCmsContext = createContext<FlexCmsContextValue | null>(null);

/** Hook to access the FlexCMS client and component mapper */
export function useFlexCms(): FlexCmsContextValue {
  const ctx = useContext(FlexCmsContext);
  if (!ctx) {
    throw new Error('useFlexCms must be used within a <FlexCmsProvider>');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export interface FlexCmsProviderProps {
  /** FlexCMS client instance or config to create one */
  client: FlexCmsClient | FlexCmsConfig;
  /** Component mapper with registered renderers */
  componentMap: ComponentMapper<FlexCmsRenderer>;
  children: ReactNode;
}

/**
 * Provides FlexCMS context to all child components.
 *
 * @example
 * ```tsx
 * const client = new FlexCmsClient({ apiUrl: '/api' });
 * const componentMap = new ComponentMapper<FlexCmsRenderer>()
 *   .register('myapp/hero-banner', HeroBanner)
 *   .register('flexcms/rich-text', RichText);
 *
 * <FlexCmsProvider client={client} componentMap={componentMap}>
 *   <App />
 * </FlexCmsProvider>
 * ```
 */
export function FlexCmsProvider({ client, componentMap, children }: FlexCmsProviderProps) {
  const resolvedClient = client instanceof FlexCmsClient ? client : new FlexCmsClient(client);

  return (
    <FlexCmsContext.Provider value={{ client: resolvedClient, mapper: componentMap }}>
      {children}
    </FlexCmsContext.Provider>
  );
}

