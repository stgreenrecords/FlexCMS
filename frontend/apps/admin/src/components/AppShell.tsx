'use client';

import React from 'react';
import { TopNav } from './TopNav';
import { SidebarNav } from './SidebarNav';

// ---------------------------------------------------------------------------
// AppShell — the top-level layout wrapper for all admin pages.
//
// Structure:
//   ┌──────────────────────────────────────────────┐
//   │  TopNav (fixed, h-16, z-50)                  │
//   ├────────────┬─────────────────────────────────┤
//   │ SidebarNav │  Main content area              │
//   │ (fixed     │  (ml-64, mt-16, scrollable)     │
//   │  w-64)     │                                 │
//   └────────────┴─────────────────────────────────┘
//
// Design reference: Design/UI/.../cms_dashboard/code.html
// ---------------------------------------------------------------------------

export interface AppShellProps {
  children: React.ReactNode;
  /** Current user's display name for the avatar */
  userName?: string;
  /** Current user's avatar URL */
  userAvatarUrl?: string;
}

export function AppShell({ children, userName, userAvatarUrl }: AppShellProps) {
  return (
    <>
      {/* Top navigation bar */}
      <TopNav userName={userName} userAvatarUrl={userAvatarUrl} />

      {/* Left sidebar navigation */}
      <SidebarNav />

      {/* Main scrollable content area */}
      <main
        className="min-h-screen"
        style={{
          marginLeft: '256px',
          marginTop: '64px',
          background: '#201f1f',
        }}
      >
        {children}
      </main>
    </>
  );
}
