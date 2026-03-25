'use client';

import React, { useRef, useState, KeyboardEvent } from 'react';
import { cn } from '../lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TagInputProps {
  /** Controlled value */
  value?: string[];
  onChange?: (tags: string[]) => void;
  /** Placeholder text when empty */
  placeholder?: string;
  /** Keys that confirm a tag (default: Enter, comma) */
  delimiters?: string[];
  /** Maximum number of tags */
  maxTags?: number;
  /** Validate a tag before adding — return error string or null */
  validate?: (tag: string) => string | null;
  disabled?: boolean;
  className?: string;
  /** Allow duplicates (default: false) */
  allowDuplicates?: boolean;
}

// ---------------------------------------------------------------------------
// TagInput
// ---------------------------------------------------------------------------

export function TagInput({
  value,
  onChange,
  placeholder = 'Add tag...',
  delimiters = ['Enter', ','],
  maxTags,
  validate,
  disabled = false,
  className,
  allowDuplicates = false,
}: TagInputProps) {
  const [internalTags, setInternalTags] = useState<string[]>([]);
  const [inputValue, setInputValue]     = useState('');
  const [error, setError]               = useState<string | null>(null);
  const inputRef                        = useRef<HTMLInputElement>(null);

  const tags    = value !== undefined ? value : internalTags;
  const setTags = (next: string[]) => {
    if (value === undefined) setInternalTags(next);
    onChange?.(next);
  };

  function addTag(raw: string) {
    const tag = raw.trim();
    if (!tag) return;

    if (!allowDuplicates && tags.includes(tag)) {
      setError('Duplicate tag.');
      return;
    }
    if (maxTags && tags.length >= maxTags) {
      setError(`Maximum ${maxTags} tag${maxTags === 1 ? '' : 's'}.`);
      return;
    }
    if (validate) {
      const err = validate(tag);
      if (err) { setError(err); return; }
    }

    setError(null);
    setTags([...tags, tag]);
    setInputValue('');
  }

  function removeTag(idx: number) {
    setError(null);
    setTags(tags.filter((_, i) => i !== idx));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (delimiters.includes(e.key)) {
      e.preventDefault();
      addTag(inputValue);
      return;
    }
    if (e.key === 'Backspace' && !inputValue && tags.length) {
      removeTag(tags.length - 1);
    }
  }

  function handleBlur() {
    if (inputValue.trim()) addTag(inputValue);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData('text');
    const parts = text.split(/[,\n\t]+/).map((s) => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      e.preventDefault();
      parts.forEach(addTag);
    }
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div
        className={cn(
          'flex flex-wrap gap-1.5 items-center',
          'min-h-[2.5rem] w-full rounded-[var(--radius-md)]',
          'border border-[var(--color-border)] bg-[var(--color-input)]',
          'px-3 py-2 text-sm',
          'focus-within:ring-2 focus-within:ring-[var(--color-ring)] focus-within:border-[var(--color-ring)]',
          'transition-colors',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
              'text-xs font-medium',
              'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
              'border border-[var(--color-primary)]/20',
            )}
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeTag(idx); }}
                aria-label={`Remove ${tag}`}
                className={cn(
                  'h-3.5 w-3.5 flex items-center justify-center rounded-full',
                  'hover:bg-[var(--color-primary)]/20 transition-colors',
                  'text-[var(--color-primary)] opacity-70 hover:opacity-100',
                )}
              >
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="3" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setError(null); }}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onPaste={handlePaste}
          placeholder={tags.length === 0 ? placeholder : ''}
          disabled={disabled}
          className={cn(
            'flex-1 min-w-[80px] bg-transparent outline-none',
            'text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]',
            disabled && 'cursor-not-allowed',
          )}
          style={{ minWidth: inputValue ? `${inputValue.length + 1}ch` : undefined }}
        />
      </div>

      {error && (
        <p className="text-xs text-[var(--color-destructive)] flex items-center gap-1">
          <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
