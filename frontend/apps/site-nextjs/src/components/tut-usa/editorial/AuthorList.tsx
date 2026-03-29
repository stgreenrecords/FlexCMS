import React from 'react';

export interface AuthorListData {
  authors: string[];
  displayStyle: 'compact' | 'detailed';
}

interface Props {
  data: AuthorListData;
  children?: React.ReactNode;
}

export function AuthorList({ data, children }: Props) {
  const { authors, displayStyle } = data;

  if (displayStyle === 'compact') {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-label tracking-widest uppercase text-xs text-on-surface-variant">
          By
        </span>
        {authors.map((author, i) => (
          <span key={i} className="text-sm text-on-surface">
            {author}
            {i < authors.length - 1 && (
              <span className="text-on-surface-variant">, </span>
            )}
          </span>
        ))}
      </div>
    );
  }

  return (
    <section className="py-6">
      <h2 className="font-label tracking-widest uppercase text-xs text-on-surface-variant mb-4">
        Authors
      </h2>
      {children ? (
        <div className="flex flex-col gap-4">{children}</div>
      ) : (
        <ul className="flex flex-col gap-3">
          {authors.map((author, i) => (
            <li
              key={i}
              className="flex items-center gap-3 bg-surface-container-low border border-outline-variant/20 rounded-lg p-4"
            >
              <span className="w-10 h-10 rounded-full bg-primary/20 text-primary font-headline italic text-lg flex items-center justify-center shrink-0">
                {author.charAt(0)}
              </span>
              <span className="text-sm text-on-surface">{author}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
