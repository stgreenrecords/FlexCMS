import React from 'react';

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  showFirstLast: boolean;
}

interface PaginationProps {
  data: PaginationData;
}

function buildUrl(baseUrl: string, page: number): string {
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}page=${page}`;
}

export function Pagination({ data }: PaginationProps) {
  const { currentPage, totalPages, baseUrl, showFirstLast } = data;

  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const delta = 2;
  const start = Math.max(1, currentPage - delta);
  const end = Math.min(totalPages, currentPage + delta);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  const btnBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.5rem',
    height: '2.5rem',
    border: '1px solid',
    fontFamily: 'inherit',
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'background-color 0.15s',
  };

  const btnDefault: React.CSSProperties = {
    ...btnBase,
    backgroundColor: 'transparent',
    color: 'var(--color-primary, #c6c6c7)',
    borderColor: 'var(--color-outline-variant, #32457c)',
  };

  const btnActive: React.CSSProperties = {
    ...btnBase,
    backgroundColor: 'var(--color-primary, #c6c6c7)',
    color: 'var(--color-on-primary, #070d1f)',
    borderColor: 'var(--color-primary, #c6c6c7)',
  };

  const btnDisabled: React.CSSProperties = {
    ...btnBase,
    backgroundColor: 'transparent',
    color: 'var(--color-outline-variant, #32457c)',
    borderColor: 'var(--color-outline-variant, #32457c)',
    cursor: 'not-allowed',
    opacity: 0.5,
  };

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1 py-8">
      {showFirstLast && (
        currentPage > 1 ? (
          <a href={buildUrl(baseUrl, 1)} style={btnDefault} aria-label="First page">«</a>
        ) : (
          <span style={btnDisabled} aria-disabled="true">«</span>
        )
      )}

      {currentPage > 1 ? (
        <a href={buildUrl(baseUrl, currentPage - 1)} style={btnDefault} aria-label="Previous page">‹</a>
      ) : (
        <span style={btnDisabled} aria-disabled="true">‹</span>
      )}

      {start > 1 && (
        <>
          <a href={buildUrl(baseUrl, 1)} style={btnDefault} aria-label="Page 1">1</a>
          {start > 2 && <span style={{ ...btnDefault, cursor: 'default', pointerEvents: 'none' }}>…</span>}
        </>
      )}

      {pages.map((page) =>
        page === currentPage ? (
          <span key={page} style={btnActive} aria-current="page">{page}</span>
        ) : (
          <a key={page} href={buildUrl(baseUrl, page)} style={btnDefault} aria-label={`Page ${page}`}>{page}</a>
        )
      )}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span style={{ ...btnDefault, cursor: 'default', pointerEvents: 'none' }}>…</span>}
          <a href={buildUrl(baseUrl, totalPages)} style={btnDefault} aria-label={`Page ${totalPages}`}>{totalPages}</a>
        </>
      )}

      {currentPage < totalPages ? (
        <a href={buildUrl(baseUrl, currentPage + 1)} style={btnDefault} aria-label="Next page">›</a>
      ) : (
        <span style={btnDisabled} aria-disabled="true">›</span>
      )}

      {showFirstLast && (
        currentPage < totalPages ? (
          <a href={buildUrl(baseUrl, totalPages)} style={btnDefault} aria-label="Last page">»</a>
        ) : (
          <span style={btnDisabled} aria-disabled="true">»</span>
        )
      )}
    </nav>
  );
}
