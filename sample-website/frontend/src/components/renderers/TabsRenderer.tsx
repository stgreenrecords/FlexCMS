'use client';

import { useState } from 'react';
import type { WkndComponent } from '@/lib/flexcms';
import { ComponentRenderer } from '../ComponentRenderer';

interface Props {
  component: WkndComponent;
}

export function TabsRenderer({ component }: Props) {
  const items = component.children ?? [];
  const [active, setActive] = useState(0);

  if (items.length === 0) return null;

  return (
    <div className="my-8">
      <div className="border-b border-gray-200 flex gap-0">
        {items.map((item, i) => {
          const label = (item.data?.cq_panelTitle as string) ?? (item.data?.title as string) ?? item.name ?? `Tab ${i + 1}`;
          return (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
                i === active
                  ? 'border-wknd-yellow text-wknd-black'
                  : 'border-transparent text-gray-500 hover:text-wknd-black'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div className="py-6">
        {items[active] && <ComponentRenderer component={items[active]} />}
      </div>
    </div>
  );
}
