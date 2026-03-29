'use client';

import { useEffect, useState } from 'react';

export interface ReadingProgressData {
  label: string;
  showPercent: boolean;
  position: 'top' | 'bottom';
}

interface Props {
  data: ReadingProgressData;
}

export function ReadingProgress({ data }: Props) {
  const { label, showPercent, position } = data;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const pct = docHeight > 0 ? Math.min(Math.round((scrollTop / docHeight) * 100), 100) : 0;
      setProgress(pct);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={`fixed left-0 right-0 z-50 ${position === 'top' ? 'top-0' : 'bottom-0'}`}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || 'Reading progress'}
    >
      {label && (
        <div
          className={`flex items-center justify-between px-4 py-1 bg-surface/80 backdrop-blur-sm ${
            position === 'top' ? 'border-b' : 'border-t'
          } border-outline-variant/20`}
        >
          <span className="font-label tracking-widest uppercase text-xs text-on-surface-variant">
            {label}
          </span>
          {showPercent && (
            <span className="font-label tracking-widest uppercase text-xs text-primary">
              {progress}%
            </span>
          )}
        </div>
      )}
      <div className="h-0.5 bg-outline-variant/20">
        <div
          className="h-full bg-primary transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
