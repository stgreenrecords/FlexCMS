'use client';

import React from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// TopNav — global application header bar
//
// Design: fixed top, h-16, glassmorphism dark panel, FlexCMS logo + search
// + notification/settings icons + user avatar.
// ---------------------------------------------------------------------------

export interface TopNavProps {
  /** Current user display name */
  userName?: string;
  /** URL for the user avatar image */
  userAvatarUrl?: string;
  /** Callback when the theme toggle button is clicked */
  onThemeToggle?: () => void;
}

export function TopNav({ userName, userAvatarUrl, onThemeToggle }: TopNavProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between px-6"
      style={{
        background: 'rgba(19, 19, 19, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(66, 70, 84, 0.1)',
      }}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-8">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xl font-extrabold tracking-tight"
          style={{ color: '#b0c6ff' }}
        >
          <LogoIcon />
          <span>FlexCMS</span>
        </Link>
      </div>

      {/* Center: Global search */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#8d90a0' }} />
          <input
            type="search"
            placeholder="Quick search… (⌘K)"
            className="w-full rounded-lg py-1.5 pl-9 pr-4 text-xs outline-none transition-all"
            style={{
              background: '#2a2a2a',
              border: 'none',
              color: '#e5e2e1',
            }}
            onFocus={(e) => (e.currentTarget.style.boxShadow = '0 0 0 1px #b0c6ff')}
            onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
            aria-label="Global search"
          />
        </div>
      </div>

      {/* Right: Action buttons + avatar */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <IconButton aria-label="Notifications">
          <BellIcon className="h-5 w-5" />
          {/* Notification dot */}
          <span
            className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full"
            style={{ background: '#b0c6ff' }}
            aria-hidden="true"
          />
        </IconButton>

        {/* Theme toggle */}
        <IconButton aria-label="Toggle theme" onClick={onThemeToggle}>
          <ContrastIcon className="h-5 w-5" />
        </IconButton>

        {/* Settings */}
        <Link href="/settings" className="contents">
          <IconButton as="span" aria-label="Settings">
            <SettingsIcon className="h-5 w-5" />
          </IconButton>
        </Link>

        {/* User avatar */}
        <div className="ml-3">
          <button
            type="button"
            className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold"
            style={{
              background: '#324575',
              border: '1px solid rgba(66, 70, 84, 0.3)',
              color: '#b3c5fd',
            }}
            aria-label={userName ? `User menu: ${userName}` : 'User menu'}
          >
            {userAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userAvatarUrl} alt={userName ?? 'User'} className="h-full w-full object-cover" />
            ) : (
              <span>{(userName ?? 'U')[0].toUpperCase()}</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  as?: 'button' | 'span';
}

function IconButton({ as: _As = 'button', className, children, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      className={`relative p-2 rounded-xl transition-colors active:scale-95 ${className ?? ''}`}
      style={{ color: '#c3c6d6' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2a2a')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      {...props}
    >
      {children}
    </button>
  );
}

// Inline SVG icons — no dependency on icon library

function LogoIcon() {
  return (
    <div
      className="h-7 w-7 rounded-lg flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #b0c6ff 0%, #0058cc 100%)' }}
      aria-hidden="true"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#002d6f">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
      </svg>
    </div>
  );
}

function SearchIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      className={className} style={style} aria-hidden="true">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function ContrastIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
