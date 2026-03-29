import React from 'react';

export interface PageFooterSectionData {
  headline: string;
  body: string;
  cta: {
    label: string;
    url: string;
  };
  theme: 'light' | 'dark';
}

interface PageFooterSectionProps {
  data: PageFooterSectionData;
}

export function PageFooterSection({ data }: PageFooterSectionProps) {
  const { headline, body, cta, theme } = data;

  const isDark = theme === 'dark';
  const bgColor = isDark
    ? 'var(--color-surface, #070d1f)'
    : 'var(--color-surface-container-low, #0a1228)';
  const headlineColor = isDark
    ? 'var(--color-on-surface, #dfe4ff)'
    : 'var(--color-on-surface, #dfe4ff)';
  const bodyColor = isDark
    ? 'var(--color-primary, #c6c6c7)'
    : 'var(--color-primary, #c6c6c7)';
  const ctaBg = isDark
    ? 'var(--color-primary, #c6c6c7)'
    : 'var(--color-on-surface, #dfe4ff)';
  const ctaColor = isDark
    ? 'var(--color-on-primary, #070d1f)'
    : 'var(--color-surface, #070d1f)';

  return (
    <section
      className="px-12 py-16 flex flex-col md:flex-row items-center justify-between gap-8"
      style={{ backgroundColor: bgColor }}
    >
      <div className="flex flex-col gap-3 max-w-2xl">
        <h2
          className="font-headline text-3xl italic"
          style={{ color: headlineColor }}
        >
          {headline}
        </h2>
        <p
          className="text-sm leading-relaxed"
          style={{ color: bodyColor }}
        >
          {body}
        </p>
      </div>
      {cta?.url && (
        <a
          href={cta.url}
          className="inline-block font-label text-xs tracking-widest uppercase px-8 py-3 flex-shrink-0"
          style={{
            backgroundColor: ctaBg,
            color: ctaColor,
          }}
        >
          {cta.label}
        </a>
      )}
    </section>
  );
}
