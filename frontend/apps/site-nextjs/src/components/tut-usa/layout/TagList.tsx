import React from 'react';

export interface TagListData {
  tags: string[];
  linkMode: boolean;
}

interface TagListProps {
  data: TagListData;
}

function slugify(tag: string): string {
  return tag.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function TagList({ data }: TagListProps) {
  const { tags, linkMode } = data;

  if (!tags || tags.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2" aria-label="Tags">
      {tags.map((tag, index) => (
        <li key={index}>
          {linkMode ? (
            <a
              href={`/tag/${slugify(tag)}`}
              className="inline-block font-label text-xs tracking-widest uppercase px-3 py-1 border transition-colors"
              style={{
                color: 'var(--color-primary, #c6c6c7)',
                borderColor: 'var(--color-outline-variant, #32457c)',
                backgroundColor: 'transparent',
              }}
            >
              {tag}
            </a>
          ) : (
            <span
              className="inline-block font-label text-xs tracking-widest uppercase px-3 py-1 border"
              style={{
                color: 'var(--color-primary, #c6c6c7)',
                borderColor: 'var(--color-outline-variant, #32457c)',
                backgroundColor: 'var(--color-surface-container-low, #0a1228)',
              }}
            >
              {tag}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
