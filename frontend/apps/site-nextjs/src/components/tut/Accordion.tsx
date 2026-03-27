import React from 'react';

/** tut/accordion — collapsible section container; children are tut/accordion-item components. */
export function Accordion({ data, children }: { data: Record<string, unknown>; children?: React.ReactNode }) {
  const title = data.title as string | undefined;

  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        {title && (
          <h2 className="text-3xl font-extrabold text-gray-900 mb-10">{title}</h2>
        )}
        <div className="divide-y divide-gray-100">
          {children}
        </div>
      </div>
    </section>
  );
}
