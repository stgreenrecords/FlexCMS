import type { Metadata } from 'next';
import { XfNavigation } from '../components/tut-usa/XfNavigation';
import { XfFooter } from '../components/tut-usa/XfFooter';
import './globals.css';

export const metadata: Metadata = {
  title: 'TUT USA',
  description: 'TUT luxury automotive — US market',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Navigation injected from XF path — not per-page component data */}
        <XfNavigation xfPath="content/experience-fragments/tut-usa/global/navigation" />
        <main>{children}</main>
        {/* Footer injected from XF path — not per-page component data */}
        <XfFooter xfPath="content/experience-fragments/tut-usa/global/footer" />
      </body>
    </html>
  );
}
