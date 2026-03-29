import React from 'react';

export interface SpacerData {
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  responsiveBehavior: 'fixed' | 'scale-down' | 'hide-mobile';
}

interface SpacerProps {
  data: SpacerData;
}

const sizeMap: Record<SpacerData['size'], string> = {
  xs: '0.5rem',
  sm: '1rem',
  md: '2rem',
  lg: '3rem',
  xl: '5rem',
  '2xl': '8rem',
};

const scaleDownMap: Record<SpacerData['size'], string> = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2.5rem',
  '2xl': '4rem',
};

export function Spacer({ data }: SpacerProps) {
  const { size, responsiveBehavior } = data;
  const height = sizeMap[size] ?? '2rem';
  const mobileHeight = scaleDownMap[size] ?? '1rem';

  if (responsiveBehavior === 'hide-mobile') {
    return (
      <>
        <div
          className="hidden md:block"
          style={{ height }}
          aria-hidden="true"
        />
        <div className="block md:hidden" style={{ height: '0' }} aria-hidden="true" />
      </>
    );
  }

  if (responsiveBehavior === 'scale-down') {
    return (
      <>
        <div
          className="hidden md:block"
          style={{ height }}
          aria-hidden="true"
        />
        <div
          className="block md:hidden"
          style={{ height: mobileHeight }}
          aria-hidden="true"
        />
      </>
    );
  }

  // fixed
  return <div style={{ height }} aria-hidden="true" />;
}
