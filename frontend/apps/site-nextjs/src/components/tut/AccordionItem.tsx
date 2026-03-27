'use client';

import { useState } from 'react';

/** tut/accordion-item — collapsible question/answer row inside a tut/accordion. */
export function AccordionItem({ data }: { data: Record<string, unknown> }) {
  const title = data.title as string | undefined;
  const body = data.body as string | undefined;
  const [open, setOpen] = useState(false);

  return (
    <div className="py-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left gap-4 group"
        aria-expanded={open}
      >
        <span className="text-base font-semibold text-gray-900 group-hover:text-gray-600 transition-colors">
          {title}
        </span>
        <span
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-400 transition-transform duration-300"
          style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
          aria-hidden
        >
          +
        </span>
      </button>
      {open && body && (
        <div
          className="mt-4 prose prose-sm max-w-none text-gray-600"
          dangerouslySetInnerHTML={{ __html: body }}
        />
      )}
    </div>
  );
}
