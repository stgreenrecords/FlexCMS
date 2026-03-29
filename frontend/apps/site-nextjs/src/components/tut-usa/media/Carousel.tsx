'use client';

import { useState, useEffect } from 'react';

export interface CarouselSlide {
  /** Slide image — 1920×800 */
  image: string;
  headline: string;
  body: string;
  cta: {
    label: string;
    url: string;
  };
}

export interface CarouselData {
  slides: CarouselSlide[];
  autoRotate: boolean;
  rotationInterval: number;
  showControls: boolean;
}

export function Carousel({ data }: { data: CarouselData }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prev = () =>
    setCurrentIndex((i) => (i === 0 ? data.slides.length - 1 : i - 1));
  const next = () =>
    setCurrentIndex((i) => (i === data.slides.length - 1 ? 0 : i + 1));

  useEffect(() => {
    if (!data.autoRotate || data.slides.length < 2) return;
    const interval = setInterval(next, data.rotationInterval || 5000);
    return () => clearInterval(interval);
  }, [data.autoRotate, data.rotationInterval, data.slides.length]);

  if (!data.slides || data.slides.length === 0) return null;

  const slide = data.slides[currentIndex];

  return (
    <section className="relative w-full overflow-hidden bg-surface">
      <div className="relative aspect-video bg-surface-container-highest">
        {slide.image && (
          <img
            src={slide.image}
            alt={slide.headline}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-8">
          <h2 className="text-3xl font-bold text-white mb-2">{slide.headline}</h2>
          <p className="text-white/80 mb-4 max-w-xl">{slide.body}</p>
          {slide.cta?.label && (
            <a
              href={slide.cta.url}
              className="inline-block px-6 py-2 bg-primary text-on-primary font-semibold rounded w-fit"
            >
              {slide.cta.label}
            </a>
          )}
        </div>
      </div>

      {data.showControls && data.slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-primary bg-black/40 hover:bg-black/60 rounded-full p-2 transition"
          >
            &#8592;
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-primary bg-black/40 hover:bg-black/60 rounded-full p-2 transition"
          >
            &#8594;
          </button>
        </>
      )}

      {data.slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {data.slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`w-2 h-2 rounded-full transition ${
                i === currentIndex ? 'bg-primary' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
