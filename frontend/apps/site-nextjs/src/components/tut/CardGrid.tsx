import React from 'react';

/** tut/card-grid — grid container that renders Card children in configurable columns. */
export function CardGrid({ data, children }: { data: Record<string, unknown>; children?: React.ReactNode }) {
  const columns = (data.columns as number | undefined) ?? 3;
  const title = data.title as string | undefined;

  const colClass: Record<number, string> = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
  };

  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {title && (
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-12 text-center">
            {title}
          </h2>
        )}
        <div className={`grid ${colClass[columns] ?? colClass[3]} gap-8`}>
          {children}
        </div>
      </div>
    </section>
  );
}
