import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TUT USA',
  description: 'TUT luxury automotive — US market',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body data-shell="tut-usa" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-foreground)' }}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:px-3 focus:py-2" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)' }}>
          Skip to main content
        </a>
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}
