import React from 'react';

export interface LatestNewsData {
  title: string;
  source: string;
  count: number;
  showDates: boolean;
}

interface Props {
  data: LatestNewsData;
  children?: React.ReactNode;
}

export function LatestNews({ data, children }: Props) {
  const { title, source, count, showDates } = data;

  return (
    <section className="py-8">
      <div className="flex items-baseline justify-between mb-6 border-b border-outline-variant/20 pb-4">
        {title && (
          <h2 className="font-headline italic text-on-surface text-3xl">{title}</h2>
        )}
        <div className="flex items-center gap-3">
          {source && (
            <span className="font-label tracking-widest uppercase text-xs text-on-surface-variant">
              {source}
            </span>
          )}
          {count > 0 && (
            <span className="font-label tracking-widest uppercase text-xs text-primary">
              {count} items
            </span>
          )}
        </div>
      </div>
      {children ? (
        <div
          className={`grid gap-6 ${
            showDates ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
          }`}
        >
          {children}
        </div>
      ) : (
        <p className="text-sm text-on-surface-variant/60 italic">No news items.</p>
      )}
    </section>
  );
}
