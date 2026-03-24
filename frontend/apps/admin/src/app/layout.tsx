import type { Metadata } from 'next';
import { ThemeProvider } from '../components/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'FlexCMS Admin',
  description: 'Content management interface for FlexCMS',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider defaultTheme="system">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

