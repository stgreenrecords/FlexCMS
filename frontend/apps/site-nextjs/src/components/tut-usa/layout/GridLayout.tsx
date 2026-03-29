import React from 'react';

export interface GridLayoutData {
  columnsDesktop: number;
  columnsTablet: number;
  columnsMobile: number;
}

interface GridLayoutProps {
  data: GridLayoutData;
  children?: React.ReactNode;
}

function clampCols(n: number): number {
  return Math.min(Math.max(Math.round(n), 1), 12);
}

export function GridLayout({ data, children }: GridLayoutProps) {
  const { columnsDesktop, columnsTablet, columnsMobile } = data;

  const desktop = clampCols(columnsDesktop);
  const tablet = clampCols(columnsTablet);
  const mobile = clampCols(columnsMobile);

  // Build inline grid-template-columns for each breakpoint via CSS custom properties
  // We use a responsive approach with CSS variables set per media query via a style tag
  const uid = React.useId().replace(/:/g, '');

  return (
    <>
      <style>{`
        #grid-${uid} {
          display: grid;
          grid-template-columns: repeat(${mobile}, minmax(0, 1fr));
          gap: 2rem;
        }
        @media (min-width: 768px) {
          #grid-${uid} {
            grid-template-columns: repeat(${tablet}, minmax(0, 1fr));
          }
        }
        @media (min-width: 1024px) {
          #grid-${uid} {
            grid-template-columns: repeat(${desktop}, minmax(0, 1fr));
          }
        }
      `}</style>
      <div id={`grid-${uid}`} className="mb-8">
        {children}
      </div>
    </>
  );
}
