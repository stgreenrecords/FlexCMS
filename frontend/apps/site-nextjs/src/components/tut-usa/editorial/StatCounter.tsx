'use client';

import { useEffect, useRef, useState } from 'react';

export interface StatCounterData {
  label: string;
  value: number;
  suffix: string;
  animation: boolean;
}

interface Props {
  data: StatCounterData;
}

export function StatCounter({ data }: Props) {
  const { label, value, suffix, animation } = data;
  const [displayed, setDisplayed] = useState(animation ? 0 : value);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!animation) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1200;
          const start = performance.now();
          const step = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayed(Math.round(eased * value));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [animation, value]);

  return (
    <div ref={ref} className="flex flex-col items-center gap-2 py-8">
      <span className="font-headline italic text-5xl text-on-surface">
        {displayed.toLocaleString()}
        {suffix && <span className="text-primary ml-1">{suffix}</span>}
      </span>
      <span className="font-label tracking-widest uppercase text-xs text-on-surface-variant">
        {label}
      </span>
    </div>
  );
}
