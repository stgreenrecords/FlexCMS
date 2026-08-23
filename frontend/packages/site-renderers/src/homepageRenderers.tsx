'use client';

import React from 'react';
import type { FlexCmsRenderer } from '@flexcms/react';
import { linkAttributes, toTutLink } from './tutLink';

const HERO_IMAGE = '/tut-usa/assets/images/57842e3aa2214c12-ab6axudqj78i-hchlovzt8msscx-elxwrzr3xeyr0u98zghv.png';
const COLLECTION_IMAGES = [
  '/tut-usa/assets/images/745a48367d30f08c-ab6axualrgeuj1pkguxz-qev-nfiundadh-qg6npp9j-u6ev.png',
  '/tut-usa/assets/images/a39a671c9b6c8e9c-ab6axucm3lchlreepc4lchpzlhr8vrjvbjpnajklqixvbpmv.png',
  '/tut-usa/assets/images/9de0abaea3a536f8-ab6axuafw0wabuqw1v8zg-og5ze7qp6qzuxhyocveind-she.png',
];
const CAMPAIGN_IMAGE = '/tut-usa/assets/images/50b2797c47fd2d79-ab6axudd4clhdtwhsfmt3n06umko3dreexfw2dvrvq8gktjt.png';
const JOURNAL_IMAGES = [
  '/tut-usa/assets/images/8a1510a14482d57b-ab6axudv3il8m7nlqvlhckqideue983g8rw2guy8tlhq3h7z.png',
  '/tut-usa/assets/images/3dbb173ded1c28e9-ab6axuczxu8mwrei4lg25i8taljzbhwypnxy9-usibvvhois.png',
  '/tut-usa/assets/images/cd8e6833585dfb56-ab6axudzuhyk2ukt2lt2pgijy5vi-goe1dqxbe-0dm9nyawg.png',
];

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function asList(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object');
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') return asString((item as Record<string, unknown>).title, asString((item as Record<string, unknown>).description));
      return '';
    })
    .filter((item) => item.length > 0);
}


function getImageUrl(value: unknown): string {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  if (value && typeof value === 'object') {
    const entry = value as Record<string, unknown>;
    return asString(entry.url, asString(entry.src, asString(entry.path, '/tut-usa/assets/images/57842e3aa2214c12-ab6axudqj78i-hchlovzt8msscx-elxwrzr3xeyr0u98zghv.png')));
  }
  const fallback = '/tut-usa/assets/images/57842e3aa2214c12-ab6axudqj78i-hchlovzt8msscx-elxwrzr3xeyr0u98zghv.png';
  return fallback;
}

function toBrowserImageUrl(url: string): string {
  if (url.startsWith('/api/author/assets/')) {
    return `http://localhost:8080${url}`;
  }
  return url;
}

