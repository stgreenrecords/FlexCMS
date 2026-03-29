'use client';

import { useState, useEffect } from 'react';

export interface TestimonialItem {
  /** Author photo — 64×64 */
  photo: string;
  quote: string;
  name: string;
  title: string;
  company: string;
}

export interface TestimonialSliderData {
  title: string;
  testimonials: TestimonialItem[];
  autoRotate: boolean;
}

export function TestimonialSlider({ data }: { data: TestimonialSliderData }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prev = () =>
    setCurrentIndex((i) => (i === 0 ? data.testimonials.length - 1 : i - 1));
  const next = () =>
    setCurrentIndex((i) => (i === data.testimonials.length - 1 ? 0 : i + 1));

  useEffect(() => {
    if (!data.autoRotate || data.testimonials.length < 2) return;
    const interval = setInterval(next, 6000);
    return () => clearInterval(interval);
  }, [data.autoRotate, data.testimonials.length]);

  if (!data.testimonials || data.testimonials.length === 0) return null;

  const testimonial = data.testimonials[currentIndex];

  return (
    <section className="py-12 bg-surface">
      {data.title && (
        <h2 className="text-2xl font-semibold text-on-surface text-center mb-8">
          {data.title}
        </h2>
      )}
      <div className="relative max-w-2xl mx-auto bg-surface-container-low rounded-xl p-8">
        <blockquote className="text-on-surface text-lg italic mb-6">
          &ldquo;{testimonial.quote}&rdquo;
        </blockquote>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-surface-container-highest flex-shrink-0">
            {testimonial.photo && (
              <img
                src={testimonial.photo}
                alt={testimonial.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div>
            <p className="font-semibold text-on-surface">{testimonial.name}</p>
            <p className="text-sm text-on-surface-variant">
              {testimonial.title}
              {testimonial.company && `, ${testimonial.company}`}
            </p>
          </div>
        </div>

        {data.testimonials.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous testimonial"
              className="absolute left-2 top-1/2 -translate-y-1/2 text-primary bg-black/30 rounded-full p-2"
            >
              &#8592;
            </button>
            <button
              onClick={next}
              aria-label="Next testimonial"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-primary bg-black/30 rounded-full p-2"
            >
              &#8594;
            </button>
          </>
        )}
      </div>

      {data.testimonials.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {data.testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className={`w-2 h-2 rounded-full transition ${
                i === currentIndex ? 'bg-primary' : 'bg-on-surface-variant/30'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
