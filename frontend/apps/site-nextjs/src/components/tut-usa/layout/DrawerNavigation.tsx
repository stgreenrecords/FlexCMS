'use client';

import React, { useState, useEffect } from 'react';

export interface DrawerNavigationMenuItem {
  label: string;
  url: string;
}

export interface DrawerNavigationData {
  menuItems: DrawerNavigationMenuItem[];
  position: 'left' | 'right';
  showAccountLinks: boolean;
}

interface DrawerNavigationProps {
  data: DrawerNavigationData;
}

const ACCOUNT_LINKS: DrawerNavigationMenuItem[] = [
  { label: 'My Account', url: '/account' },
  { label: 'My Vehicles', url: '/account/vehicles' },
  { label: 'Sign Out', url: '/signout' },
];

export function DrawerNavigation({ data }: DrawerNavigationProps) {
  const { menuItems, position, showAccountLinks } = data;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const translateClosed = position === 'left' ? '-100%' : '100%';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        className="flex flex-col gap-1 p-2"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <span
          className="block w-6"
          style={{ height: '2px', backgroundColor: 'var(--color-on-surface, #dfe4ff)' }}
        />
        <span
          className="block w-6"
          style={{ height: '2px', backgroundColor: 'var(--color-on-surface, #dfe4ff)' }}
        />
        <span
          className="block w-6"
          style={{ height: '2px', backgroundColor: 'var(--color-on-surface, #dfe4ff)' }}
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ backgroundColor: 'rgba(7, 13, 31, 0.7)' }}
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <nav
        aria-label="Drawer navigation"
        className="fixed top-0 z-50 h-full w-80 flex flex-col border"
        style={{
          [position]: 0,
          backgroundColor: 'var(--color-surface, #070d1f)',
          borderColor: 'var(--color-outline-variant, #32457c)',
          transform: open ? 'translateX(0)' : `translateX(${translateClosed})`,
          transition: 'transform 0.3s ease',
        }}
      >
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: 'var(--color-outline-variant, #32457c)' }}
        >
          <span
            className="font-label text-xs tracking-widest uppercase"
            style={{ color: 'var(--color-primary, #c6c6c7)' }}
          >
            Menu
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation menu"
            className="font-label text-xs"
            style={{ color: 'var(--color-primary, #c6c6c7)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item, index) => (
            <li key={index}>
              <a
                href={item.url}
                className="block px-6 py-3 font-headline text-lg italic transition-colors"
                style={{ color: 'var(--color-on-surface, #dfe4ff)' }}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        {showAccountLinks && (
          <div
            className="border-t p-4"
            style={{ borderColor: 'var(--color-outline-variant, #32457c)' }}
          >
            <ul>
              {ACCOUNT_LINKS.map((item, index) => (
                <li key={index}>
                  <a
                    href={item.url}
                    className="block px-2 py-2 font-label text-xs tracking-widest uppercase"
                    style={{ color: 'var(--color-primary, #c6c6c7)' }}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
    </>
  );
}