export const NavigationRenderer: FlexCmsRenderer = ({ data }) => {
  const brand = asString(data.logo, 'TUT');
  const items = asList(data.primaryLinks).map((item) => toTutLink(item)).filter((item): item is NonNullable<typeof item> => item !== null);
  const utilityItems = asList(data.utilityLinks).map((item) => toTutLink(item)).filter((item): item is NonNullable<typeof item> => item !== null);
  const account = toTutLink(data.accountEntry);
  const dealer = utilityItems.find((item) => /dealer/i.test(item.label)) ?? null;

  return (
    <nav className="fixed top-0 z-50 flex w-full max-w-none items-center justify-between bg-slate-950/60 px-12 py-6 backdrop-blur-xl">
      <div className="flex items-center gap-12">
        <span className="font-headline text-2xl uppercase tracking-[0.2em] text-slate-100">{brand}</span>
        <div className="hidden items-center gap-8 md:flex">
          {items.map((link, index) => {
            return (
              <a key={`${link.label}-${index}`} href={link.url} {...linkAttributes(link)} className="font-label text-[11px] uppercase tracking-widest text-slate-400 transition-colors duration-300 hover:text-slate-100">
                {link.label}
              </a>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-6">
        {utilityItems.filter((item) => item !== dealer).map((link, index) => <a key={`${link.label}-${index}`} href={link.url} {...linkAttributes(link)} className="font-label text-[11px] uppercase tracking-widest text-slate-400 transition-colors duration-500 hover:text-slate-100">{link.label}</a>)}
        {account ? <a href={account.url} {...linkAttributes(account)} className="font-label text-[11px] uppercase tracking-widest text-slate-400 transition-colors duration-500 hover:text-slate-100">{account.label}</a> : null}
        {dealer ? <a href={dealer.url} {...linkAttributes(dealer)} className="bg-primary px-6 py-2 font-label text-[11px] uppercase tracking-widest text-on-primary transition-all hover:bg-primary-fixed">{dealer.label}</a> : null}
      </div>
    </nav>
  );
};

export const HeroBannerRenderer: FlexCmsRenderer = ({ data }) => {
  const primary = toTutLink(data.primaryCta, 'Explore Vehicles');
  const secondary = toTutLink(data.secondaryCta, 'Book a Test Drive');
  const image = getImageUrl(data.backgroundImage);

  return (
    <header className="relative flex h-screen w-full items-end overflow-hidden bg-surface">
      <div className="absolute inset-0 z-0">
        <img src={image} alt={asString(data.headline, 'Hero')} className="h-full w-full object-cover grayscale-[0.2]" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-r from-surface/40 to-transparent" />
      </div>
      <div className="relative z-10 grid w-full grid-cols-1 items-end px-12 pb-24 pt-36 md:grid-cols-12">
        <div className="md:col-span-8">
          <h1 className="font-headline text-6xl italic leading-none tracking-tighter text-slate-100 md:text-8xl lg:text-[9rem]">TUT S.</h1>
          <p className="mt-6 max-w-xl font-body text-lg leading-relaxed text-on-surface-variant md:text-xl">A manifestation of high-performance engineering and bespoke luxury. Redefining the standard of the precision atelier.</p>
          <div className="mt-10 flex flex-wrap gap-4">
            {primary ? <a href={primary.url} {...linkAttributes(primary)} className="bg-primary px-10 py-4 font-label text-xs uppercase tracking-[0.2em] text-on-primary transition-all duration-300 hover:bg-primary-fixed">{primary.label}</a> : null}
            {secondary ? <a href={secondary.url} {...linkAttributes(secondary)} className="border border-outline-variant/30 px-10 py-4 font-label text-xs uppercase tracking-[0.2em] text-on-surface transition-all duration-300 hover:bg-on-surface/5">{secondary.label}</a> : null}
          </div>
        </div>
        <div className="hidden md:flex md:col-span-4 justify-end">
          <div className="flex flex-col gap-8 border-l border-outline-variant/20 pl-8 text-right">
            <div>
              <span className="font-headline text-4xl italic text-slate-100">2.1s</span>
              <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">0-60 MPH</p>
            </div>
            <div>
              <span className="font-headline text-4xl italic text-slate-100">480mi</span>
              <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">EST. RANGE</p>
            </div>
            <div>
              <span className="font-headline text-4xl italic text-slate-100">1020hp</span>
              <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">PEAK POWER</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export const CampaignHeroRenderer: FlexCmsRenderer = ({ data }) => {
  const cta = toTutLink(data.cta, 'Discover our vision');
  const image = CAMPAIGN_IMAGE;

  return (
    <section className="relative flex min-h-[70vh] items-center overflow-hidden bg-surface-container-low">
      <div className="absolute right-0 top-0 z-0 h-full w-full md:w-3/5">
        <img src={image} alt={asString(data.title, 'Campaign')} className="h-full w-full object-cover opacity-60 grayscale" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-surface-container-low to-surface-container-low" />
      </div>
      <div className="relative z-10 max-w-2xl px-12 py-20">
        <span className="mb-6 block font-label text-[10px] uppercase tracking-[0.5em] text-primary">Innovation Leadership</span>
        <h2 className="mb-8 font-headline text-5xl italic leading-tight text-slate-100 md:text-7xl">{asString(data.title, 'The Silence of Pure Power.')}</h2>
        <p className="mb-10 font-body text-lg leading-relaxed text-on-surface-variant">{asString(data.description, 'Electrification at TUT is about uncompromising performance.')}</p>
        {cta ? <a href={cta.url} {...linkAttributes(cta)} className="group flex items-center gap-4 font-label text-xs uppercase tracking-widest text-slate-100">
          {cta.label}<span className="text-sm transition-transform duration-300 group-hover:translate-x-2">{'->'}</span>
        </a> : null}
      </div>
    </section>
  );
};

export const ProductGridRenderer: FlexCmsRenderer = ({ data }) => {
  const products = asList(data.products);
  const cards = products.length ? products : [{ title: 'Sedans' }, { title: 'SUVs' }, { title: 'Electric' }];
  const [first, second, third] = cards;
  const firstLink = toTutLink(first?.cta, `Explore ${asString(first?.productName, 'vehicle')}`);

  return (
    <section className="bg-surface px-12 py-24">
      <div className="mb-14 flex flex-col items-baseline justify-between gap-3 md:flex-row">
        <h2 className="font-headline text-5xl italic text-slate-100 md:text-6xl">{asString(data.title, 'The Collection')}</h2>
        <p className="font-label text-[10px] uppercase tracking-[0.3em] text-on-surface-variant">Precision Engineering Across Segments</p>
      </div>
      <div className="grid h-auto grid-cols-1 gap-6 md:h-[700px] md:grid-cols-12">
        <article className="relative overflow-hidden md:col-span-7 md:h-full">
          {firstLink ? <a href={firstLink.url} {...linkAttributes(firstLink)} aria-label={firstLink.label} className="absolute inset-0 z-10" /> : null}
          <img src={COLLECTION_IMAGES[0]} alt={asString(first?.productName, 'Sedans')} className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 to-transparent" />
          <div className="absolute bottom-8 left-8">
            <h3 className="font-headline text-3xl italic text-slate-100">{asString(first?.productName, 'Sedans')}</h3>
          </div>
        </article>
        <div className="grid gap-6 md:col-span-5 md:grid-rows-2">
          {[second, third].map((item, index) => (
            <article key={`collection-${index}`} className="relative overflow-hidden md:h-full">
              {(() => { const itemLink = toTutLink(item?.cta, `Explore ${asString(item?.productName, `model ${index + 2}`)}`); return itemLink ? <a href={itemLink.url} {...linkAttributes(itemLink)} aria-label={itemLink.label} className="absolute inset-0 z-10" /> : null; })()}
              <img src={COLLECTION_IMAGES[index + 1]} alt={asString(item?.productName, `Model ${index + 2}`)} className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 to-transparent" />
              <div className="absolute bottom-8 left-8">
                <h3 className="font-headline text-3xl italic text-slate-100">{asString(item?.productName, `Model ${index + 2}`)}</h3>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export const FeatureListRenderer: FlexCmsRenderer = ({ data }) => {
  const features = asList(data.features);
  const lead = features[0] ?? {};
  const body = asString((lead as Record<string, unknown>).description, 'Electrification at TUT is not compromise. It is the next precision frontier.');
  return (
    <section className="relative min-h-[560px] overflow-hidden bg-surface-container-low px-12 py-24">
      <div className="absolute inset-y-0 right-0 w-full bg-gradient-to-l from-surface-container-high to-surface-container-low opacity-60 md:w-1/2" />
      <div className="relative z-10 max-w-2xl">
        <span className="mb-5 block font-label text-[10px] uppercase tracking-[0.5em] text-primary">Innovation Leadership</span>
        <h2 className="mb-8 font-headline text-5xl italic leading-tight text-slate-100 md:text-7xl">The Silence of<br/>Pure Power.</h2>
        <p className="font-body text-base leading-relaxed text-on-surface-variant md:text-lg">{body}</p>
      </div>
    </section>
  );
};

export const FeaturedContentRenderer: FlexCmsRenderer = ({ data }) => {
  const items = Array.isArray(data.items) ? data.items : [];
  const viewAll = toTutLink(data.viewAll, 'View all');
  return (
    <section className="bg-surface px-12 py-24">
      <div className="mb-14 flex items-end justify-between">
        <h2 className="font-headline text-5xl italic text-slate-100">{asString(data.title, 'The Journal')}</h2>
        {viewAll ? <a href={viewAll.url} {...linkAttributes(viewAll)} className="border-b border-outline-variant pb-1 font-label text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-primary">{viewAll.label}</a> : null}
      </div>
      <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
        {(items.length ? items : ['Engineering precision at scale.', 'Interior systems refined for long-haul comfort.', 'Owner journeys built around trust and clarity.']).map((item, idx) => {
          const link = toTutLink(item, 'Read story');
          const text = link?.label ?? (typeof item === 'string' ? item : 'Featured story');
          return <article key={`featured-${idx}`} className="group relative flex flex-col">
            {link ? <a href={link.url} {...linkAttributes(link)} aria-label={link.label} className="absolute inset-0 z-10" /> : null}
            <div className="mb-8 aspect-[4/5] overflow-hidden bg-surface-container">
              <img src={JOURNAL_IMAGES[idx]} alt={text} className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0" loading="lazy" />
            </div>
            <span className="mb-3 block font-label text-[9px] uppercase tracking-[0.4em] text-primary">{idx === 0 ? 'Engineering' : idx === 1 ? 'Design' : 'Community'}</span>
            <h3 className="mb-3 font-headline text-2xl italic text-slate-100">{text}</h3>
            <p className="font-body text-sm leading-relaxed text-on-surface-variant">Latest updates from TUT engineering, design, and ownership programs.</p>
          </article>;
        })}
      </div>
    </section>
  );
};

export const DealerLocatorRenderer: FlexCmsRenderer = ({ data }) => {
  return null;
};

export const NewsletterSignupRenderer: FlexCmsRenderer = ({ data }) => (
  <section className="bg-surface-container-lowest px-12 py-24 text-center">
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-6 font-headline text-4xl italic text-slate-100">{asString(data.title, 'Stay Ahead of the Curve')}</h2>
      <p className="mb-6 font-body text-on-surface-variant">{asString(data.description, 'Receive thoughtful updates on launches, ownership, and events.')}</p>
      <form className="flex w-full flex-col gap-4 md:flex-row">
        <input className="flex-grow border-b border-outline-variant/50 bg-transparent px-2 py-4 font-label text-[10px] uppercase tracking-widest text-slate-100 outline-none placeholder:text-on-secondary-fixed-variant" placeholder="Enter your email" type="email" />
        <button className="shrink-0 bg-primary px-12 py-4 font-label text-xs uppercase tracking-widest text-on-primary transition-all hover:bg-primary-fixed" type="submit">
          Subscribe
        </button>
      </form>
      <p className="mt-4 font-label text-[10px] text-on-surface-variant">{asString(data.consentText, 'I consent to receiving TUT USA updates.')}</p>
    </div>
  </section>
);

export const FooterRenderer: FlexCmsRenderer = ({ data }) => {
  const groups = asList(data.footerLinkGroups).map((group) => ({
    title: asString(group.title, 'Links'),
    links: (Array.isArray(group.links) ? group.links : []).map((item) => toTutLink(item)).filter((item): item is NonNullable<typeof item> => item !== null),
  })).filter((group) => group.links.length > 0);
  const socialLinks = (Array.isArray(data.socialLinks) ? data.socialLinks : []).map((item) => toTutLink(item)).filter((item): item is NonNullable<typeof item> => item !== null);
  const legalLinks = (Array.isArray(data.legalLinks) ? data.legalLinks : []).map((item) => toTutLink(item)).filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <footer className="border-t border-slate-800/30 bg-slate-950 text-slate-500">
      <div className="grid grid-cols-2 gap-12 px-12 py-20 md:grid-cols-4 lg:grid-cols-6">
        <div className="col-span-2">
          <span className="mb-6 block font-headline text-3xl tracking-tighter text-slate-200">{asString(data.brandName, 'TUT')}</span>
          <p className="mb-8 max-w-xs font-label text-[10px] uppercase tracking-widest text-slate-500">Dedicated to the relentless pursuit of engineering perfection and the art of the machine.</p>
        </div>
        {groups.map((group) => <div key={group.title} className="flex flex-col gap-4"><span className="mb-2 font-label text-[10px] uppercase tracking-widest text-slate-200">{group.title}</span>{group.links.map((link) => <a key={`${group.title}-${link.label}`} href={link.url} {...linkAttributes(link)} className="font-label text-[10px] uppercase tracking-widest">{link.label}</a>)}</div>)}
        {socialLinks.length > 0 ? <div className="flex flex-col gap-4"><span className="mb-2 font-label text-[10px] uppercase tracking-widest text-slate-200">Social</span>{socialLinks.map((link) => <a key={link.label} href={link.url} {...linkAttributes(link)} className="font-label text-[10px] uppercase tracking-widest">{link.label}</a>)}</div> : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-900 px-12 py-8">
        <span className="font-label text-[10px] uppercase tracking-widest text-slate-600">{asString(data.copyrightText, '© 2026 TUT USA. ALL RIGHTS RESERVED.')}</span>
        {legalLinks.length > 0 ? <nav aria-label="Legal" className="flex flex-wrap gap-4">{legalLinks.map((link) => <a key={link.label} href={link.url} {...linkAttributes(link)} className="font-label text-[10px] uppercase tracking-widest">{link.label}</a>)}</nav> : null}
      </div>
    </footer>
  );
};

export const PageMetadataRenderer: FlexCmsRenderer = () => null;

export const LatestNewsRenderer: FlexCmsRenderer = ({ data }) => (
  <section className="bg-surface px-12 py-20">
    <div className="mx-auto max-w-5xl border border-outline-variant/30 bg-surface-container-low p-8">
      <h2 className="mb-4 font-headline text-4xl italic text-slate-100">{asString(data.title, 'Latest updates')}</h2>
      <p className="font-body text-sm text-on-surface-variant">
        Source: {asString(data.source, 'TUT Newsroom')} · Showing {typeof data.count === 'number' ? data.count : 3} updates
      </p>
    </div>
  </section>
);


