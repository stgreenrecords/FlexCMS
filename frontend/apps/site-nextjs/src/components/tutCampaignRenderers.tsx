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

function CtaLink({ value, fallback = 'Learn more' }: { value: unknown; fallback?: string }) {
  const entry = record(value);
  if (!entry && typeof value !== 'string') return null;
  return (
    <a href={href(value)} className="inline-flex bg-primary px-6 py-3 font-label text-[10px] uppercase tracking-[0.2em] text-on-primary transition-colors hover:bg-primary-fixed">
      {text(entry?.label ?? entry?.text ?? value, fallback)}
    </a>
  );
}

export const PlanCardRenderer: FlexCmsRenderer = ({ data }) => (
  <article className="flex h-full flex-col border border-outline-variant/40 bg-surface p-6">
    {text(data.badge) ? <span className="mb-5 self-start bg-primary-fixed px-3 py-1 font-label text-[10px] uppercase tracking-widest text-on-surface">{text(data.badge)}</span> : null}
    <h3 className="font-headline text-3xl italic text-on-surface">{text(data.planName, 'Plan')}</h3>
    {text(data.price) ? <p className="mt-4 font-headline text-4xl text-on-surface">{text(data.price)}</p> : null}
    {list(data.features).length > 0 ? (
      <ul className="my-6 flex-1 space-y-3 border-t border-outline-variant/30 pt-6">
        {list(data.features).map((feature, index) => <li key={`${label(feature, `Feature ${index + 1}`)}-${index}`} className="font-body text-sm leading-6 text-on-surface-variant">{label(feature, `Feature ${index + 1}`)}</li>)}
      </ul>
    ) : <div className="flex-1" />}
    {data.cta != null ? <CtaLink value={data.cta} fallback="Choose plan" /> : null}
  </article>
);

export const PricingTableRenderer: FlexCmsRenderer = ({ data }) => {
  const plans = list(data.plans);
  return (
    <section className="bg-surface-container-low px-6 py-16 sm:px-10 lg:px-12" aria-labelledby="pricing-table-title">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="font-label text-[10px] uppercase tracking-[0.4em] text-primary">Ownership pathways</p>
            <h2 id="pricing-table-title" className="mt-3 font-headline text-4xl italic text-on-surface sm:text-5xl">{text(data.title, 'Choose your pathway')}</h2>
          </div>
          {typeof data.billingToggle === 'boolean' ? <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">{data.billingToggle ? 'Monthly billing' : 'Illustrative pricing'}</span> : null}
        </div>
        {plans.length > 0 ? (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan, index) => {
              const entry = record(plan) ?? { planName: plan };
              const highlighted = text(entry.planName ?? entry.name) === text(data.highlightedPlan);
              return <div key={`${label(entry.planName ?? entry.name, `Plan ${index + 1}`)}-${index}`} className={highlighted ? 'relative ring-2 ring-primary' : ''}><PlanCardRenderer data={entry} /></div>;
            })}
          </div>
        ) : <p className="mt-8 font-body text-sm text-on-surface-variant">No plans are currently available.</p>}
      </div>
    </section>
  );
};

export const OfferCardRenderer: FlexCmsRenderer = ({ data }) => (
  <article className="border border-outline-variant/40 bg-surface p-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <h3 className="font-headline text-3xl italic text-on-surface">{text(data.title, 'Featured offer')}</h3>
      {text(data.offerCode) ? <span className="border border-outline-variant px-3 py-1 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">{text(data.offerCode)}</span> : null}
    </div>
    {text(data.description) ? <p className="mt-4 max-w-3xl font-body text-sm leading-6 text-on-surface-variant">{text(data.description)}</p> : null}
    {text(data.expiryDate) ? <p className="mt-4 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Available through {text(data.expiryDate)}</p> : null}
    {data.cta != null ? <div className="mt-6"><CtaLink value={data.cta} fallback="View offer" /></div> : null}
  </article>
);

/** Semantic fallback for CTA contracts without a bespoke renderer. */
export const CallsToActionRenderer: FlexCmsRenderer = ({ data, name }) => {
  const entries = Object.entries(data ?? {}).filter(([, value]) => value !== undefined && value !== null);
  const title = text(data.title ?? data.headline, name ? name.replace(/[-_]/g, ' ') : 'Campaign content');
  return (
    <section className="bg-surface px-6 py-10 sm:px-10 lg:px-12" data-flexcms-semantic-group="Calls to Action, Promotions & Campaigns">
      <div className="mx-auto max-w-7xl">
        <h2 className="font-headline text-3xl italic capitalize text-on-surface">{title}</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {entries.filter(([key]) => !['title', 'headline'].includes(key)).map(([key, value]) => (
            <div key={key}>
              <h3 className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">{key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ')}</h3>
              {key.toLowerCase().includes('cta') || key.toLowerCase().includes('link') ? <div className="mt-3"><CtaLink value={value} /></div> : <p className="mt-2 font-body text-sm leading-6 text-on-surface">{Array.isArray(value) ? value.map(item => label(item, 'Item')).join(' · ') : label(value, text(value, 'Not provided'))}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

