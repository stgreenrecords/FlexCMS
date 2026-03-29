'use client';

import React, { useState, useEffect } from 'react';

export interface SidePanelData {
  title: string;
  position: 'left' | 'right';
  width: 'narrow' | 'wide';
}

interface SidePanelProps {
  data: SidePanelData;
  children?: React.ReactNode;
}

const widthMap: Record<SidePanelData['width'], string> = {
  narrow: '320px',
  wide: '520px',
};

export function SidePanel({ data, children }: SidePanelProps) {
  const { title, position, width } = data;
  const [open, setOpen] = useState(false);
  const panelWidth = widthMap[width] ?? '320px';

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const translateClosed = position === 'left' ? '-100%' : '100%';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-label text-xs tracking-widest uppercase px-6 py-2"
        style={{
          backgroundColor: 'var(--color-primary, #c6c6c7)',
          color: 'var(--color-on-primary, #070d1f)',
        }}
      >
        {title}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ backgroundColor: 'rgba(7, 13, 31, 0.6)' }}
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        role="complementary"
        aria-label={title}
        className="fixed top-0 z-50 h-full flex flex-col border"
        style={{
          [position]: 0,
          width: panelWidth,
          backgroundColor: 'var(--color-surface, #070d1f)',
          borderColor: 'var(--color-outline-variant, #32457c)',
          transform: open ? 'translateX(0)' : `translateX(${translateClosed})`,
          transition: 'transform 0.3s ease',
        }}
      >
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: 'var(--color-outline-variant, #32457c)' }}
        >
          <h2
            className="font-headline text-xl italic"
            style={{ color: 'var(--color-on-surface, #dfe4ff)' }}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close panel"
            className="font-label text-xs tracking-widest"
            style={{ color: 'var(--color-primary, #c6c6c7)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </>
  );
}
