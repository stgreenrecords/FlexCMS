import { redirect } from 'next/navigation';

/**
 * Root route — redirects to the admin dashboard.
 * The dashboard is served by (admin)/dashboard/page.tsx which is
 * wrapped in the AppShell layout.
 */
export default function RootPage() {
  redirect('/dashboard');
}
