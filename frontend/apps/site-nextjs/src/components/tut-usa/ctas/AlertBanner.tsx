'use client';

import { useState } from 'react';

export interface AlertBannerData {
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  dismissible: boolean;
  link: string;
}

const severityStyles: Record<string, string> = {
  info: 'bg-surface-container text-on-surface border-outline-variant',
  warning: 'bg-tertiary-container text-on-tertiary-container border-tertiary',
  error: 'bg-error-container text-on-error-container border-error',
  success: 'bg-secondary-container text-on-secondary-container border-secondary',
};

export function AlertBanner({ data }: { data: AlertBannerData }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const style = severityStyles[data.severity] ?? severityStyles.info;

  return (
    <div
      role="alert"
      className={`w-full flex items-center justify-between gap-4 px-6 py-3 border-l-4 ${style}`}
    >
      <p className="text-sm font-body">{data.message}</p>
      <div className="flex items-center gap-4 shrink-0">
        {data.link && (
          <a href={data.link} className="text-sm font-bold underline hover:no-underline">
            Learn more
          </a>
        )}
        {data.dismissible && (
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss alert"
            className="text-current opacity-60 hover:opacity-100 transition-opacity text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
