import React from 'react';

export interface ThreeColumnLayoutData {
  gap: 'sm' | 'md' | 'lg' | 'xl';
}

interface ThreeColumnLayoutProps {
  data: ThreeColumnLayoutData;
  children?: React.ReactNode;
}

const gapMap: Record<ThreeColumnLayoutData['gap'], string> = {
  sm: '1rem',
  md: '2rem',
  lg: '3rem',
  xl: '5rem',
};

export function ThreeColumnLayout({ data, children }: ThreeColumnLayoutProps) {
  const { gap } = data;
  const gapValue = gapMap[gap] ?? '2rem';

  const childArray = React.Children.toArray(children);
  const col1 = childArray[0] ?? null;
  const col2 = childArray[1] ?? null;
  const col3 = childArray[2] ?? null;

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-3 mb-8"
      style={{ gap: gapValue }}
    >
      <div>{col1}</div>
      <div>{col2}</div>
      <div>{col3}</div>
    </div>
  );
}
