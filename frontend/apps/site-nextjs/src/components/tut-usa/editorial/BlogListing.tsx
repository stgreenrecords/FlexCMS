import React from 'react';

export interface BlogListingData {
  title: string;
  posts: string[];
  showPagination: boolean;
  enableTagFilter: boolean;
}

interface Props {
  data: BlogListingData;
  children?: React.ReactNode;
}

export function BlogListing({ data, children }: Props) {
  const { title, showPagination, enableTagFilter } = data;

  return (
    <section className="py-8">
      <div className="flex items-baseline justify-between mb-6 border-b border-outline-variant/20 pb-4 flex-wrap gap-4">
        {title && (
          <h2 className="font-headline italic text-on-surface text-3xl">{title}</h2>
        )}
        {enableTagFilter && (
          <div className="flex items-center gap-2">
            <span className="font-label tracking-widest uppercase text-xs text-on-surface-variant">
              Filter by tag
            </span>
          </div>
        )}
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
      {showPagination && (
        <nav
          aria-label="Pagination"
          className="flex justify-center gap-2 mt-10"
        >
          <button
            type="button"
            disabled
            className="px-4 py-2 text-sm font-label tracking-widest uppercase text-on-surface-variant border border-outline-variant/20 rounded disabled:opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-label tracking-widest uppercase text-primary border border-primary/40 rounded hover:bg-primary/10 transition-colors"
          >
            Next
          </button>
        </nav>
      )}
    </section>
  );
}
