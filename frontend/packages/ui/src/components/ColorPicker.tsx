'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ColorPickerProps {
  /** Controlled hex value (e.g., "#3b82f6") */
  value?: string;
  onChange?: (hex: string) => void;
  /** Preset swatches */
  swatches?: string[];
  /** Show hex input (default: true) */
  showInput?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
}

// ---------------------------------------------------------------------------
// Default swatches — CSS custom properties resolve to actual colors at runtime,
// but for swatches we use static hex values that match our design tokens.
// ---------------------------------------------------------------------------

const DEFAULT_SWATCHES = [
  '#6366f1', // primary
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#0ea5e9', // sky
  '#64748b', // slate
  '#18181b', // zinc-950
  '#ffffff',
  '#f8fafc', // slate-50
];

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function isValidHex(hex: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex);
}

function normalizeHex(hex: string): string {
  const h = hex.startsWith('#') ? hex : `#${hex}`;
  if (/^#[0-9a-fA-F]{3}$/.test(h)) {
    return `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  }
  return h.toLowerCase();
}

// ---------------------------------------------------------------------------
// ColorPicker
// ---------------------------------------------------------------------------

export function ColorPicker({
  value,
  onChange,
  swatches = DEFAULT_SWATCHES,
  showInput = true,
  disabled = false,
  className,
  label,
}: ColorPickerProps) {
  const [internalValue, setInternalValue] = useState(value ?? '#6366f1');
  const [inputDraft, setInputDraft]       = useState('');
  const [isOpen, setIsOpen]               = useState(false);
  const containerRef                      = useRef<HTMLDivElement>(null);

  const currentColor = value !== undefined ? value : internalValue;

  // Sync draft when popover opens
  useEffect(() => {
    if (isOpen) setInputDraft(currentColor);
  }, [isOpen, currentColor]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  function select(hex: string) {
    const normalized = normalizeHex(hex);
    if (value === undefined) setInternalValue(normalized);
    onChange?.(normalized);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setInputDraft(raw);
    const withHash = raw.startsWith('#') ? raw : `#${raw}`;
    if (isValidHex(withHash)) select(withHash);
  }

  function handleInputBlur() {
    const withHash = inputDraft.startsWith('#') ? inputDraft : `#${inputDraft}`;
    if (!isValidHex(withHash)) {
      setInputDraft(currentColor);
    }
  }

  function handleNativeChange(e: React.ChangeEvent<HTMLInputElement>) {
    select(e.target.value);
    setInputDraft(e.target.value);
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative inline-flex flex-col gap-1', className)}
    >
      {label && (
        <span className="text-xs font-medium text-[var(--color-foreground)]">{label}</span>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={cn(
          'inline-flex items-center gap-2 h-9 px-3 rounded-[var(--radius-md)]',
          'border border-[var(--color-border)] bg-[var(--color-input)]',
          'text-sm text-[var(--color-foreground)]',
          'hover:border-[var(--color-primary)]/50 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        {/* Swatch preview */}
        <span
          className="h-4 w-4 rounded-sm border border-black/10 shrink-0"
          style={{ background: currentColor }}
          aria-hidden="true"
        />
        <span className="font-mono text-xs">{currentColor.toUpperCase()}</span>
        <ChevronIcon />
      </button>

      {/* Popover */}
      {isOpen && (
        <div
          className={cn(
            'absolute top-full left-0 mt-1.5 z-50',
            'w-[220px] p-3 rounded-[var(--radius-lg)]',
            'bg-[var(--color-card)] border border-[var(--color-border)]',
            'shadow-lg',
          )}
          role="dialog"
          aria-label="Color picker"
        >
          {/* Native color wheel */}
          <div className="flex items-center justify-center mb-3">
            <div className="relative h-8 w-8">
              <span
                className="block h-8 w-8 rounded-full border-2 border-[var(--color-border)]"
                style={{ background: currentColor }}
              />
              <input
                type="color"
                value={currentColor}
                onChange={handleNativeChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                aria-label="Open color wheel"
              />
            </div>
          </div>

          {/* Swatches grid */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {swatches.map((swatch) => {
              const isSelected = normalizeHex(currentColor) === normalizeHex(swatch);
              return (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => select(swatch)}
                  title={swatch}
                  aria-label={swatch}
                  aria-pressed={isSelected}
                  className={cn(
                    'h-6 w-6 rounded-sm border transition-transform',
                    'hover:scale-110 focus-visible:outline-none focus-visible:ring-2',
                    'focus-visible:ring-[var(--color-ring)]',
                    isSelected
                      ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)] scale-110'
                      : 'border-black/10',
                  )}
                  style={{ background: swatch }}
                />
              );
            })}
          </div>

          {/* Hex input */}
          {showInput && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--color-muted-foreground)] font-mono">#</span>
              <input
                type="text"
                value={inputDraft.replace(/^#/, '')}
                onChange={(e) => handleInputChange({ ...e, target: { ...e.target, value: `#${e.target.value}` } })}
                onBlur={handleInputBlur}
                maxLength={6}
                placeholder="3b82f6"
                aria-label="Hex color value"
                className={cn(
                  'flex-1 font-mono text-xs bg-[var(--color-input)]',
                  'border border-[var(--color-border)] rounded-[var(--radius-sm)]',
                  'px-2 py-1 outline-none',
                  'focus:ring-1 focus:ring-[var(--color-ring)]',
                  'text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]',
                )}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ColorSwatchGroup — a simple row of swatches (no popover)
// ---------------------------------------------------------------------------

export interface ColorSwatchGroupProps {
  colors: string[];
  value?: string;
  onChange?: (color: string) => void;
  className?: string;
}

export function ColorSwatchGroup({ colors, value, onChange, className }: ColorSwatchGroupProps) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)} role="group" aria-label="Color swatches">
      {colors.map((color) => {
        const isSelected = value && normalizeHex(value) === normalizeHex(color);
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange?.(color)}
            aria-label={color}
            aria-pressed={!!isSelected}
            className={cn(
              'h-7 w-7 rounded-md border-2 transition-all',
              'hover:scale-110 focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-[var(--color-ring)]',
              isSelected
                ? 'border-[var(--color-primary)] scale-110'
                : 'border-transparent hover:border-[var(--color-border)]',
            )}
            style={{ background: color }}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function ChevronIcon() {
  return (
    <svg className="h-3 w-3 text-[var(--color-muted-foreground)] ml-auto"
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}
