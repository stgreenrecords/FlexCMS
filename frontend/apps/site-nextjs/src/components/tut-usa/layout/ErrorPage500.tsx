import React from 'react';

export interface ErrorPage500Data {
  title: string;
  message: string;
  supportLink: string;
  retryLabel: string;
}

interface ErrorPage500Props {
  data: ErrorPage500Data;
}

export function ErrorPage500({ data }: ErrorPage500Props) {
  const { title, message, supportLink, retryLabel } = data;

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
          500
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

      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-block font-label text-xs tracking-widest uppercase px-6 py-2"
          style={{
            backgroundColor: 'var(--color-primary, #c6c6c7)',
            color: 'var(--color-on-primary, #070d1f)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {retryLabel}
        </button>
        {supportLink && (
          <a
            href={supportLink}
            className="inline-block font-label text-xs tracking-widest uppercase px-6 py-2 border"
            style={{
              color: 'var(--color-on-surface, #dfe4ff)',
              borderColor: 'var(--color-outline-variant, #32457c)',
            }}
          >
            Contact Support
          </a>
        )}
      </div>
    </main>
  );
}
