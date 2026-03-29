import React from 'react';

export interface LeadershipGridData {
  title: string;
  leaders: string[];
  layout: 'grid' | 'list';
}

interface Props {
  data: LeadershipGridData;
  children?: React.ReactNode;
}

export function LeadershipGrid({ data, children }: Props) {
  const { title, layout } = data;

  return (
    <section className="py-8">
      {title && (
        <h2 className="font-headline italic text-on-surface text-3xl mb-8">{title}</h2>
      )}
      <div
        className={
          layout === 'grid'
            ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3'
            : 'flex flex-col gap-4'
        }
      >
        {children}
      </div>
    </section>
  );
}
