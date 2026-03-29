'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface ModalDialogData {
  title: string;
  body: string;
  size: 'sm' | 'md' | 'lg';
  trigger: 'button' | 'link' | 'auto';
  dismissible: boolean;
}

interface ModalDialogProps {
  data: ModalDialogData;
  children?: React.ReactNode;
}

const sizeMap: Record<ModalDialogData['size'], string> = {
  sm: '480px',
  md: '640px',
  lg: '900px',
};

export function ModalDialog({ data, children }: ModalDialogProps) {
  const { title, body, size, trigger, dismissible } = data;
  const [open, setOpen] = useState(trigger === 'auto');
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !dismissible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, dismissible]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (dismissible && e.target === e.currentTarget) {
      setOpen(false);
    }
  };

  return (
    <>
      {trigger === 'button' && (
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
      )}
      {trigger === 'link' && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="font-label text-xs tracking-widest uppercase underline"
          style={{ color: 'var(--color-primary, #c6c6c7)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {title}
        </button>
      )}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(7, 13, 31, 0.85)' }}
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            ref={dialogRef}
            className="relative border p-8 flex flex-col gap-6"
            style={{
              maxWidth: sizeMap[size] ?? '640px',
              width: '100%',
              backgroundColor: 'var(--color-surface, #070d1f)',
              borderColor: 'var(--color-outline-variant, #32457c)',
            }}
          >
            <div className="flex items-center justify-between">
              <h2
                id="modal-title"
                className="font-headline text-2xl italic"
                style={{ color: 'var(--color-on-surface, #dfe4ff)' }}
              >
                {title}
              </h2>
              {dismissible && (
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close dialog"
                  className="font-label text-xs tracking-widest uppercase"
                  style={{ color: 'var(--color-primary, #c6c6c7)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  ✕
                </button>
              )}
            </div>
            {body && (
              <div
                className="text-sm leading-relaxed"
                style={{ color: 'var(--color-primary, #c6c6c7)' }}
                dangerouslySetInnerHTML={{ __html: body }}
              />
            )}
            {children && <div>{children}</div>}
          </div>
        </div>
      )}
    </>
  );
}
