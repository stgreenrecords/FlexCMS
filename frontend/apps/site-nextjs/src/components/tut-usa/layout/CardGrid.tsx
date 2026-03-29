import React from 'react';

export interface CardGridData {
  title?: string;
  columns: number;
  showEqualHeight: boolean;
}

interface CardGridProps {
  data: CardGridData;
  children?: React.ReactNode;
}

export function CardGrid({ data, children }: CardGridProps) {
  const { title, columns, showEqualHeight } = data;
  const cols = Math.min(Math.max(Math.round(columns), 1), 6);

  return (
    <div className="mb-32 px-12">
      {title && (
        <h2
          className="font-headline text-3xl italic mb-8"
          style={{ color: 'var(--color-on-surface, #dfe4ff)' }}
        >
          {title}
        </h2>
      )}
      <div
        className={`grid gap-8 ${showEqualHeight ? 'items-stretch' : 'items-start'}`}
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {React.Children.map(children, (child) => (
          <div className={showEqualHeight ? 'flex flex-col h-full' : undefined}>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
