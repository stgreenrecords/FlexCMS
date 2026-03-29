import { type ReactNode } from 'react';

export interface ResourceListCta {
  label: string;
  url: string;
}

export interface ResourceListData {
  title: string;
  resources: string[];
  cta: ResourceListCta;
  children?: ReactNode;
}

export function ResourceList({ data }: { data: ResourceListData }) {
  return (
    <section className="py-10 bg-surface">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        {data.title && (
          <h2 className="text-2xl font-semibold text-on-surface">{data.title}</h2>
        )}
        {data.cta?.label && (
          <a
            href={data.cta.url}
            className="text-primary text-sm font-semibold underline whitespace-nowrap"
          >
            {data.cta.label} &#8594;
          </a>
        )}
      </div>

      <div className="space-y-3">
        {data.resources?.map((resource, i) => (
          <div
            key={i}
            className="flex items-center gap-4 bg-surface-container-low rounded-lg p-4 hover:bg-surface-container-highest transition"
          >
            <div className="w-10 h-10 flex-shrink-0 bg-surface-container-highest rounded-lg flex items-center justify-center text-primary text-xs font-bold">
              RES
            </div>
            <span className="flex-1 text-on-surface text-sm truncate">{resource}</span>
            <a
              href={resource}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-primary text-xs font-semibold underline"
            >
              View
            </a>
          </div>
        ))}
      </div>

      {data.children && <div className="mt-6">{data.children}</div>}
    </section>
  );
}
