'use client';

import React, { useState, useEffect } from 'react';

export interface StickyCtaData {
  label: string;
  url: string;
  triggerOffset: number;
  position: 'bottom-right' | 'bottom-left' | 'bottom-center';
}

interface StickyCtaProps {
  data: StickyCtaData;
}

const positionStyles: Record<StickyCtaData['position'], React.CSSProperties> = {
  'bottom-right': { bottom: '2rem', right: '2rem' },
  'bottom-left': { bottom: '2rem', left: '2rem' },
  'bottom-center': { bottom: '2rem', left: '50%', transform: 'translateX(-50%)' },
};

export function StickyCta({ data }: StickyCtaProps) {
  const { label, url, triggerOffset, position } = data;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const offset = typeof triggerOffset === 'number' ? triggerOffset : 300;

    const handleScroll = () => {
      setVisible(window.scrollY >= offset);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [triggerOffset]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 50,
        ...positionStyles[position],
      }}
    >
      <a
        href={url}
        className="font-label text-xs tracking-widest uppercase px-6 py-2 inline-block shadow-lg"
        style={{
          backgroundColor: 'var(--color-primary, #c6c6c7)',
          color: 'var(--color-on-primary, #070d1f)',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </a>
    </div>
  );
}
