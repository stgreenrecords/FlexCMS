import React from 'react';

export interface NewsCardAltData {
  title: string;
  description: string;
  items: string[];
  layout: 'grid' | 'list';
  cta: { label: string; url: string };
}

interface Props {
  data: NewsCardAltData;
}

export function NewsCardAlt({ data }: Props) {
  const { title, description, items, layout, cta } = data;

  return (
    <section className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-6 flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        {title && (
          <h2 className="font-headline italic text-on-surface text-2xl">{title}</h2>
        )}
        {description && (
          <p className="text-sm text-on-surface-variant leading-relaxed">{description}</p>
        )}
      </header>
      {items.length > 0 && (
        <ul
          className={
            layout === 'grid'
              ? 'grid gap-3 sm:grid-cols-2'
              : 'flex flex-col divide-y divide-outline-variant/20'
          }
        >
          {items.map((item, i) => (
            <li
              key={i}
              className={`text-sm text-on-surface-variant leading-relaxed ${
                layout === 'list' ? 'py-2 first:pt-0 last:pb-0' : 'bg-surface/50 rounded p-3'
              }`}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
      {cta?.url && (
        <a
          href={cta.url}
          className="font-label tracking-widest uppercase text-xs text-primary hover:underline self-start"
        >
          {cta.label}
        </a>
      )}
    </section>
  );
}
