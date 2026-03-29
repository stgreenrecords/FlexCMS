import React from 'react';

export interface PageMetadataData {
  pageTitle: string;
  slug: string;
  template: string;
  tags: string[];
  publishDate: string;
}

interface PageMetadataProps {
  data: PageMetadataData;
}

/**
 * Non-visual component — renders null in the DOM.
 * Metadata (title, slug, template, tags, publishDate) is consumed
 * by the page resolver layer and passed to Next.js <Head> via generateMetadata().
 */
export function PageMetadata(_props: PageMetadataProps): null {
  return null;
}
