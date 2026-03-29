import React from 'react';

export interface ContainerData {
  title?: string;
  maxWidth: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  background: 'transparent' | 'surface' | 'surface-container' | 'surface-container-low';
}

interface ContainerProps {
  data: ContainerData;
  children?: React.ReactNode;
}

const maxWidthMap: Record<ContainerData['maxWidth'], string> = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  full: '100%',
};

const backgroundMap: Record<ContainerData['background'], string> = {
  transparent: 'transparent',
  surface: 'var(--color-surface, #070d1f)',
  'surface-container': 'var(--color-surface-container, #0d1630)',
  'surface-container-low': 'var(--color-surface-container-low, #0a1228)',
};

export function Container({ data, children }: ContainerProps) {
  const { title, maxWidth, background } = data;
  const maxWidthValue = maxWidthMap[maxWidth] ?? '100%';
  const bgColor = backgroundMap[background] ?? 'transparent';

  return (
    <section
      style={{
        backgroundColor: bgColor,
        width: '100%',
      }}
      className="px-12 mb-32"
    >
      <div
        style={{
          maxWidth: maxWidthValue,
          margin: '0 auto',
        }}
      >
        {title && (
          <h2
            className="font-headline text-3xl italic mb-8"
            style={{ color: 'var(--color-on-surface, #dfe4ff)' }}
          >
            {title}
          </h2>
        )}
        {children}
      </div>
    </section>
  );
}
