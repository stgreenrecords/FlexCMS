import React from 'react';
import Image from 'next/image';

export interface EmptyStateData {
  title: string;
  message: string;
  /** Empty state illustration — 400×300 */
  illustration?: string;
  cta?: {
    label: string;
    url: string;
  };
}

interface EmptyStateProps {
  data: EmptyStateData;
}

export function EmptyState({ data }: EmptyStateProps) {
  const { title, message, illustration, cta } = data;

  return (
    <div className="flex flex-col items-center justify-center text-center gap-6 py-24 px-12">
      {illustration && (
        <div className="relative" style={{ width: '200px', height: '150px' }}>
          <Image
            src={illustration}
            alt=""
            fill
            sizes="200px"
            className="object-contain"
            aria-hidden="true"
          />
        </div>
      )}
      <div className="flex flex-col gap-3 max-w-md">
        <h2
          className="font-headline text-2xl italic"
          style={{ color: 'var(--color-on-surface, #dfe4ff)' }}
        >
          {title}
        </h2>
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--color-primary, #c6c6c7)' }}
        >
          {message}
        </p>
      </div>
      {cta?.url && (
        <a
          href={cta.url}
          className="inline-block font-label text-xs tracking-widest uppercase px-6 py-2"
          style={{
            backgroundColor: 'var(--color-primary, #c6c6c7)',
            color: 'var(--color-on-primary, #070d1f)',
          }}
        >
          {cta.label}
        </a>
      )}
    </div>
  );
}
