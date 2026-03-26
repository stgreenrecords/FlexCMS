'use client';

import React, { useState, useMemo, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SiteStatus = 'published' | 'maintenance' | 'draft' | 'offline';

interface Site {
  id: string;
  name: string;
  siteId: string;
  status: SiteStatus;
  url: string;
  lastPublished: string;
  pages: number;
  locales: string[];
  color: string;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_FLEXCMS_API ?? 'http://localhost:8080';

function apiToSite(s: Record<string, unknown>): Site {
  const active = (s.active as boolean) ?? true;
  const domains = (s.domains as Record<string, unknown>[]) ?? [];
  const primaryDomain = domains.find((d) => d.primary || d.isPrimary) ?? domains[0];
  const url = primaryDomain ? (primaryDomain.domain as string) ?? '' : '';

  // Parse supportedLocales — may come as array or comma-separated string
  let locales: string[] = [];
  if (Array.isArray(s.supportedLocales)) {
    locales = s.supportedLocales as string[];
  } else if (typeof s.supportedLocalesRaw === 'string') {
    locales = (s.supportedLocalesRaw as string).split(',').map((l: string) => l.trim()).filter(Boolean);
  } else {
    locales = [(s.defaultLocale as string) ?? 'en'];
  }

  const status: SiteStatus = active ? 'published' : 'offline';

  return {
    id: (s.siteId as string) ?? '',
    name: (s.title as string) ?? (s.siteId as string) ?? '',
    siteId: (s.siteId as string) ?? '',
    status,
    url,
    lastPublished: s.updatedAt ? new Date(s.updatedAt as string).toLocaleDateString() : '—',
    pages: 0,
    locales,
    color: status === 'published' ? '#b0c6ff' : '#8d90a0',
  };
}

const STATUS_STYLES: Record<SiteStatus, { label: string; bg: string; color: string; border: string }> = {
  published:   { label: 'Published',   bg: 'rgba(176,198,255,0.15)',  color: '#b0c6ff',  border: 'rgba(176,198,255,0.3)' },
  maintenance: { label: 'Maintenance', bg: 'rgba(255,181,155,0.15)',  color: '#ffb59b',  border: 'rgba(255,181,155,0.3)' },
  draft:       { label: 'Draft',       bg: 'rgba(141,144,160,0.15)',  color: '#8d90a0',  border: 'rgba(141,144,160,0.3)' },
  offline:     { label: 'Offline',     bg: 'rgba(255,180,171,0.15)',  color: '#ffb4ab',  border: 'rgba(255,180,171,0.3)' },
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function SiteManagerPage() {
  const [sites, setSites]           = useState<Site[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [view, setView]             = useState<'list' | 'grid'>('list');
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [sortBy, setSortBy]         = useState<'name' | 'pages' | 'lastPublished'>('name');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/admin/sites`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: Record<string, unknown>[]) => {
        const items = data.map(apiToSite);
        setSites(items);
      })
      .catch(() => setSites([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const results = sites.filter(
      (s) => s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q),
    );
    return [...results].sort((a, b) =>
      sortBy === 'pages' ? b.pages - a.pages : a.name.localeCompare(b.name),
    );
  }, [search, sortBy, sites]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((s) => s.id)));
  }

  const allSelected  = filtered.length > 0 && selected.size === filtered.length;
  const someSelected = selected.size > 0 && selected.size < filtered.length;

  return (
    <div className="p-8" style={{ minHeight: 'calc(100vh - 64px)', background: '#201f1f' }}>
      {/* Breadcrumb + header */}
      <nav className="flex items-center gap-2 mb-4 text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(195,198,214,0.6)' }}>
        <a href="/dashboard" className="hover:text-[#b0c6ff] transition-colors">Workspace</a>
        <span>›</span>
        <span style={{ color: '#b0c6ff' }}>Sites</span>
      </nav>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2" style={{ color: '#e5e2e1' }}>
            Site Manager
          </h1>
          <p className="font-medium" style={{ color: '#c3c6d6', opacity: 0.8 }}>
            Manage and monitor all web properties in your ecosystem.
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 shrink-0"
          style={{
            background: 'linear-gradient(135deg, #b0c6ff 0%, #0058cc 100%)',
            color: '#002d6f',
          }}
        >
          <PlusIcon />
          Create New Site
        </button>
      </header>

      {/* Toolbar */}
      <div
        className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 p-4 rounded-xl"
        style={{ background: '#1c1b1b', borderBottom: '1px solid rgba(66,70,84,0.15)' }}
      >
        {/* Search */}
        <div className="relative w-full md:w-96">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter sites by name or URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded text-sm py-2.5 pl-10 pr-4 transition-all outline-none"
            style={{
              background: '#2a2a2a',
              border: 'none',
              borderBottom: '1px solid rgba(66,70,84,0.4)',
              color: '#e5e2e1',
            }}
            onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderBottomColor = '#b0c6ff'; }}
            onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderBottomColor = 'rgba(66,70,84,0.4)'; }}
          />
        </div>

        <div className="flex items-center gap-4">
          {/* View toggle */}
          <div className="flex p-1 rounded-lg" style={{ background: '#2a2a2a' }}>
            <button
              onClick={() => setView('grid')}
              className="p-2 rounded transition-colors"
              style={view === 'grid' ? { background: '#201f1f', color: '#b0c6ff' } : { color: '#8d90a0' }}
              title="Grid view"
            >
              <GridViewIcon />
            </button>
            <button
              onClick={() => setView('list')}
              className="p-2 rounded transition-colors"
              style={view === 'list' ? { background: '#201f1f', color: '#b0c6ff' } : { color: '#8d90a0' }}
              title="List view"
            >
              <ListViewIcon />
            </button>
          </div>

          <div style={{ width: 1, height: 32, background: 'rgba(66,70,84,0.4)' }} />

          {/* Sort */}
          <button
            onClick={() => setSortBy((s) => s === 'name' ? 'pages' : 'name')}
            className="text-sm font-bold flex items-center gap-2 transition-colors"
            style={{ color: '#8d90a0' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#e5e2e1'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#8d90a0'; }}
          >
            <SortIcon />
            Sort: {sortBy === 'name' ? 'Alphabetical' : 'Page Count'}
          </button>
        </div>
      </div>

      {/* Content: list or grid */}
      {view === 'list' ? (
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: '#1c1b1b', border: '1px solid rgba(66,70,84,0.1)' }}
        >
          <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(66,70,84,0.25)', background: 'rgba(42,42,42,0.5)' }}>
                <th className="py-4 px-6 w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleSelectAll}
                    className="cursor-pointer"
                    style={{ accentColor: '#b0c6ff', width: 14, height: 14 }}
                  />
                </th>
                {['Site Name', 'Status', 'URL', 'Last Published', 'Pages'].map((col) => (
                  <th
                    key={col}
                    className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: '#8d90a0' }}
                  >
                    {col}
                  </th>
                ))}
                <th className="py-4 px-6 w-12" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((site) => {
                const s = STATUS_STYLES[site.status];
                const isSelected = selected.has(site.id);
                return (
                  <tr
                    key={site.id}
                    style={{
                      borderBottom: '1px solid rgba(66,70,84,0.08)',
                      background: isSelected ? 'rgba(176,198,255,0.04)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                  >
                    <td className="py-3 px-6">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(site.id)}
                        className="cursor-pointer"
                        style={{ accentColor: '#b0c6ff', width: 14, height: 14 }}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <SiteAvatar name={site.name} color={site.color} />
                        <div>
                          <div className="text-sm font-bold" style={{ color: '#e5e2e1' }}>{site.name}</div>
                          <div className="text-[10px]" style={{ color: 'rgba(195,198,214,0.5)' }}>ID: {site.siteId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                        style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
                      >
                        {s.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-medium" style={{ color: '#8d90a0' }}>{site.url}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-xs font-semibold" style={{ color: '#8d90a0' }}>{site.lastPublished}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-xs font-semibold" style={{ color: '#e5e2e1' }}>{site.pages.toLocaleString()}</span>
                    </td>
                    <td className="py-3 px-6 text-right" style={{ position: 'relative' }}>
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={() => setActionMenuId(actionMenuId === site.id ? null : site.id)}
                          className="p-1 rounded transition-colors"
                          style={{ color: '#8d90a0' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                        >
                          <MoreVertIcon />
                        </button>
                        {actionMenuId === site.id && (
                          <SiteActionMenu onClose={() => setActionMenuId(null)} siteId={site.id} />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm" style={{ color: '#8d90a0' }}>
                    No sites found matching &quot;{search}&quot;
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Footer */}
          <div
            className="px-6 py-3 flex items-center justify-between"
            style={{ background: 'rgba(28,27,27,0.5)', borderTop: '1px solid rgba(66,70,84,0.1)' }}
          >
            <p className="text-xs" style={{ color: '#8d90a0' }}>
              Showing <span style={{ color: '#e5e2e1' }}>{filtered.length}</span> of{' '}
              <span style={{ color: '#e5e2e1' }}>{sites.length}</span> sites
              {selected.size > 0 && (
                <span> · <span style={{ color: '#b0c6ff' }}>{selected.size} selected</span></span>
              )}
            </p>
            {selected.size > 0 && (
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 rounded text-xs font-semibold transition-colors"
                  style={{ background: '#2a2a2a', color: '#e5e2e1' }}
                >
                  Publish Selected
                </button>
                <button
                  className="px-3 py-1 rounded text-xs font-semibold transition-colors"
                  style={{ background: 'rgba(255,180,171,0.15)', color: '#ffb4ab' }}
                  onClick={() => setSelected(new Set())}
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Grid view */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((site) => {
            const s = STATUS_STYLES[site.status];
            return (
              <div
                key={site.id}
                className="rounded-xl p-5 cursor-pointer transition-all"
                style={{
                  background: '#1c1b1b',
                  border: '1px solid rgba(66,70,84,0.15)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = site.color + '66';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(66,70,84,0.15)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <SiteAvatar name={site.name} color={site.color} size={48} />
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                    style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
                  >
                    {s.label}
                  </span>
                </div>
                <h3 className="font-bold text-sm mb-1" style={{ color: '#e5e2e1' }}>{site.name}</h3>
                <p className="text-xs mb-3" style={{ color: '#8d90a0' }}>{site.url}</p>
                <div className="flex items-center justify-between text-xs" style={{ color: '#8d90a0' }}>
                  <span>{site.pages.toLocaleString()} pages</span>
                  <span>{site.lastPublished}</span>
                </div>
                <div className="flex gap-1 mt-3">
                  {site.locales.map((l) => (
                    <span
                      key={l}
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                      style={{ background: '#2a2a2a', color: '#8d90a0' }}
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Site avatar
// ---------------------------------------------------------------------------

function SiteAvatar({ name, color, size = 40 }: { name: string; color: string; size?: number }) {
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <div
      className="flex items-center justify-center rounded font-bold shrink-0"
      style={{
        width: size,
        height: size,
        background: color + '22',
        border: `1px solid ${color}44`,
        color: color,
        fontSize: size > 40 ? 16 : 12,
      }}
    >
      {initials}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Site action menu
// ---------------------------------------------------------------------------

function SiteActionMenu({ onClose, siteId: _siteId }: { onClose: () => void; siteId: string }) {
  return (
    <div
      className="absolute right-0 rounded-lg py-1 z-50"
      style={{
        top: '100%',
        background: '#1c1b1b',
        border: '1px solid rgba(66,70,84,0.3)',
        minWidth: 160,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {[
        { label: 'Open', color: '#e5e2e1' },
        { label: 'Edit Settings', color: '#e5e2e1' },
        { label: 'Publish Now', color: '#b0c6ff' },
        { label: 'Duplicate', color: '#e5e2e1' },
        { label: 'Go Offline', color: '#ffb59b' },
        { label: 'Delete', color: '#ffb4ab' },
      ].map(({ label, color }) => (
        <button
          key={label}
          className="w-full text-left px-4 py-2 text-sm transition-colors"
          style={{ color }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          onClick={onClose}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function SearchIcon({ className }: { className?: string }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8d90a0" strokeWidth="2" className={className} aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
}
function PlusIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function GridViewIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z"/></svg>; }
function ListViewIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 4h18v2H3zm0 7h18v2H3zm0 7h18v2H3z"/></svg>; }
function SortIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>; }
function MoreVertIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>; }
