import React from 'react';

export interface TwoColumnsGridData {
  gap: 'sm' | 'md' | 'lg' | 'xl';
  stackOnMobile: boolean;
}

interface TwoColumnsGridProps {
  data: TwoColumnsGridData;
  children?: React.ReactNode;
}

const gapMap: Record<TwoColumnsGridData['gap'], string> = {
  sm: '1rem',
  md: '2rem',
  lg: '3rem',
  xl: '5rem',
};

export function TwoColumnsGrid({ data, children }: TwoColumnsGridProps) {
  const { gap, stackOnMobile } = data;
  const gapValue = gapMap[gap] ?? '2rem';

  const childArray = React.Children.toArray(children);
  const leftItems = childArray.slice(0, Math.ceil(childArray.length / 2));
  const rightItems = childArray.slice(Math.ceil(childArray.length / 2));

  return (
    <div
      className={`mb-8 ${stackOnMobile ? 'flex flex-col md:grid' : 'grid'} grid-cols-2`}
      style={{ gap: gapValue }}
    >
      <div className="flex flex-col" style={{ gap: gapValue }}>
        {leftItems}
      </div>
      <div className="flex flex-col" style={{ gap: gapValue }}>
        {rightItems}
      </div>
    </div>
  );
}
