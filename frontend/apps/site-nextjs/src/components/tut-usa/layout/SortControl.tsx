import React from 'react';

export interface SortControlData {
  label: string;
  options: string[];
  defaultOption: string;
}

interface SortControlProps {
  data: SortControlData;
}

export function SortControl({ data }: SortControlProps) {
  const { label, options, defaultOption } = data;

  return (
    <div className="flex items-center gap-4">
      <label
        htmlFor="sort-control"
        className="font-label text-xs tracking-widest uppercase flex-shrink-0"
        style={{ color: 'var(--color-primary, #c6c6c7)' }}
      >
        {label}
      </label>
      <div className="relative">
        <select
          id="sort-control"
          defaultValue={defaultOption}
          className="appearance-none pl-3 pr-8 py-2 font-label text-xs tracking-widest uppercase border bg-transparent"
          style={{
            color: 'var(--color-on-surface, #dfe4ff)',
            borderColor: 'var(--color-outline-variant, #32457c)',
            backgroundColor: 'var(--color-surface-container-low, #0a1228)',
            cursor: 'pointer',
          }}
        >
          {options.map((option, index) => (
            <option
              key={index}
              value={option}
              style={{
                backgroundColor: 'var(--color-surface, #070d1f)',
                color: 'var(--color-on-surface, #dfe4ff)',
              }}
            >
              {option}
            </option>
          ))}
        </select>
        <span
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs"
          style={{ color: 'var(--color-primary, #c6c6c7)' }}
          aria-hidden="true"
        >
          ▾
        </span>
      </div>
    </div>
  );
}
