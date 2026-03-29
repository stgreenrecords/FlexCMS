import React from 'react';

export interface ErrorPage404Link {
  label: string;
  url: string;
}

export interface ErrorPage404Data {
  title: string;
  message: string;
  suggestedLinks: ErrorPage404Link[];
  searchEnabled: boolean;
}

interface ErrorPage404Props {
  data: ErrorPage404Data;
}

export function ErrorPage404({ data }: ErrorPage404Props) {
  const { title, message, suggestedLinks, searchEnabled } = data;

  return (
    <main
      className="flex flex-col items-center justify-center min-h-screen px-12 text-center gap-10"
      style={{ backgroundColor: 'var(--color-surface, #070d1f)' }}
    >
      <div className="flex flex-col gap-4 max-w-xl">
        <p
          className="font-label text-xs tracking-widest uppercase"
          style={{ color: 'var(--color-primary, #c6c6c7)' }}
        >
          404
        </p>
        <h1
          className="font-headline text-5xl italic"
          style={{ color: 'var(--color-on-surface, #dfe4ff)' }}
        >
          {title}
        </h1>
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--color-primary, #c6c6c7)' }}
        >
          {message}
        </p>
      </div>

      {searchEnabled && (
        <form
          action="/search"
          method="get"
          className="flex w-full max-w-md"
        >
          <label htmlFor="search-404" className="sr-only">Search the site</label>
          <input
            id="search-404"
            type="search"
            name="q"
            placeholder="Search the site…"
            className="flex-1 px-4 py-2 text-sm border-y border-l bg-transparent"
            style={{
              color: 'var(--color-on-surface, #dfe4ff)',
              borderColor: 'var(--color-outline-variant, #32457c)',
            }}
          />
          <button
            type="submit"
            className="px-6 py-2 font-label text-xs tracking-widest uppercase"
            style={{
              backgroundColor: 'var(--color-primary, #c6c6c7)',
              color: 'var(--color-on-primary, #070d1f)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Search
          </button>
        </form>
      )}

      {suggestedLinks && suggestedLinks.length > 0 && (
        <nav aria-label="Suggested pages">
          <p
            className="font-label text-xs tracking-widest uppercase mb-4"
            style={{ color: 'var(--color-primary, #c6c6c7)' }}
          >
            You may be looking for
          </p>
          <ul className="flex flex-wrap justify-center gap-3">
            {suggestedLinks.map((link, index) => (
              <li key={index}>
                <a
                  href={link.url}
                  className="inline-block font-label text-xs tracking-widest uppercase px-5 py-2 border"
                  style={{
                    color: 'var(--color-on-surface, #dfe4ff)',
                    borderColor: 'var(--color-outline-variant, #32457c)',
                  }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </main>
  );
}
