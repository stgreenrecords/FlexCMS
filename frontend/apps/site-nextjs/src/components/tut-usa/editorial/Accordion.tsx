'use client';

import { useState } from 'react';

export interface AccordionData {
  title: string;
  items: { question: string; answer: string }[];
  allowMultipleOpen: boolean;
  defaultOpenItem: number;
}

interface Props {
  data: AccordionData;
}

export function Accordion({ data }: Props) {
  const { title, items, allowMultipleOpen, defaultOpenItem } = data;

  const [openItems, setOpenItems] = useState<Set<number>>(() => {
    const initial = new Set<number>();
    if (defaultOpenItem >= 0 && defaultOpenItem < items.length) {
      initial.add(defaultOpenItem);
    }
    return initial;
  });

  const toggle = (index: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        if (!allowMultipleOpen) next.clear();
        next.add(index);
      }
      return next;
    });
  };

  return (
    <section className="py-6">
      {title && (
        <h3 className="font-headline italic text-on-surface text-2xl mb-6">{title}</h3>
      )}
      <div className="divide-y divide-outline-variant/20 border border-outline-variant/20 rounded-lg overflow-hidden">
        {items.map((item, i) => {
          const isOpen = openItems.has(i);
          return (
            <div key={i} className="bg-surface-container-low">
              <button
                type="button"
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left text-on-surface hover:text-primary transition-colors"
                aria-expanded={isOpen}
              >
                <span className="font-medium text-base">{item.question}</span>
                <span
                  className={`ml-4 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : 'rotate-0'
                  }`}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>
              {isOpen && (
                <div className="px-6 pb-4">
                  <p className="text-on-surface-variant leading-relaxed text-sm">{item.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
