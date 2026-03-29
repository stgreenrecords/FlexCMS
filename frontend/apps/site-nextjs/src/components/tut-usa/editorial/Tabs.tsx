'use client';

import { useState } from 'react';

export interface TabsData {
  title: string;
  tabs: { label: string; content: string }[];
  defaultTab: string;
  orientation: 'horizontal' | 'vertical';
}

interface Props {
  data: TabsData;
}

export function Tabs({ data }: Props) {
  const { title, tabs, defaultTab, orientation } = data;

  const initialIndex = Math.max(
    0,
    tabs.findIndex((t) => t.label === defaultTab)
  );
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const isVertical = orientation === 'vertical';

  return (
    <section className="py-6">
      {title && (
        <h3 className="font-headline italic text-on-surface text-2xl mb-6">{title}</h3>
      )}
      <div className={`flex ${isVertical ? 'flex-row gap-6' : 'flex-col'}`}>
        <div
          role="tablist"
          aria-orientation={orientation}
          className={`flex ${
            isVertical
              ? 'flex-col gap-1 border-r border-outline-variant/20 pr-4 min-w-[160px]'
              : 'flex-row gap-1 border-b border-outline-variant/20 mb-4'
          }`}
        >
          {tabs.map((tab, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={activeIndex === i}
              onClick={() => setActiveIndex(i)}
              className={`px-4 py-2 text-sm font-label tracking-widest uppercase transition-colors text-left whitespace-nowrap ${
                activeIndex === i
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div role="tabpanel" className="flex-1">
          {tabs[activeIndex] && (
            <p className="text-on-surface-variant leading-relaxed whitespace-pre-line">
              {tabs[activeIndex].content}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
