import React from 'react';
import { AppShell } from '../../components/AppShell';

/**
 * Admin group layout — wraps all authenticated admin pages with the AppShell
 * (top nav + sidebar + content area).
 *
 * The login page lives outside this group so it does NOT get the AppShell.
 *
 * Route group: (admin) — does not add a URL segment.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
