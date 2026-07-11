'use client';

import React from 'react';
import type { FlexCmsRenderer } from '@flexcms/react';

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function label(value: unknown, fallback: string): string {
  const entry = record(value);
  return text(typeof value === 'string' ? value : entry?.label ?? entry?.title ?? entry?.name, fallback);
}

function href(value: unknown): string {
  return text(record(value)?.url ?? value, '#');
}

export const CategoryGridRenderer: FlexCmsRenderer = ({ data }) => {
  const categories = list(data.categories);
  return (
    <section className="bg-surface px-6 py-16 sm:px-10 lg:px-12" aria-labelledby="category-grid-title">
      <div className="mx-auto max-w-7xl">
        <p className="font-label text-[10px] uppercase tracking-[0.4em] text-primary">Explore the range</p>
        <h2 id="category-grid-title" className="mt-3 font-headline text-4xl italic text-on-surface sm:text-5xl">
          {text(data.title, 'Browse by segment')}
        </h2>
        <div className="mt-8 grid gap-px bg-outline-variant/30 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <a key={`${label(category, `Category ${index + 1}`)}-${index}`} href={href(category)} className="group bg-surface px-6 py-8 transition-colors hover:bg-surface-container-low">
              <span className="font-label text-[10px] tracking-[0.3em] text-on-surface-variant">0{index + 1}</span>
              <h3 className="mt-8 font-headline text-3xl italic text-on-surface group-hover:text-primary">{label(category, `Category ${index + 1}`)}</h3>
              <span className="mt-5 block font-label text-[10px] uppercase tracking-widest text-on-surface-variant">View models →</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export const FilterPanelRenderer: FlexCmsRenderer = ({ data }) => {
  const filters = list(data.filters);
  return (
    <section className="border-y border-outline-variant/30 bg-surface-container-low px-6 py-8 sm:px-10 lg:px-12" aria-labelledby="filter-panel-title">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-label text-[10px] uppercase tracking-[0.4em] text-primary">Refine your search</p>
            <h2 id="filter-panel-title" className="mt-2 font-headline text-3xl italic text-on-surface">{text(data.title, 'Filter vehicles')}</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:min-w-[34rem]">
            {filters.map((filter, index) => {
              const entry = record(filter);
              const options = list(entry?.options);
              return (
                <label key={`${label(entry?.label, `Filter ${index + 1}`)}-${index}`} className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                  {label(entry?.label, `Filter ${index + 1}`)}
                  <select className="mt-2 w-full border-b border-outline-variant bg-transparent px-0 py-3 font-body text-sm normal-case tracking-normal text-on-surface outline-none">
                    <option>All</option>
                    {options.map((option, optionIndex) => <option key={`${String(option)}-${optionIndex}`}>{label(option, `Option ${optionIndex + 1}`)}</option>)}
                  </select>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export const SortControlRenderer: FlexCmsRenderer = ({ data }) => (
  <div className="flex items-center justify-between border-b border-outline-variant/30 bg-surface px-6 py-5 sm:px-10 lg:px-12">
    <span className="font-label text-[10px] uppercase tracking-[0.35em] text-on-surface-variant">{text(data.label, 'Sort')}</span>
    <select defaultValue={text(data.defaultOption, 'Featured')} className="border-0 bg-transparent font-label text-[10px] uppercase tracking-widest text-on-surface outline-none">
      {list(data.options).map((option, index) => <option key={`${String(option)}-${index}`}>{label(option, `Option ${index + 1}`)}</option>)}
    </select>
  </div>
);

export const ProductCardRenderer: FlexCmsRenderer = ({ data }) => {
  const cta = record(data.cta);
  const image = text(data.image);
  const price = typeof data.price === 'number' ? `$${data.price.toLocaleString()}` : text(data.price);

  return (
    <article className="group overflow-hidden bg-surface-container-low">
      {image ? <img src={image} alt={text(data.productName, 'Vehicle')} className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" /> : null}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-headline text-3xl italic text-on-surface">{text(data.productName, 'Vehicle')}</h3>
          {price ? <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">{price}</span> : null}
        </div>
        {text(data.shortDescription) ? <p className="mt-3 font-body text-sm leading-6 text-on-surface-variant">{text(data.shortDescription)}</p> : null}
        {cta && <a href={href(cta.url)} className="mt-6 inline-flex font-label text-[10px] uppercase tracking-[0.2em] text-primary underline-offset-4 hover:underline">{text(cta.label, 'Explore vehicle')} →</a>}
      </div>
    </article>
  );
};

export const ComparisonToolRenderer: FlexCmsRenderer = ({ data }) => {
  const items = list(data.items);
  const fields = list(data.comparisonFields);
  return (
    <section className="bg-surface-container-low px-6 py-16 sm:px-10 lg:px-12" aria-labelledby="comparison-tool-title">
      <div className="mx-auto max-w-7xl">
        <p className="font-label text-[10px] uppercase tracking-[0.4em] text-primary">Side by side</p>
        <h2 id="comparison-tool-title" className="mt-3 font-headline text-4xl italic text-on-surface sm:text-5xl">{text(data.title, 'Compare key figures')}</h2>
        <div className="mt-10 overflow-x-auto border border-outline-variant/30">
          <table className="min-w-full text-left">
            <thead className="bg-surface">
              <tr>
                <th className="px-5 py-4 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Key figure</th>
                {items.map((item, index) => <th key={`${label(item, `Vehicle ${index + 1}`)}-${index}`} className="min-w-44 px-5 py-4 font-headline text-2xl italic text-on-surface">{label(item, `Vehicle ${index + 1}`)}</th>)}
              </tr>
            </thead>
            <tbody>
              {fields.map((field, fieldIndex) => (
                <tr key={`${String(field)}-${fieldIndex}`} className="border-t border-outline-variant/30">
                  <th className="px-5 py-4 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">{label(field, `Figure ${fieldIndex + 1}`)}</th>
                  {items.map((item, itemIndex) => {
                    const values = record(record(item)?.values);
                    return <td key={`${String(field)}-${itemIndex}`} className="px-5 py-4 font-body text-sm text-on-surface">{text(values?.[String(field)], '—')}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export const CtaButtonRenderer: FlexCmsRenderer = ({ data }) => (
  <section className="bg-surface px-6 py-14 text-center sm:px-10 lg:px-12">
    <a href={href(data.url)} target={data.openInNewTab === true ? '_blank' : undefined} rel={data.openInNewTab === true ? 'noreferrer' : undefined} className="inline-flex bg-primary px-8 py-4 font-label text-xs uppercase tracking-[0.2em] text-on-primary transition-colors hover:bg-primary-fixed">
      {text(data.label, 'Learn more')}
    </a>
  </section>
);

