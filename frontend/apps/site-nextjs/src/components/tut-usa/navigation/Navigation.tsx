'use client';

import { useState } from 'react';

interface LinkItem { label: string; url: string }
interface Props { data: Record<string, unknown> }

export function TutUsaNavigation({ data }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const logo = (data.logo as string) ?? 'TUT';
  const primaryLinks = (data.primaryLinks as string[]) ?? [];
  const utilityLinks = (data.utilityLinks as LinkItem[]) ?? [];
  const accountEntry = (data.accountEntry as string) ?? 'Account';
  const sticky = (data.sticky as boolean) ?? true;

  const positionClass = sticky ? 'fixed top-0 left-0 right-0 z-50' : 'relative';

  return (
    <header className={`${positionClass} bg-black border-b border-neutral-800`}>
      {/* Utility bar */}
      {utilityLinks.length > 0 && (
        <div className="hidden md:flex justify-end items-center px-8 py-1 border-b border-neutral-900">
          {utilityLinks.map((link, i) => (
            <a
              key={i}
              href={link.url}
              className="ml-4 text-xs text-neutral-400 hover:text-white uppercase tracking-widest transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}

      {/* Main nav row */}
      <div className="flex items-center justify-between px-6 md:px-10 h-16">
        {/* Brand */}
        <a href="/" className="text-white text-xl font-extralight tracking-[0.3em] uppercase">
          {logo}
        </a>

        {/* Primary links — desktop */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Primary navigation">
          {primaryLinks.map((label, i) => (
            <a
              key={i}
              href="#"
              className="text-xs text-neutral-300 hover:text-white uppercase tracking-widest transition-colors duration-200"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Account + hamburger */}
        <div className="flex items-center gap-4">
          <a
            href="#"
            className="hidden md:inline-block text-xs text-neutral-300 hover:text-white uppercase tracking-widest transition-colors duration-200"
          >
            {accountEntry}
          </a>
          <button
            className="md:hidden text-white p-1"
            aria-label="Toggle mobile menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            <span className="block w-5 h-px bg-white mb-1" />
            <span className="block w-5 h-px bg-white mb-1" />
            <span className="block w-5 h-px bg-white" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav
          className="md:hidden bg-black border-t border-neutral-800 px-6 py-4 flex flex-col gap-4"
          aria-label="Mobile navigation"
        >
          {primaryLinks.map((label, i) => (
            <a
              key={i}
              href="#"
              className="text-sm text-neutral-300 hover:text-white uppercase tracking-widest transition-colors duration-200"
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </a>
          ))}
          <a
            href="#"
            className="text-sm text-neutral-300 hover:text-white uppercase tracking-widest transition-colors duration-200"
            onClick={() => setMobileOpen(false)}
          >
            {accountEntry}
          </a>
          {utilityLinks.map((link, i) => (
            <a
              key={i}
              href={link.url}
              className="text-xs text-neutral-500 hover:text-white uppercase tracking-widest transition-colors duration-200"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
