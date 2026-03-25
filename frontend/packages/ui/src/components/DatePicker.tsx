'use client';

import React, { useState } from 'react';
import { cn } from '../lib/utils';

// ---------------------------------------------------------------------------
// DatePicker — simple, no external calendar lib required.
// Uses an <input type="date"> for native browser date picking,
// styled to match the FlexCMS design system tokens.
// ---------------------------------------------------------------------------

export interface DatePickerProps {
  /** Controlled ISO date string value (YYYY-MM-DD) */
  value?: string;
  /** Called with the new ISO date string when the value changes */
  onChange?: (value: string) => void;
  /** Minimum selectable date (ISO format) */
  min?: string;
  /** Maximum selectable date (ISO format) */
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder,
  disabled = false,
  className,
  id,
  name,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}: DatePickerProps) {
  const [internalValue, setInternalValue] = useState<string>('');
  const controlled = value !== undefined;
  const currentValue = controlled ? (value ?? '') : internalValue;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    if (!controlled) setInternalValue(newValue);
    onChange?.(newValue);
  }

  return (
    <div className={cn('relative', className)}>
      <input
        type="date"
        id={id}
        name={name}
        value={currentValue}
        min={min}
        max={max}
        disabled={disabled}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        className={cn(
          'flex h-9 w-full',
          'rounded-[var(--radius-md)]',
          'border border-[var(--color-input)]',
          'bg-[var(--color-background)] text-[var(--color-foreground)]',
          'px-3 py-1 text-sm shadow-sm',
          'ring-offset-[var(--color-background)]',
          'focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Normalize date input appearance across browsers
          '[color-scheme:light] dark:[color-scheme:dark]',
        )}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// DateRangePicker — two DatePickers for start + end date
// ---------------------------------------------------------------------------

export interface DateRange {
  from?: string;
  to?: string;
}

export interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  min,
  max,
  disabled,
  className,
}: DateRangePickerProps) {
  const [internalFrom, setInternalFrom] = useState<string>('');
  const [internalTo, setInternalTo]     = useState<string>('');
  const controlled = value !== undefined;

  const from = controlled ? (value?.from ?? '') : internalFrom;
  const to   = controlled ? (value?.to   ?? '') : internalTo;

  function handleFrom(newFrom: string) {
    if (!controlled) setInternalFrom(newFrom);
    onChange?.({ from: newFrom, to: controlled ? value?.to : internalTo });
  }

  function handleTo(newTo: string) {
    if (!controlled) setInternalTo(newTo);
    onChange?.({ from: controlled ? value?.from : internalFrom, to: newTo });
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <DatePicker
        value={from}
        onChange={handleFrom}
        min={min}
        max={to || max}
        disabled={disabled}
        aria-label="Start date"
      />
      <span className="text-[var(--color-muted-foreground)] text-sm shrink-0">to</span>
      <DatePicker
        value={to}
        onChange={handleTo}
        min={from || min}
        max={max}
        disabled={disabled}
        aria-label="End date"
      />
    </div>
  );
}
