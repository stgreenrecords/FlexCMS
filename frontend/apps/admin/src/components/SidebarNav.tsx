'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ---------------------------------------------------------------------------
// SidebarNav — left navigation panel for the Admin UI
//
// Design: fixed, w-64, dark (#1c1b1b), nav sections with active left-border,
// system health widget at bottom.
// ---------------------------------------------------------------------------

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Content',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: <GridIcon /> },
      { href: '/content', label: 'Content Tree', icon: <TreeIcon /> },
      { href: '/sites', label: 'Sites', icon: <GlobeIcon /> },
      { href: '/workflows', label: 'Workflows', icon: <WorkflowIcon /> },
      { href: '/components', label: 'Components', icon: <ComponentIcon /> },
      { href: '/experience-fragments', label: 'Experience Fragments', icon: <ExperienceFragmentIcon /> },
      { href: '/preview', label: 'Content Preview', icon: <PreviewIcon /> },
    ],
  },
  {
    label: 'Assets',
    items: [
      { href: '/dam', label: 'Media Library', icon: <ImageIcon /> },
    ],
  },
  {
    label: 'Products',
    items: [
      { href: '/pim', label: 'Catalog', icon: <CatalogIcon /> },
      { href: '/pim/schema', label: 'Schema Editor', icon: <SchemaIcon /> },
      { href: '/pim/import', label: 'Import Wizard', icon: <ImportIcon /> },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/translations', label: 'Translations', icon: <TranslateIcon /> },
      { href: '/settings', label: 'Settings', icon: <SettingsIcon /> },
    ],
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-16 flex flex-col py-4 text-sm font-medium"
      style={{
        width: '256px',
        height: 'calc(100vh - 64px)',
        background: '#1c1b1b',
        overflowY: 'auto',
      }}
    >
      {/* Section heading */}
      <div className="px-6 mb-6 mt-2">
        <p className="text-[10px] uppercase tracking-widest font-bold opacity-50" style={{ color: '#c3c6d6' }}>
          Orchestration
        </p>
        <h3 className="font-semibold text-base mt-1" style={{ color: '#e5e2e1' }}>
          Architectural Curator
        </h3>
        <p className="text-[10px] uppercase tracking-tight opacity-80" style={{ color: '#b0c6ff' }}>
          Enterprise Orchestration
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-4" aria-label="Main navigation">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p
              className="text-[0.65rem] font-bold uppercase tracking-widest px-4 mb-1"
              style={{ color: '#8d90a0' }}
            >
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-r-lg transition-all duration-200"
                      style={
                        isActive
                          ? {
                              background: '#2a2a2a',
                              color: '#b0c6ff',
                              borderLeft: '4px solid #b0c6ff',
                              paddingLeft: '12px',
                            }
                          : {
                              color: '#c3c6d6',
                              borderLeft: '4px solid transparent',
                              paddingLeft: '12px',
                            }
                      }
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.color = '#e5e2e1';
                        if (!isActive) e.currentTarget.style.background = '#201f1f';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.color = '#c3c6d6';
                        if (!isActive) e.currentTarget.style.background = 'transparent';
                      }}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span className="h-5 w-5 shrink-0 flex items-center justify-center" aria-hidden="true">
                        {item.icon}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {item.badge != null && item.badge > 0 && (
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                          style={{ background: '#a93802', color: '#ffcebd' }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* System health widget */}
      <div className="mt-auto px-4 py-4">
        <div className="rounded-xl p-4" style={{ background: '#2a2a2a' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-tight" style={{ color: '#c3c6d6' }}>
              System Health
            </span>
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: '#10b981', boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)' }}
              aria-hidden="true"
            />
          </div>
          <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: '#201f1f' }}>
            <div className="h-full rounded-full" style={{ width: '92%', background: '#b0c6ff' }} />
          </div>
          <p className="text-[10px] mt-1.5 text-right" style={{ color: '#8d90a0' }}>92% healthy</p>
        </div>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Icon components (inline SVG)
// ---------------------------------------------------------------------------

function GridIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function TreeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function WorkflowIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function ComponentIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function CatalogIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  );
}

function SchemaIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function ImportIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function TranslateIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" />
      <path d="M2 5h12" /><path d="M7 2h1" />
      <path d="m22 22-5-10-5 10" /><path d="M14 18h6" />
    </svg>
  );
}

function ExperienceFragmentIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function PreviewIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
