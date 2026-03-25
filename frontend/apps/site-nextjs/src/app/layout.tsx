import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FlexCMS Site',
  description: 'Site powered by FlexCMS',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
