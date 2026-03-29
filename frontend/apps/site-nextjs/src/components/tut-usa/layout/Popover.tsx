'use client';

import React, { useState, useRef, useEffect, useId } from 'react';

export interface PopoverData {
  triggerLabel: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  dismissible: boolean;
}

interface PopoverProps {
  data: PopoverData;
}

const positionStyles: Record<PopoverData['position'], React.CSSProperties> = {
  top: {
    bottom: 'calc(100% + 8px)',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  bottom: {
    top: 'calc(100% + 8px)',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  left: {
    right: 'calc(100% + 8px)',
    top: '0',
  },
  right: {
    left: 'calc(100% + 8px)',
    top: '0',
  },
};

export function Popover({ data }: PopoverProps) {
  const { triggerLabel, content, position, dismissible } = data;
  const [open, setOpen] = useState(false);
  const popoverId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !dismissible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, dismissible]);

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={() => setOpen((prev) => !prev)}
        className="font-label text-xs tracking-widest uppercase px-6 py-2"
        style={{
          backgroundColor: 'var(--color-primary, #c6c6c7)',
          color: 'var(--color-on-primary, #070d1f)',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {triggerLabel}
      </button>

      {open && (
        <div
          id={popoverId}
          role="dialog"
          aria-label={triggerLabel}
          className="absolute z-50 w-72 p-4 border"
          style={{
            ...positionStyles[position],
            backgroundColor: 'var(--color-surface-container, #0d1630)',
            borderColor: 'var(--color-outline-variant, #32457c)',
          }}
        >
          {dismissible && (
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Dismiss"
                className="font-label text-xs"
                style={{ color: 'var(--color-primary, #c6c6c7)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
          )}
          <div
            className="text-sm leading-relaxed"
            style={{ color: 'var(--color-on-surface, #dfe4ff)' }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      )}
    </div>
  );
}
