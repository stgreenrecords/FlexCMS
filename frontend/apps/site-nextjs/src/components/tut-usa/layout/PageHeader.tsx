import React from 'react';
import Image from 'next/image';

export interface PageHeaderBreadcrumb {
  label: string;
  url: string;
}

export interface PageHeaderData {
  title: string;
  subtitle?: string;
  /** Page header background — 1920×600 */
  backgroundImage?: string;
  breadcrumbs?: PageHeaderBreadcrumb[];
}

interface PageHeaderProps {
  data: PageHeaderData;
}

export function PageHeader({ data }: PageHeaderProps) {
  const { title, subtitle, backgroundImage, breadcrumbs } = data;

  return (
    <header
      className="relative flex flex-col justify-end px-12 py-16 mb-16 overflow-hidden"
      style={{ minHeight: '300px' }}
    >
      {backgroundImage && (
        <Image
          src={backgroundImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          aria-hidden="true"
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(7,13,31,0.92) 40%, rgba(7,13,31,0.4) 100%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col gap-4">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 flex-wrap">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center gap-2">
                  {index > 0 && (
                    <span
                      className="font-label text-xs"
                      style={{ color: 'var(--color-primary, #c6c6c7)' }}
                      aria-hidden="true"
                    >
                      /
                    </span>
                  )}
                  {index < breadcrumbs.length - 1 ? (
                    <a
                      href={crumb.url}
                      className="font-label text-xs tracking-widest uppercase"
                      style={{ color: 'var(--color-primary, #c6c6c7)' }}
                    >
                      {crumb.label}
                    </a>
                  ) : (
                    <span
                      className="font-label text-xs tracking-widest uppercase"
                      style={{ color: 'var(--color-on-surface, #dfe4ff)' }}
                      aria-current="page"
                    >
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <h1
          className="font-headline text-5xl md:text-6xl italic"
          style={{ color: 'var(--color-on-surface, #dfe4ff)' }}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            className="text-base md:text-lg max-w-2xl"
            style={{ color: 'var(--color-primary, #c6c6c7)' }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
}
