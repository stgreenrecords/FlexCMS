import React from 'react';
import Image from 'next/image';

export interface IconCardData {
  title: string;
  description: string;
  /** Icon card image — 64×64 */
  icon?: string;
  cta?: {
    label: string;
    url: string;
  };
}

interface IconCardProps {
  data: IconCardData;
}

export function IconCard({ data }: IconCardProps) {
  const { title, description, icon, cta } = data;

  return (
    <article
      className="flex flex-col gap-4 p-8 border"
      style={{
        backgroundColor: 'var(--color-surface-container-low, #0a1228)',
        borderColor: 'rgba(50, 69, 124, 0.05)',
      }}
    >
      {icon && (
        <div className="flex-shrink-0">
          <Image
            src={icon}
            alt=""
            width={64}
            height={64}
            className="object-contain"
            aria-hidden="true"
          />
        </div>
      )}
      <h3
        className="font-headline text-xl italic"
        style={{ color: 'var(--color-on-surface, #dfe4ff)' }}
      >
        {title}
      </h3>
      <p
        className="text-sm leading-relaxed flex-1"
        style={{ color: 'var(--color-primary, #c6c6c7)' }}
      >
        {description}
      </p>
      {cta?.url && (
        <a
          href={cta.url}
          className="inline-block font-label text-xs tracking-widest uppercase px-6 py-2 self-start mt-auto"
          style={{
            backgroundColor: 'var(--color-primary, #c6c6c7)',
            color: 'var(--color-on-primary, #070d1f)',
          }}
        >
          {cta.label}
        </a>
      )}
    </article>
  );
}
