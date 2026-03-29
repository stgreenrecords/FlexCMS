'use client';

import { useState } from 'react';

export interface CookieCategory {
  name: string;
  description: string;
  required?: boolean;
}

export interface CookieBannerData {
  message: string;
  policyLink: string;
  categories: CookieCategory[];
  consentMode: 'opt-in' | 'opt-out';
}

export function CookieBanner({ data }: { data: CookieBannerData }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 p-6 pointer-events-none">
      <div className="bg-surface-container-high/90 backdrop-blur-2xl p-8 max-w-2xl mx-auto border-t-2 border-primary pointer-events-auto shadow-2xl">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-grow">
            <h5 className="font-label text-xs uppercase tracking-widest font-bold mb-3 text-on-surface">
              Cookie Settings
            </h5>
            <p className="font-body text-xs text-secondary leading-relaxed">
              {data.message}{' '}
              {data.policyLink && (
                <a href={data.policyLink} className="text-primary underline">
                  Learn more
                </a>
              )}
            </p>
          </div>
          <div className="flex gap-4 shrink-0 w-full md:w-auto">
            <button
              onClick={() => setDismissed(true)}
              className="flex-1 md:flex-none border border-outline-variant/30 px-6 py-3 font-label text-xs uppercase tracking-widest text-on-surface hover:bg-surface-variant transition-all"
            >
              Customize
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="flex-1 md:flex-none bg-primary text-on-primary px-6 py-3 font-label text-xs uppercase tracking-widest font-bold hover:bg-primary-fixed transition-all"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
