'use client';

import { useState, type ReactNode } from 'react';

export interface ContentSliderData {
  title: string;
  items: string[];
  itemsPerView: number;
  showArrows: boolean;
  children?: ReactNode;
}

export function ContentSlider({ data }: { data: ContentSliderData }) {
  const [startIndex, setStartIndex] = useState(0);
  const perView = data.itemsPerView || 1;
  const total = data.items?.length ?? 0;

  const canPrev = startIndex > 0;
  const canNext = startIndex + perView < total;

  const prev = () => setStartIndex((i) => Math.max(0, i - 1));
  const next = () => setStartIndex((i) => Math.min(total - perView, i + 1));

  const visible = data.items?.slice(startIndex, startIndex + perView) ?? [];

  return (
    <section className="py-10 bg-surface">
      {data.title && (
        <h2 className="text-2xl font-semibold text-on-surface mb-6">{data.title}</h2>
      )}
      <div className="relative">
        <div
          className="flex gap-4 overflow-hidden"
          style={{ gridTemplateColumns: `repeat(${perView}, minmax(0, 1fr))` }}
        >
          {visible.map((item, i) => (
            <div
              key={startIndex + i}
              className="flex-1 bg-surface-container-low rounded-lg p-6 text-on-surface"
            >
              {item}
            </div>
          ))}
        </div>

        {data.showArrows && (
          <div className="flex gap-2 mt-4 justify-end">
            <button
              onClick={prev}
              disabled={!canPrev}
              aria-label="Previous"
              className="text-primary disabled:opacity-30 bg-surface-container-low px-4 py-2 rounded transition"
            >
              &#8592;
            </button>
            <button
              onClick={next}
              disabled={!canNext}
              aria-label="Next"
              className="text-primary disabled:opacity-30 bg-surface-container-low px-4 py-2 rounded transition"
            >
              &#8594;
            </button>
          </div>
        )}
      </div>
      {data.children}
    </section>
  );
}
