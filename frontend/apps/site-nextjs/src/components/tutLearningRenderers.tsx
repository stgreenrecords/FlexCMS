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

function CtaLink({ value, fallback = 'Explore course' }: { value: unknown; fallback?: string }) {
  const entry = record(value);
  if (!entry && typeof value !== 'string') return null;
  return <a href={href(value)} className="inline-flex font-label text-[10px] uppercase tracking-[0.2em] text-primary underline-offset-4 hover:underline">{text(entry?.label ?? entry?.text ?? value, fallback)} →</a>;
}

export const CourseCardRenderer: FlexCmsRenderer = ({ data }) => (
  <article className="flex h-full flex-col border border-outline-variant/40 bg-surface p-6">
    <div className="flex flex-wrap gap-2">
      {text(data.level) ? <span className="border border-outline-variant px-2 py-1 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">{text(data.level)}</span> : null}
      {text(data.duration) ? <span className="border border-outline-variant px-2 py-1 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">{text(data.duration)}</span> : null}
    </div>
    <h3 className="mt-5 font-headline text-2xl italic text-on-surface">{text(data.courseTitle, 'Learning course')}</h3>
    {text(data.summary) ? <p className="mt-3 flex-1 font-body text-sm leading-6 text-on-surface-variant">{text(data.summary)}</p> : <div className="flex-1" />}
    {data.cta != null ? <div className="mt-6"><CtaLink value={data.cta} /></div> : null}
  </article>
);

export const CourseCatalogRenderer: FlexCmsRenderer = ({ data }) => {
  const courses = list(data.courses);
  const filters = list(data.filters);
  return (
    <section className="bg-surface-container-low px-6 py-16 sm:px-10 lg:px-12" aria-labelledby="course-catalog-title">
      <div className="mx-auto max-w-7xl">
        <p className="font-label text-[10px] uppercase tracking-[0.4em] text-primary">Build your knowledge</p>
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <h2 id="course-catalog-title" className="mt-3 font-headline text-4xl italic text-on-surface sm:text-5xl">{text(data.title, 'Learning catalog')}</h2>
          {typeof data.searchEnabled === 'boolean' ? <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">{data.searchEnabled ? 'Search enabled' : 'Browse all courses'}</span> : null}
        </div>
        {filters.length > 0 ? <div className="mt-8 flex flex-wrap gap-3">{filters.map((filter, index) => <span key={`${label(filter, `Filter ${index + 1}`)}-${index}`} className="border border-outline-variant px-3 py-2 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">{label(filter, `Filter ${index + 1}`)}</span>)}</div> : null}
        {courses.length > 0 ? (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course, index) => <CourseCardRenderer key={`${label(course, `Course ${index + 1}`)}-${index}`} data={record(course) ?? { courseTitle: course }} />)}
          </div>
        ) : <p className="mt-8 font-body text-sm text-on-surface-variant">No courses are currently available.</p>}
      </div>
    </section>
  );
};

export const ResourceListRenderer: FlexCmsRenderer = ({ data }) => {
  const resources = list(data.resources);
  return (
    <section className="bg-surface px-6 py-14 sm:px-10 lg:px-12" aria-labelledby="resource-list-title">
      <div className="mx-auto max-w-7xl">
        <h2 id="resource-list-title" className="font-headline text-3xl italic text-on-surface">{text(data.title, 'Recommended resources')}</h2>
        <ul className="mt-6 grid gap-3 md:grid-cols-3">
          {resources.map((resource, index) => <li key={`${href(resource)}-${index}`} className="border-b border-outline-variant/40 py-4"><a href={href(resource)} className="font-body text-sm text-primary underline-offset-4 hover:underline">{label(resource, `Resource ${index + 1}`)}</a></li>)}
        </ul>
      </div>
    </section>
  );
};

export const FaqRenderer: FlexCmsRenderer = ({ data }) => {
  const questions = list(data.questions);
  return (
    <section className="bg-surface-container-low px-6 py-14 sm:px-10 lg:px-12" aria-labelledby="faq-title">
      <div className="mx-auto max-w-4xl">
        <h2 id="faq-title" className="font-headline text-3xl italic text-on-surface">{text(data.title, 'Frequently asked questions')}</h2>
        <div className="mt-8 divide-y divide-outline-variant/40">
          {questions.map((question, index) => {
            const entry = record(question);
            return <details key={`${label(entry?.question ?? question, `Question ${index + 1}`)}-${index}`} className="py-5"><summary className="cursor-pointer font-body text-base text-on-surface">{label(entry?.question ?? question, `Question ${index + 1}`)}</summary>{text(entry?.answer) ? <p className="mt-3 font-body text-sm leading-6 text-on-surface-variant">{text(entry?.answer)}</p> : <p className="mt-3 font-body text-sm text-on-surface-variant">Answer coming soon.</p>}</details>;
          })}
        </div>
      </div>
    </section>
  );
};

/** Semantic fallback for authored Education, Learning & Developer Content components. */
export const EducationLearningRenderer: FlexCmsRenderer = ({ data, name }) => {
  const title = text(data.title ?? data.courseTitle ?? data.name, name ? name.replace(/[-_]/g, ' ') : 'Learning content');
  const entries = Object.entries(data ?? {}).filter(([key, value]) => value != null && !['title', 'courseTitle', 'name'].includes(key));
  return (
    <section className="bg-surface px-6 py-10 sm:px-10 lg:px-12" data-flexcms-semantic-group="Education, Learning & Developer Content">
      <div className="mx-auto max-w-7xl">
        <h2 className="font-headline text-3xl italic capitalize text-on-surface">{title}</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {entries.map(([key, value]) => <div key={key}><h3 className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">{key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ')}</h3><p className="mt-2 font-body text-sm leading-6 text-on-surface">{Array.isArray(value) ? value.map(item => label(item, 'Item')).join(' · ') : label(value, text(value, 'Not provided'))}</p></div>)}
        </div>
      </div>
    </section>
  );
};

