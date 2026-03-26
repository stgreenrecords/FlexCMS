'use client';

import { useState } from 'react';
import type { WkndComponent } from '@/lib/flexcms';
import { ComponentRenderer } from '../ComponentRenderer';

interface Props {
  component: WkndComponent;
}

export function CarouselRenderer({ component }: Props) {
  const items = component.children ?? [];
  const [current, setCurrent] = useState(0);

  if (items.length === 0) return null;

  const prev = () => setCurrent((c) => (c - 1 + items.length) % items.length);
  const next = () => setCurrent((c) => (c + 1) % items.length);

  return (
    <div className="relative overflow-hidden bg-wknd-black">
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {items.map((item, i) => (
          <div key={i} className="min-w-full">
            <ComponentRenderer component={item} />
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white w-10 h-10 flex items-center justify-center rounded-full transition-colors"
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white w-10 h-10 flex items-center justify-center rounded-full transition-colors"
            aria-label="Next"
          >
            ›
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === current ? 'bg-wknd-yellow' : 'bg-white/50'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
