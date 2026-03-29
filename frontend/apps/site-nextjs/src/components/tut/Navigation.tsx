'use client';

import { useState, useEffect } from 'react';

interface NavItem {
  title: string;
  url: string;
  children?: NavItem[];
}

const CMS_API =
  process.env.NEXT_PUBLIC_FLEXCMS_API_URL ??
  process.env.NEXT_PUBLIC_FLEXCMS_API ??
  '';

/** tut/navigation — site header navigation with optional language selector. */
export function Navigation({ data }: { data: Record<string, unknown> }) {
  const rootPath = data.rootPath as string | undefined;
  const brandLogo = data.brandLogo as string | undefined;
  const brandName = (data.brandName as string | undefined) ?? 'TUT';
  const showLanguageSelector = (data.showLanguageSelector as boolean | undefined) ?? true;

  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!rootPath) return;
    const encodedPath = encodeURIComponent(rootPath.replace(/\//g, '.'));
    fetch(`${CMS_API}/api/content/v1/navigation?rootPath=${encodedPath}&depth=2`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.items) setNavItems(data.items);
      })
      .catch(() => {});
  }, [rootPath]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Brand */}
        <a href="/" className="flex items-center gap-3">
          {brandLogo ? (
            <img src={brandLogo} alt={brandName} className="h-8 w-auto" />
          ) : (
            <span className="text-white font-extrabold text-xl tracking-[0.3em] uppercase">{brandName}</span>
          )}
        </a>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <li key={item.url}>
              <a
                href={item.url}
                className="text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-white transition-colors"
              >
                {item.title}
              </a>
            </li>
          ))}
          {showLanguageSelector && (
            <li className="text-xs font-bold uppercase tracking-widest text-gray-500">EN</li>
          )}
        </ul>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span className="material-symbols-outlined">{menuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && navItems.length > 0 && (
        <div className="md:hidden bg-black border-t border-white/10 px-6 py-4">
          <ul className="flex flex-col gap-4">
            {navItems.map((item) => (
              <li key={item.url}>
                <a
                  href={item.url}
                  className="text-sm font-bold uppercase tracking-widest text-gray-300 hover:text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
