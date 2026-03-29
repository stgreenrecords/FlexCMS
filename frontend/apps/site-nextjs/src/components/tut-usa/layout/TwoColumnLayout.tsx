import React from 'react';

export interface TwoColumnLayoutData {
  ratio: '50-50' | '60-40' | '40-60' | '70-30' | '30-70';
  stackOnMobile: boolean;
}

interface TwoColumnLayoutProps {
  data: TwoColumnLayoutData;
  children?: React.ReactNode;
}

const ratioMap: Record<TwoColumnLayoutData['ratio'], [string, string]> = {
  '50-50': ['1fr', '1fr'],
  '60-40': ['3fr', '2fr'],
  '40-60': ['2fr', '3fr'],
  '70-30': ['7fr', '3fr'],
  '30-70': ['3fr', '7fr'],
};

export function TwoColumnLayout({ data, children }: TwoColumnLayoutProps) {
  const { ratio, stackOnMobile } = data;
  const [leftFr, rightFr] = ratioMap[ratio] ?? ['1fr', '1fr'];

  const childArray = React.Children.toArray(children);
  const leftChild = childArray[0] ?? null;
  const rightChild = childArray[1] ?? null;

  return (
    <div
      className={`mb-8 ${stackOnMobile ? 'flex flex-col md:grid' : 'grid'}`}
      style={{
        gridTemplateColumns: `${leftFr} ${rightFr}`,
        gap: '2rem',
      }}
    >
      <div>{leftChild}</div>
      <div>{rightChild}</div>
    </div>
  );
}
