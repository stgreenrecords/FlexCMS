import React from 'react';

export interface SectionDividerData {
  style: 'solid' | 'dashed' | 'dotted' | 'none' | 'gradient';
  label?: string;
  spacing: 'sm' | 'md' | 'lg' | 'xl';
}

interface SectionDividerProps {
  data: SectionDividerData;
}

const spacingMap: Record<SectionDividerData['spacing'], string> = {
  sm: '1rem',
  md: '2rem',
  lg: '3rem',
  xl: '5rem',
};

export function SectionDivider({ data }: SectionDividerProps) {
  const { style, label, spacing } = data;
  const verticalSpacing = spacingMap[spacing] ?? '2rem';

  if (style === 'none') {
    return <div style={{ height: verticalSpacing }} aria-hidden="true" />;
  }

  return (
    <div
      style={{ paddingTop: verticalSpacing, paddingBottom: verticalSpacing }}
      className="flex items-center gap-4 px-12"
    >
      <div
        className="flex-1"
        style={{
          borderTopWidth: '1px',
          borderTopStyle: style === 'gradient' ? 'solid' : style,
          borderTopColor:
            style === 'gradient'
              ? 'transparent'
              : 'var(--color-outline-variant, #32457c)',
          background:
            style === 'gradient'
              ? 'linear-gradient(to right, transparent, var(--color-outline-variant, #32457c), transparent)'
              : undefined,
          height: style === 'gradient' ? '1px' : undefined,
        }}
        aria-hidden="true"
      />
      {label && (
        <>
          <span
            className="font-label text-xs tracking-widest uppercase whitespace-nowrap"
            style={{ color: 'var(--color-primary, #c6c6c7)' }}
          >
            {label}
          </span>
          <div
            className="flex-1"
            style={{
              borderTopWidth: '1px',
              borderTopStyle: style === 'gradient' ? 'solid' : style,
              borderTopColor:
                style === 'gradient'
                  ? 'transparent'
                  : 'var(--color-outline-variant, #32457c)',
              background:
                style === 'gradient'
                  ? 'linear-gradient(to right, var(--color-outline-variant, #32457c), transparent)'
                  : undefined,
              height: style === 'gradient' ? '1px' : undefined,
            }}
            aria-hidden="true"
          />
        </>
      )}
    </div>
  );
}
