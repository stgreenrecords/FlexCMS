'use client';

import { useState } from 'react';

/** tut/gallery — responsive image gallery in carousel or grid layout. */
export function Gallery({ data }: { data: Record<string, unknown> }) {
  const images = (data.images as string[] | undefined) ?? [];
  const layout = (data.layout as string | undefined) ?? 'carousel';
  const columns = (data.columns as number | undefined) ?? 3;
  const [activeIdx, setActiveIdx] = useState(0);

  if (images.length === 0) return null;

  if (layout === 'grid') {
    const colClass: Record<number, string> = {
      2: 'grid-cols-2',
      3: 'grid-cols-2 md:grid-cols-3',
      4: 'grid-cols-2 md:grid-cols-4',
    };
    return (
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className={`grid ${colClass[columns] ?? colClass[3]} gap-3`}>
            {images.map((src, i) => (
              <div key={i} className="aspect-square overflow-hidden">
                <img src={src} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // carousel
  const prev = () => setActiveIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setActiveIdx((i) => (i + 1) % images.length);

  return (
    <section className="py-16 bg-gray-950">
      <div className="relative max-w-6xl mx-auto px-6">
        <div className="aspect-video overflow-hidden">
          <img src={images[activeIdx]} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous"
              className="absolute left-8 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black/50 text-white hover:bg-black/80 transition-colors"
            >
              ‹
            </button>
            <button
              onClick={next}
              aria-label="Next"
              className="absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black/50 text-white hover:bg-black/80 transition-colors"
            >
              ›
            </button>
            <div className="flex justify-center gap-2 mt-4">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === activeIdx ? 'bg-white' : 'bg-white/30'}`}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
