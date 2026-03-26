'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { WkndComponent } from '@/lib/flexcms';

interface Props {
  component: WkndComponent;
}

export function SearchRenderer({ component }: Props) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
        className="bg-white/10 text-white placeholder-white/60 border border-white/20 px-3 py-1.5 text-sm rounded focus:outline-none focus:border-wknd-yellow"
      />
      <button
        type="submit"
        className="text-white hover:text-wknd-yellow transition-colors"
        aria-label="Search"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </form>
  );
}
