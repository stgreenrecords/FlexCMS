'use client';

import React from 'react';
import type { ComponentNode } from '@flexcms/sdk';
import { useFlexCms, type FlexCmsRenderer } from './FlexCmsProvider';

export interface FlexCmsComponentProps {
  /** The component node from the CMS page response */
  node: ComponentNode;
  /** Optional override for the component mapper (e.g., for testing) */
  fallback?: React.ReactNode;
}

/**
 * Renders a single CMS component by resolving its resourceType to a React component.
 * Recursively renders children for container components.
 *
 * @example
 * ```tsx
 * {components.map(node => (
 *   <FlexCmsComponent key={node.name} node={node} />
 * ))}
 * ```
 */
export function FlexCmsComponent({ node, fallback }: FlexCmsComponentProps) {
  const { mapper } = useFlexCms();

  const Renderer = mapper.resolve(node.resourceType);

  if (!Renderer) {
    if (fallback) return <>{fallback}</>;
    if (process.env.NODE_ENV === 'development') {
      return (
        <div data-flexcms-missing={node.resourceType} style={{ border: '2px dashed red', padding: '1rem', margin: '0.5rem 0' }}>
          <strong>Unknown component:</strong> {node.resourceType}
          <pre style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
            {JSON.stringify(node.data, null, 2)}
          </pre>
        </div>
      );
    }
    return null;
  }

  // Render children for container components
  const childElements = node.children?.length
    ? node.children.map((child) => (
        <FlexCmsComponent key={child.name} node={child} />
      ))
    : undefined;

  return <Renderer data={node.data}>{childElements}</Renderer>;
}

