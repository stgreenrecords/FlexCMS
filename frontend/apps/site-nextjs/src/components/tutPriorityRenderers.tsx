'use client';

import React from 'react';
import type { FlexCmsRenderer } from '@flexcms/react';
import { linkAttributes, toTutLink } from './tutLink';

function text(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

const TUT_IMAGE_FALLBACK = '/tut-usa/assets/images/57842e3aa2214c12-ab6axudqj78i-hchlovzt8msscx-elxwrzr3xeyr0u98zghv.png';

function resolveImageUrl(value: string): string {
  return /^\/dam\/tut-usa\/missing\//i.test(value) ? TUT_IMAGE_FALLBACK : value;
}

function imageUrl(value: unknown): string | null {
  if (typeof value === 'string' && /^(https?:\/\/|\/|data:image\/)/i.test(value.trim())) return resolveImageUrl(value.trim());
  const entry = record(value);
  for (const candidate of [entry?.url, entry?.src, entry?.path, entry?.imageUrl]) {
    if (typeof candidate === 'string' && /^(https?:\/\/|\/|data:image\/)/i.test(candidate.trim())) return resolveImageUrl(candidate.trim());
  }
  return null;
}

function breadcrumbItems(value: unknown): Array<{ label: string; url?: string }> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === 'string') return [{ label: item }];
    const entry = record(item);
    if (!entry) return [];
    const label = text(entry.label ?? entry.title ?? entry.name, '');
    const link = toTutLink(entry, label);
    return label ? [{ label, url: link?.url }] : [];
  });
}

export const PageHeaderRenderer: FlexCmsRenderer = ({ data }) => {
  const backgroundImage = imageUrl(data.backgroundImage ?? data.image);
  const breadcrumbs = breadcrumbItems(data.breadcrumbs ?? data.items);

  return (
    <header className="relative isolate overflow-hidden bg-surface px-6 pb-16 pt-32 sm:px-10 lg:px-12">
      {backgroundImage ? (
        <img
          src={backgroundImage}
          alt={text(data.title, 'Page header')}
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40"
          loading="eager"
        />
      ) : null}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-surface via-surface/90 to-surface/40" />
      {breadcrumbs.length > 0 ? (
        <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap gap-2 font-label text-[10px] uppercase tracking-[0.25em] text-on-surface-variant">
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={`${item.label}-${index}`}>
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {item.url ? <a href={item.url} className="hover:text-on-surface">{item.label}</a> : <span>{item.label}</span>}
            </React.Fragment>
          ))}
        </nav>
      ) : null}
      <div className="max-w-4xl">
        <h1 className="font-headline text-5xl italic leading-none tracking-tight text-on-surface sm:text-7xl lg:text-8xl">
          {text(data.title, 'Explore TUT')}
        </h1>
        {data.subtitle != null ? (
          <p className="mt-6 max-w-2xl font-body text-lg leading-relaxed text-on-surface-variant">
            {text(data.subtitle, '')}
          </p>
        ) : null}
      </div>
    </header>
  );
};

export const ProductHeroRenderer: FlexCmsRenderer = ({ data }) => {
  const heroImage = imageUrl(data.image ?? data.backgroundImage ?? data.media);
  const cta = toTutLink(data.cta ?? data.primaryCta);
  const items = Array.isArray(data.items) ? data.items : [];
  const itemLabels = items.flatMap((item) => {
    if (typeof item === 'string') return [item];
    const entry = record(item);
    if (!entry) return [];
    return [text(entry.title ?? entry.label ?? entry.name ?? entry.description, '')].filter(Boolean);
  });

  return (
    <section className="relative isolate flex min-h-[34rem] items-end overflow-hidden bg-surface px-6 pb-16 pt-32 sm:px-10 lg:min-h-[42rem] lg:px-12">
      {heroImage ? (
        <img src={heroImage} alt={text(data.title, 'Product')} className="absolute inset-0 -z-10 h-full w-full object-cover opacity-60" loading="lazy" />
      ) : null}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-surface via-surface/55 to-surface/15" />
      <div className="relative z-10 max-w-4xl">
        <p className="mb-5 font-label text-[10px] uppercase tracking-[0.45em] text-primary">TUT Collection</p>
        <h2 className="font-headline text-5xl italic leading-none tracking-tight text-on-surface sm:text-7xl lg:text-8xl">
          {text(data.title, 'The Collection')}
        </h2>
        {data.description != null ? (
          <p className="mt-6 max-w-2xl font-body text-lg leading-relaxed text-on-surface-variant">
            {text(data.description, '')}
          </p>
        ) : null}
        {itemLabels.length > 0 ? (
          <ul className="mt-8 grid max-w-3xl gap-3 font-body text-base text-on-surface-variant sm:grid-cols-2">
            {itemLabels.slice(0, 6).map((item, index) => <li key={`${item}-${index}`} className="border-l border-outline pl-4">{item}</li>)}
          </ul>
        ) : null}
        {cta ? (
          <a href={cta.url} {...linkAttributes(cta)} className="mt-10 inline-flex bg-primary px-8 py-4 font-label text-xs uppercase tracking-[0.2em] text-on-primary hover:bg-primary-fixed">
            {cta.label}
          </a>
        ) : null}
      </div>
    </section>
  );
};

