import React from 'react';
import Image from 'next/image';

export interface SidebarPromoData {
  title: string;
  description: string;
  /** Sidebar promo image — 400×500 */
  image: string;
  cta: {
    label: string;
    url: string;
  };
}

interface SidebarPromoProps {
  data: SidebarPromoData;
}

export function SidebarPromo({ data }: SidebarPromoProps) {
  const { title, description, image, cta } = data;

  return (
    <aside
      className="flex flex-col overflow-hidden border"
      style={{
        backgroundColor: 'var(--color-surface-container-low, #0a1228)',
        borderColor: 'var(--color-outline-variant, #32457c)',
      }}
    >
      {image && (
        <div className="relative w-full" style={{ aspectRatio: '4/5' }}>
          <Image
            src={image}
            alt={title}
            fill
            sizes="400px"
            className="object-cover"
          />
        </div>
      )}
      <div className="p-8 flex flex-col gap-4 flex-1">
        <h3
          className="font-headline text-2xl italic"
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
            className="inline-block font-label text-xs tracking-widest uppercase px-6 py-2 text-center mt-2"
            style={{
              backgroundColor: 'var(--color-primary, #c6c6c7)',
              color: 'var(--color-on-primary, #070d1f)',
            }}
          >
            {cta.label}
          </a>
        )}
      </div>
    </aside>
  );
}
