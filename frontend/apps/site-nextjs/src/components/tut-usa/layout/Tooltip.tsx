'use client';

import React, { useState, useRef, useId } from 'react';

export interface TooltipData {
  triggerLabel: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface TooltipProps {
  data: TooltipData;
}

const positionStyles: Record<TooltipData['position'], React.CSSProperties> = {
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
    top: '50%',
    transform: 'translateY(-50%)',
  },
  right: {
    left: 'calc(100% + 8px)',
    top: '50%',
    transform: 'translateY(-50%)',
  },
};

export function Tooltip({ data }: TooltipProps) {
  const { triggerLabel, content, position } = data;
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <span className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        aria-describedby={tooltipId}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="font-label text-xs tracking-widest uppercase px-4 py-1 border"
        style={{
          color: 'var(--color-primary, #c6c6c7)',
          borderColor: 'var(--color-outline-variant, #32457c)',
          background: 'none',
          cursor: 'default',
        }}
      >
        {triggerLabel}
      </button>
      {visible && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute z-50 text-xs px-3 py-2 whitespace-nowrap pointer-events-none border"
          style={{
            ...positionStyles[position],
            backgroundColor: 'var(--color-surface-container, #0d1630)',
            color: 'var(--color-on-surface, #dfe4ff)',
            borderColor: 'var(--color-outline-variant, #32457c)',
          }}
        >
          {content}
        </div>
      )}
    </span>
  );
}
