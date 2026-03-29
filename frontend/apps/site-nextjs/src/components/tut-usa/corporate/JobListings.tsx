'use client';

import { useState } from 'react';

export interface JobListingsData {
  title: string;
  jobs: string[];
  filterOptions: { label: string; value: string }[];
  searchEnabled: boolean;
}

interface Props {
  data: JobListingsData;
}

export function JobListings({ data }: Props) {
  const { title, jobs, filterOptions, searchEnabled } = data;

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  return (
    <section className="py-4">
      <h2 className="font-headline text-2xl text-[var(--color-on-surface)] mb-6">{title}</h2>

      {(searchEnabled || filterOptions.length > 0) && (
        <div className="flex flex-wrap gap-3 mb-6">
          {searchEnabled && (
            <input
              type="search"
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="font-label text-sm border border-outline-variant rounded px-3 py-2 bg-[var(--color-surface)] text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] w-56"
            />
          )}
          {filterOptions.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveFilter(activeFilter === opt.value ? '' : opt.value)}
              className={`font-label text-sm rounded-full px-4 py-1.5 border transition-colors ${
                activeFilter === opt.value
                  ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] border-[var(--color-primary)]'
                  : 'border-outline-variant text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {jobs.length === 0 ? (
        <p className="text-sm text-[var(--color-on-surface-variant)]">No job listings available at this time.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {jobs.map((jobRef, i) => (
            <li key={i} className="bg-surface-container rounded-xl p-4 border border-outline-variant text-sm text-[var(--color-on-surface)]">
              {jobRef}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
