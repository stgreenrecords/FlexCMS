import { type ReactNode } from 'react';

export interface DownloadCenterData {
  title: string;
  items: string[];
  filterCategories: string[];
  searchEnabled: boolean;
  children?: ReactNode;
}

export function DownloadCenter({ data }: { data: DownloadCenterData }) {
  return (
    <section className="py-10 bg-surface">
      {data.title && (
        <h2 className="text-2xl font-semibold text-on-surface mb-6">{data.title}</h2>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        {data.searchEnabled && (
          <input
            type="search"
            placeholder="Search downloads..."
            className="flex-1 min-w-48 bg-surface-container-low border border-surface-container-highest text-on-surface rounded px-4 py-2 text-sm focus:outline-none focus:border-primary"
            readOnly
          />
        )}
        {data.filterCategories?.map((cat, i) => (
          <button
            key={i}
            className="px-4 py-2 bg-surface-container-low text-on-surface-variant text-sm rounded hover:text-on-surface hover:bg-surface-container-highest transition"
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {data.items?.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-4 bg-surface-container-low rounded-lg p-4"
          >
            <div className="w-10 h-10 flex-shrink-0 bg-surface-container-highest rounded flex items-center justify-center text-primary text-xs font-bold uppercase">
              DL
            </div>
            <span className="flex-1 text-on-surface text-sm truncate">{item}</span>
            <a
              href={item}
              download
              className="flex-shrink-0 px-3 py-1.5 bg-primary text-on-primary text-xs font-semibold rounded transition hover:opacity-90"
            >
              Download
            </a>
          </div>
        ))}
      </div>

      {data.children}
    </section>
  );
}
