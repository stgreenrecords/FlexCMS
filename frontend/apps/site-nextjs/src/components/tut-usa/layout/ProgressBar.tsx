import React from 'react';

export interface ProgressBarData {
  label: string;
  value: number;
  maxValue: number;
  showPercent: boolean;
}

interface ProgressBarProps {
  data: ProgressBarData;
}

export function ProgressBar({ data }: ProgressBarProps) {
  const { label, value, maxValue, showPercent } = data;

  const safeMax = maxValue > 0 ? maxValue : 100;
  const clampedValue = Math.min(Math.max(value, 0), safeMax);
  const percent = Math.round((clampedValue / safeMax) * 100);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between">
        <span
          className="font-label text-xs tracking-widest uppercase"
          style={{ color: 'var(--color-primary, #c6c6c7)' }}
        >
          {label}
        </span>
        {showPercent && (
          <span
            className="font-label text-xs tracking-widest"
            style={{ color: 'var(--color-on-surface, #dfe4ff)' }}
            aria-hidden="true"
          >
            {percent}%
          </span>
        )}
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        className="w-full"
        style={{
          height: '4px',
          backgroundColor: 'var(--color-outline-variant, #32457c)',
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: '100%',
            backgroundColor: 'var(--color-primary, #c6c6c7)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}
