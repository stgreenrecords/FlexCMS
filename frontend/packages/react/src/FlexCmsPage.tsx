'use client';

import React from 'react';
import type { PageResponse } from '@flexcms/sdk';
import { FlexCmsComponent } from './FlexCmsComponent';

export interface FlexCmsPageProps {
  /** Pre-fetched page data (for SSR) or undefined to trigger client fetch */
  pageData: PageResponse;
  /** Optional className for the page wrapper */
  className?: string;
}

/**
 * Renders a full CMS page by iterating over its component tree.
 *
 * @example
 * ```tsx
 * // In a Next.js Server Component
 * export default async function Page({ params }) {
 *   const client = new FlexCmsClient({ apiUrl: process.env.CMS_API_URL });
 *   const pageData = await client.getPage(params.path);
 *   return <FlexCmsPage pageData={pageData} />;
 * }
 * ```
 */
export function FlexCmsPage({ pageData, className }: FlexCmsPageProps) {
  return (
    <div className={className} data-flexcms-page={pageData.page.path}>
      {pageData.components.map((node) => (
        <FlexCmsComponent key={node.name} node={node} />
      ))}
    </div>
  );
}

