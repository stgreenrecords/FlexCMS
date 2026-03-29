'use client';

import { useState, useRef } from 'react';

export interface BeforeAfterImageData {
  /** Before image — 800×500 */
  beforeImage: string;
  /** After image — 800×500 */
  afterImage: string;
  labelBefore: string;
  labelAfter: string;
}

export function BeforeAfterImage({ data }: { data: BeforeAfterImageData }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.min(100, Math.max(0, (x / rect.width) * 100));
    setSliderPosition(pct);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const pct = Math.min(100, Math.max(0, (x / rect.width) * 100));
    setSliderPosition(pct);
  };

  return (
    <section className="py-10 bg-surface">
      <div
        ref={containerRef}
        className="relative aspect-video bg-surface-container-highest overflow-hidden rounded-lg cursor-col-resize select-none"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        aria-label="Before/After comparison"
      >
        {/* After image (base layer) */}
        <img
          src={data.afterImage}
          alt={data.labelAfter}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Before image (clipped) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={data.beforeImage}
            alt={data.labelBefore}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ width: `${(100 / sliderPosition) * 100}%`, maxWidth: 'none' }}
          />
        </div>

        {/* Divider line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-primary"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold text-on-primary">
            ↔
          </div>
        </div>

        {/* Labels */}
        <span className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
          {data.labelBefore}
        </span>
        <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
          {data.labelAfter}
        </span>
      </div>
    </section>
  );
}
