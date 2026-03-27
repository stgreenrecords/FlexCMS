'use client';

import { useState } from 'react';

interface Language {
  code: string;
  label: string;
  url: string;
}

/** tut/language-selector — dropdown for switching between available locales. */
export function LanguageSelector({ data }: { data: Record<string, unknown> }) {
  const languages = (data.languages as Language[] | undefined) ?? [];
  const [open, setOpen] = useState(false);

  if (languages.length === 0) return null;

  const current = languages[0];

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-white transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{current.code.toUpperCase()}</span>
        <span aria-hidden className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full mt-2 bg-gray-900 border border-white/10 min-w-[120px] py-1 z-50"
        >
          {languages.map((lang) => (
            <li key={lang.code} role="option" aria-selected={lang.code === current.code}>
              <a
                href={lang.url}
                className="block px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                onClick={() => setOpen(false)}
              >
                {lang.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
