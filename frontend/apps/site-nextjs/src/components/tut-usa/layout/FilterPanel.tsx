import React from 'react';

export interface FilterOption {
  label: string;
  options: string[];
}

export interface FilterPanelData {
  title: string;
  filters: FilterOption[];
  applyMode: 'instant' | 'manual';
}

interface FilterPanelProps {
  data: FilterPanelData;
}

export function FilterPanel({ data }: FilterPanelProps) {
  const { title, filters, applyMode } = data;

  return (
    <aside
      className="flex flex-col gap-6 p-6 border"
      style={{
        backgroundColor: 'var(--color-surface-container-low, #0a1228)',
        borderColor: 'var(--color-outline-variant, #32457c)',
      }}
    >
      <h2
        className="font-label text-xs tracking-widest uppercase"
        style={{ color: 'var(--color-primary, #c6c6c7)' }}
      >
        {title}
      </h2>

      <div className="flex flex-col gap-6">
        {filters.map((filter, filterIndex) => (
          <fieldset key={filterIndex} className="flex flex-col gap-3">
            <legend
              className="font-label text-xs tracking-widest uppercase mb-2"
              style={{ color: 'var(--color-on-surface, #dfe4ff)' }}
            >
              {filter.label}
            </legend>
            {filter.options.map((option, optionIndex) => (
              <label
                key={optionIndex}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  name={`filter-${filterIndex}`}
                  value={option}
                />
                <span
                  className="w-4 h-4 border flex-shrink-0"
                  style={{ borderColor: 'var(--color-outline-variant, #32457c)' }}
                  aria-hidden="true"
                />
                <span
                  className="text-sm"
                  style={{ color: 'var(--color-primary, #c6c6c7)' }}
                >
                  {option}
                </span>
              </label>
            ))}
          </fieldset>
        ))}
      </div>

      {applyMode === 'manual' && (
        <button
          type="button"
          className="font-label text-xs tracking-widest uppercase px-6 py-2 mt-2"
          style={{
            backgroundColor: 'var(--color-primary, #c6c6c7)',
            color: 'var(--color-on-primary, #070d1f)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Apply Filters
        </button>
      )}
    </aside>
  );
}
