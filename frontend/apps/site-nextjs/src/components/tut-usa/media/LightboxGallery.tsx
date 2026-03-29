'use client';

import { useState } from 'react';

export interface LightboxGalleryData {
  title: string;
  items: string[];
  enableCaptions: boolean;
  downloadAllowed: boolean;
}

export function LightboxGallery({ data }: { data: LightboxGalleryData }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const close = () => setActiveIndex(null);
  const prev = () =>
    setActiveIndex((i) =>
      i !== null ? (i === 0 ? data.items.length - 1 : i - 1) : null
    );
  const next = () =>
    setActiveIndex((i) =>
      i !== null ? (i === data.items.length - 1 ? 0 : i + 1) : null
    );

  return (
    <section className="py-10 bg-surface">
      {data.title && (
        <h2 className="text-2xl font-semibold text-on-surface mb-6">{data.title}</h2>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {data.items?.map((src, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className="bg-surface-container-highest rounded-lg overflow-hidden aspect-video focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label={`Open image ${i + 1}`}
          >
            <img
              src={src}
              alt={`Gallery item ${i + 1}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {activeIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={close}
        >
          <div
            className="relative max-w-4xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={data.items[activeIndex]}
              alt={`Lightbox image ${activeIndex + 1}`}
              className="w-full max-h-[80vh] object-contain rounded"
            />
            {data.enableCaptions && (
              <p className="text-center text-on-surface-variant mt-2 text-sm">
                Image {activeIndex + 1} of {data.items.length}
              </p>
            )}
            {data.downloadAllowed && (
              <a
                href={data.items[activeIndex]}
                download
                className="block text-center mt-2 text-primary text-sm underline"
                onClick={(e) => e.stopPropagation()}
              >
                Download
              </a>
            )}
            <button
              onClick={prev}
              aria-label="Previous"
              className="absolute left-2 top-1/2 -translate-y-1/2 text-primary bg-black/50 rounded-full p-2"
            >
              &#8592;
            </button>
            <button
              onClick={next}
              aria-label="Next"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-primary bg-black/50 rounded-full p-2"
            >
              &#8594;
            </button>
            <button
              onClick={close}
              aria-label="Close"
              className="absolute top-2 right-2 text-white bg-black/50 rounded-full px-3 py-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
