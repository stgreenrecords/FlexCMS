'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@flexcms/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ContentStatus = 'live' | 'draft' | 'error' | 'archived' | 'review';

interface ContentNode {
  id: string;
  name: string;
  icon: string;
  status: ContentStatus;
  ltreePath: string;   // e.g. "content.experience-fragments.tut-ca"
  urlPath: string;     // e.g. "/content/experience-fragments/tut-ca"
  lastModified: string;
  author: { initials: string; name: string; color: string };
}

interface BreadcrumbItem {
  name: string;
  path: string; // ltree path
}

// API node shape returned by /api/author/content/children
interface ApiContentNode {
  id: string;
  name: string;
  path: string;
  resourceType: string;
  status: string;
  modifiedAt?: string;
  modifiedBy?: string;
  updatedBy?: string;
  siteId?: string;
  locale?: string;
}

import { getApiBase } from '@/lib/apiBase';
const API_BASE = getApiBase();

function apiToUiNode(n: ApiContentNode): ContentNode {
  const statusMap: Record<string, ContentStatus> = {
    PUBLISHED: 'live',
    DRAFT: 'draft',
    IN_REVIEW: 'review',
    APPROVED: 'review',
    ARCHIVED: 'archived',
  };
  const author = n.modifiedBy ?? n.updatedBy ?? 'System';
  const initials = author.slice(0, 2).toUpperCase();
  const lastMod = n.modifiedAt ? new Date(n.modifiedAt).toLocaleDateString() : '—';
  const iconMap: Record<string, string> = {
    'flexcms/page': 'description',
    'flexcms/site-root': 'language',
    'flexcms/container': 'article',
    'flexcms/xf-page': 'auto_stories',
  };
  return {
    id: n.id,
    name: n.name,
    icon: iconMap[n.resourceType] ?? 'article',
    status: statusMap[n.status] ?? 'draft',
    ltreePath: n.path,
    urlPath: '/' + n.path.replace(/\./g, '/'),
    lastModified: lastMod,
    author: { initials, name: author, color: '#8d90a0' },
  };
}

// ---------------------------------------------------------------------------
// Status badge config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<ContentStatus, { label: string; dot: string; bg: string; text: string }> = {
  live:     { label: 'Live',      dot: 'var(--color-primary)',            bg: 'rgba(176,198,255,0.1)',  text: 'var(--color-primary)' },
  draft:    { label: 'Draft',     dot: '#ffb59b',                         bg: 'rgba(255,181,155,0.1)', text: '#ffb59b' },
  error:    { label: 'Error',     dot: '#ffb4ab',                         bg: 'rgba(147,0,10,0.2)',    text: '#ffb4ab' },
  archived: { label: 'Archived',  dot: 'var(--color-muted-foreground)',    bg: 'rgba(66,70,84,0.2)',    text: 'var(--color-muted-foreground)' },
  review:   { label: 'In Review', dot: '#b3c5fd',                         bg: 'rgba(179,197,253,0.1)', text: '#b3c5fd' },
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function ContentTreePage() {
  const [search, setSearch]           = useState('');
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [nodes, setNodes]             = useState<ContentNode[]>([]);
  const [loading, setLoading]         = useState(true);
  const [viewMode, setViewMode]       = useState<'list' | 'tree'>('list');
  const [stats, setStats]             = useState<{ totalPages: number; siteCount: number } | null>(null);

  // Folder navigation state
  const [currentPath, setCurrentPath] = useState<string>('content');
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { name: 'Content', path: 'content' },
  ]);

  // Fetch aggregate stats once on mount
  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/author/content/list?size=1`).then((r) => r.ok ? r.json() : null),
      fetch(`${API_BASE}/api/author/sites`).then((r) => r.ok ? r.json() : null),
    ]).then(([listResp, sitesResp]) => {
      const totalPages = listResp?.totalElements ?? 0;
      const siteCount  = Array.isArray(sitesResp) ? sitesResp.length : 0;
      setStats({ totalPages, siteCount });
    }).catch(() => { /* stats are non-critical */ });
  }, []);

  // Fetch direct children whenever currentPath changes
  useEffect(() => {
    setLoading(true);
    setSelected(new Set());
    setActionMenuId(null);
    fetch(`${API_BASE}/api/author/content/children?path=${encodeURIComponent(currentPath)}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: ApiContentNode[]) => {
        setNodes(Array.isArray(data) ? data.map(apiToUiNode) : []);
      })
      .catch(() => setNodes([]))
      .finally(() => setLoading(false));
  }, [currentPath]);

  // Navigate into a folder
  function navigateTo(node: ContentNode) {
    const target = node.ltreePath;
    setBreadcrumbs((prev) => {
      const existing = prev.findIndex((b) => b.path === target);
      if (existing >= 0) return prev.slice(0, existing + 1);
      return [...prev, { name: node.name, path: target }];
    });
    setCurrentPath(target);
  }

  // Navigate to a breadcrumb item
  function navigateToBreadcrumb(item: BreadcrumbItem) {
    setBreadcrumbs((prev) => {
      const idx = prev.findIndex((b) => b.path === item.path);
      return idx >= 0 ? prev.slice(0, idx + 1) : prev;
    });
    setCurrentPath(item.path);
  }

  // Navigate up one level
  function navigateUp() {
    if (breadcrumbs.length <= 1) return;
    const parent = breadcrumbs[breadcrumbs.length - 2];
    navigateToBreadcrumb(parent);
  }

  // Filtered nodes for search
  const visibleNodes = useMemo(() => {
    if (!search.trim()) return nodes;
    const q = search.toLowerCase();
    return nodes.filter(
      (n) => n.name.toLowerCase().includes(q) || n.urlPath.toLowerCase().includes(q),
    );
  }, [nodes, search]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === visibleNodes.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(visibleNodes.map((n) => n.id)));
    }
  }

  const allSelected  = visibleNodes.length > 0 && selected.size === visibleNodes.length;
  const someSelected = selected.size > 0 && selected.size < visibleNodes.length;
  const isAtRoot     = breadcrumbs.length <= 1;

  return (
    <div className="flex min-h-screen" style={{ background: '#201f1f' }}>
      {/* Main content */}
      <div className="flex-1 overflow-hidden" style={{ marginRight: '48px' }}>
        {/* Breadcrumb + header */}
        <div className="px-8 pt-8 pb-4">
          <nav
            className="flex items-center gap-2 text-[0.6875rem] font-medium uppercase tracking-wider mb-4"
            style={{ color: '#8d90a0' }}
          >
            <a href="/dashboard" className="hover:text-[#b0c6ff] transition-colors">Sites</a>
            <span style={{ fontSize: '10px' }}>›</span>
            <a href="#" className="hover:text-[#b0c6ff] transition-colors">Corporate Portal</a>
            <span style={{ fontSize: '10px' }}>›</span>
            <span style={{ color: '#b0c6ff' }}>Pages</span>
          </nav>

          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: '#e5e2e1' }}>
                Content Tree
              </h1>
              <p className="text-sm mt-1" style={{ color: '#8d90a0' }}>
                Manage and orchestrate your site hierarchy across all locales.
              </p>
            </div>
            <div className="flex gap-2">
              {selected.size > 0 && (
                <Button variant="outline" onClick={() => setSelected(new Set())}>
                  {selected.size} selected
                </Button>
              )}
              <button
                className="h-10 px-4 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                style={{ background: '#2a2a2a', color: '#e5e2e1', border: '1px solid rgba(66,70,84,0.3)' }}
              >
                <PublishIcon />
                Publish All
              </button>
              <Button
                style={{
                  background: 'linear-gradient(135deg, #b0c6ff 0%, #0058cc 100%)',
                  color: '#002d6f',
                  border: 'none',
                  fontWeight: 600,
                }}
              >
                + Create New Page
              </Button>
            </div>
          </div>
        </div>

        {/* Content canvas */}
        <div className="px-8 py-4 pb-20">
          {/* Toolbar */}
          <div
            className="rounded-xl p-3 flex items-center justify-between mb-4"
            style={{ background: '#1c1b1b', border: '1px solid rgba(66,70,84,0.1)' }}
          >
            <div className="flex items-center gap-4 flex-1">
              {/* Search */}
              <div className="relative w-full max-w-md">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by name or URL..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg pl-10 pr-4 py-2 text-sm outline-none"
                  style={{ background: '#201f1f', border: 'none', color: '#e5e2e1', caretColor: '#b0c6ff' }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* List / Tree toggle */}
              <div
                className="flex rounded-lg p-1"
                style={{ background: '#201f1f', border: '1px solid rgba(66,70,84,0.15)' }}
              >
                {(['list', 'tree'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className="px-3 py-1 rounded text-xs font-semibold transition-colors capitalize flex items-center gap-1"
                    style={viewMode === mode
                      ? { background: '#2a2a2a', color: '#b0c6ff' }
                      : { color: '#8d90a0' }}
                  >
                    {mode === 'list' ? <ListIcon /> : <TreeIcon />}
                    {mode === 'list' ? 'List' : 'Tree'}
                  </button>
                ))}
              </div>
              <ToolbarButton icon={<FilterIcon />} label="Filter" />
              <ToolbarButton icon={<SortIcon />}   label="Sort" />
              <ToolbarButton icon={<MoreIcon />} />
            </div>
          </div>

          {/* Folder navigation breadcrumb */}
          <div
            className="flex items-center gap-1 mb-2 px-3 py-2 rounded-lg"
            style={{ background: '#1c1b1b', border: '1px solid rgba(66,70,84,0.1)' }}
          >
            {/* Up button */}
            {!isAtRoot && (
              <button
                onClick={navigateUp}
                className="flex items-center justify-center rounded p-1 mr-1 transition-colors"
                style={{ color: '#8d90a0', background: 'transparent' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a'; (e.currentTarget as HTMLButtonElement).style.color = '#b0c6ff'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#8d90a0'; }}
                title="Up one level"
              >
                <ArrowUpIcon />
              </button>
            )}
            {/* Breadcrumb trail */}
            {breadcrumbs.map((item, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={item.path}>
                  {idx > 0 && (
                    <span style={{ color: '#424654', fontSize: 12, margin: '0 2px' }}>/</span>
                  )}
                  {isLast ? (
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded"
                      style={{ color: '#b0c6ff', background: 'rgba(176,198,255,0.08)' }}
                    >
                      <FolderOpenIcon /> {item.name}
                    </span>
                  ) : (
                    <button
                      onClick={() => navigateToBreadcrumb(item)}
                      className="text-xs font-medium px-2 py-0.5 rounded transition-colors"
                      style={{ color: '#8d90a0' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#b0c6ff'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#8d90a0'; }}
                    >
                      <FolderIcon /> {item.name}
                    </button>
                  )}
                </React.Fragment>
              );
            })}
            <span className="ml-auto text-[0.65rem]" style={{ color: '#424654' }}>
              {!loading && `${visibleNodes.length} item${visibleNodes.length !== 1 ? 's' : ''}`}
            </span>
          </div>

          {/* Table */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: '#1c1b1b', border: '1px solid rgba(66,70,84,0.1)' }}
          >
            <table className="w-full text-left" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr style={{ background: 'rgba(42,42,42,0.3)' }}>
                  <th className="py-3 px-4 w-10" style={{ borderBottom: '1px solid rgba(66,70,84,0.15)' }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected; }}
                      onChange={toggleSelectAll}
                      className="cursor-pointer"
                      style={{ accentColor: '#b0c6ff', width: 14, height: 14 }}
                    />
                  </th>
                  {['Name', 'Status', 'URL Path', 'Last Modified', 'Author'].map((col) => (
                    <th
                      key={col}
                      className="py-3 px-4 text-[0.7rem] font-bold uppercase tracking-widest"
                      style={{ borderBottom: '1px solid rgba(66,70,84,0.15)', color: '#8d90a0' }}
                    >
                      {col}
                    </th>
                  ))}
                  <th style={{ borderBottom: '1px solid rgba(66,70,84,0.15)', width: 48 }} />
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(66,70,84,0.08)' }}>
                        <td className="py-3 px-4"><div style={{ width: 14, height: 14, background: '#2a2a2a', borderRadius: 3 }} /></td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div style={{ width: 20, height: 20, background: '#2a2a2a', borderRadius: 4, flexShrink: 0 }} />
                            <div style={{ width: 140, height: 12, background: '#2a2a2a', borderRadius: 4 }} />
                          </div>
                        </td>
                        <td className="py-3 px-4"><div style={{ width: 60, height: 20, background: '#2a2a2a', borderRadius: 10 }} /></td>
                        <td className="py-3 px-4"><div style={{ width: 180, height: 10, background: '#2a2a2a', borderRadius: 4 }} /></td>
                        <td className="py-3 px-4"><div style={{ width: 60, height: 10, background: '#2a2a2a', borderRadius: 4 }} /></td>
                        <td className="py-3 px-4"><div style={{ width: 60, height: 10, background: '#2a2a2a', borderRadius: 4 }} /></td>
                        <td className="py-3 px-4" />
                      </tr>
                    ))}
                  </>
                )}
                {!loading && visibleNodes.map((node) => (
                  <ContentRow
                    key={node.id}
                    node={node}
                    isSelected={selected.has(node.id)}
                    onSelect={() => toggleSelect(node.id)}
                    onNavigate={() => navigateTo(node)}
                    showActionMenu={actionMenuId === node.id}
                    onActionMenu={(id) => setActionMenuId(id)}
                  />
                ))}
                {!loading && visibleNodes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-sm" style={{ color: '#8d90a0' }}>
                      {search
                        ? `No items matching "${search}" in this folder.`
                        : 'This folder is empty.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Footer */}
            {!loading && visibleNodes.length > 0 && (
              <div
                className="p-4 flex items-center justify-between"
                style={{ background: 'rgba(42,42,42,0.1)', borderTop: '1px solid rgba(66,70,84,0.1)' }}
              >
                <p className="text-[0.7rem] font-medium" style={{ color: '#8d90a0' }}>
                  Showing{' '}
                  <span style={{ color: '#e5e2e1' }}>{visibleNodes.length}</span>
                  {' '}item{visibleNodes.length !== 1 ? 's' : ''} in{' '}
                  <span style={{ color: '#e5e2e1' }}>{breadcrumbs[breadcrumbs.length - 1]?.name}</span>
                </p>
              </div>
            )}
          </div>

          {/* Activity Overview */}
          <div className="mt-8 pb-8">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#e5e2e1' }}>Activity Overview</h3>
            <div className="grid grid-cols-1 gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {/* Content Velocity */}
              <div
                className="rounded-xl p-5"
                style={{ background: '#1c1b1b', border: '1px solid rgba(66,70,84,0.1)' }}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(176,198,255,0.1)' }}>
                    <EditNoteIcon />
                  </div>
                  <span
                    className="text-[0.6rem] font-bold px-2 py-0.5 rounded-full"
                    style={{ color: '#b0c6ff', background: 'rgba(176,198,255,0.1)' }}
                  >
                    +12%
                  </span>
                </div>
                <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: '#8d90a0' }}>
                  Content Velocity
                </p>
                <h4 className="text-2xl font-bold" style={{ color: '#e5e2e1' }}>
                  {stats ? `${stats.totalPages} Pages` : '—'}
                </h4>
                <p className="text-[0.6875rem] mt-2" style={{ color: '#8d90a0' }}>
                  Total published across all sites.
                </p>
              </div>

              {/* Localization Health */}
              <div
                className="rounded-xl p-5"
                style={{ background: '#1c1b1b', border: '1px solid rgba(66,70,84,0.1)' }}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(255,181,155,0.1)' }}>
                    <TranslateIcon />
                  </div>
                  <span
                    className="text-[0.6rem] font-bold px-2 py-0.5 rounded-full"
                    style={{ color: '#8d90a0', background: '#201f1f' }}
                  >
                    85% Complete
                  </span>
                </div>
                <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: '#8d90a0' }}>
                  Localization Health
                </p>
                <h4 className="text-2xl font-bold" style={{ color: '#e5e2e1' }}>
                  {stats ? `${stats.siteCount} Site${stats.siteCount !== 1 ? 's' : ''}` : '—'}
                </h4>
                <p className="text-[0.6875rem] mt-2" style={{ color: '#8d90a0' }}>
                  Active sites across all regions.
                </p>
              </div>

              {/* Performance Index */}
              <div
                className="rounded-xl p-5"
                style={{ background: '#1c1b1b', border: '1px solid rgba(66,70,84,0.1)' }}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(179,197,253,0.1)' }}>
                    <InsightsIcon />
                  </div>
                  <span
                    className="text-[0.6rem] font-bold px-2 py-0.5 rounded-full"
                    style={{ color: '#ffb4ab', background: 'rgba(147,0,10,0.2)' }}
                  >
                    -2%
                  </span>
                </div>
                <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: '#8d90a0' }}>
                  Performance Index
                </p>
                <h4 className="text-2xl font-bold" style={{ color: '#e5e2e1' }}>94/100</h4>
                <p className="text-[0.6875rem] mt-2" style={{ color: '#8d90a0' }}>
                  Avg Core Web Vitals for live pages.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right context rail */}
      <div
        className="fixed top-16 right-0 flex flex-col items-center py-4 gap-4"
        style={{ width: 48, bottom: 0, background: '#0e0e0e', borderLeft: '1px solid rgba(66,70,84,0.1)' }}
      >
        <ContextRailButton title="Version history"><HistoryIcon /></ContextRailButton>
        <ContextRailButton title="Page info"><InfoIcon /></ContextRailButton>
        <ContextRailButton title="Comments"><CommentIcon /></ContextRailButton>
        <div className="mt-auto mb-20">
          <ContextRailButton title="Settings"><SettingsIcon /></ContextRailButton>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ContentRow — makes the whole row clickable for folder navigation
// ---------------------------------------------------------------------------

function ContentRow({
  node,
  isSelected,
  onSelect,
  onNavigate,
  showActionMenu,
  onActionMenu,
}: {
  node: ContentNode;
  isSelected: boolean;
  onSelect: () => void;
  onNavigate: () => void;
  showActionMenu: boolean;
  onActionMenu: (id: string | null) => void;
}) {
  const status = STATUS_CONFIG[node.status];

  return (
    <tr
      style={{
        background: isSelected ? 'rgba(176,198,255,0.06)' : 'transparent',
        borderBottom: '1px solid rgba(66,70,84,0.08)',
        cursor: 'pointer',
      }}
      onClick={onNavigate}
      onMouseEnter={(e) => {
        if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
      }}
    >
      {/* Checkbox — stops propagation so clicking it doesn't navigate */}
      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="cursor-pointer"
          style={{ accentColor: '#b0c6ff', width: 14, height: 14 }}
        />
      </td>

      {/* Name */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <MaterialIcon
            name={node.icon}
            color={node.status === 'error' ? '#ffb4ab' : node.status === 'live' ? '#b0c6ff' : '#8d90a0'}
          />
          <span className="text-sm font-semibold" style={{ color: '#e5e2e1' }}>
            {node.name}
          </span>
        </div>
      </td>

      {/* Status */}
      <td className="py-3 px-4">
        <span
          className="inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-full text-[0.65rem] font-bold uppercase"
          style={{ background: status.bg, color: status.text }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: status.dot, flexShrink: 0 }} />
          {status.label}
        </span>
      </td>

      {/* URL path */}
      <td className="py-3 px-4">
        <span className="text-xs font-mono" style={{ color: '#8d90a0' }}>
          {node.urlPath}
        </span>
      </td>

      {/* Last modified */}
      <td className="py-3 px-4">
        <span className="text-xs" style={{ color: '#8d90a0' }}>{node.lastModified}</span>
      </td>

      {/* Author */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span
            className="flex items-center justify-center text-[8px] font-bold rounded-full"
            style={{ width: 20, height: 20, background: node.author.color + '33', color: node.author.color, flexShrink: 0 }}
          >
            {node.author.initials}
          </span>
          <span className="text-xs font-medium" style={{ color: '#e5e2e1' }}>{node.author.name}</span>
        </div>
      </td>

      {/* Actions — stops propagation */}
      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => onActionMenu(showActionMenu ? null : node.id)}
            className="p-1 rounded transition-colors"
            style={{ color: '#8d90a0' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <MoreVertIcon />
          </button>
          {showActionMenu && (
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
              {/* Edit — open visual page editor */}
              <a
                href={`/editor?path=${encodeURIComponent(node.urlPath)}`}
                className="w-full text-left px-4 py-2 text-sm transition-colors flex items-center"
                style={{ color: '#e5e2e1', display: 'flex' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = '#2a2a2a'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
                onClick={() => onActionMenu(null)}
              >
                Edit
              </a>
              {/* Preview */}
              <a
                href={`/preview?path=${encodeURIComponent(node.urlPath)}`}
                className="w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2"
                style={{ color: '#b0c6ff', display: 'flex' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = '#2a2a2a'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
                onClick={() => onActionMenu(null)}
              >
                Preview
              </a>
              {/* Other actions */}
              {['Publish', 'Duplicate', 'Move', 'Delete'].map((action) => (
                <button
                  key={action}
                  className="w-full text-left px-4 py-2 text-sm transition-colors"
                  style={{ color: action === 'Delete' ? '#ffb4ab' : '#e5e2e1' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  onClick={() => onActionMenu(null)}
                >
                  {action}
                </button>
              ))}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Toolbar button
// ---------------------------------------------------------------------------

function ToolbarButton({ icon, label }: { icon: React.ReactNode; label?: string }) {
  return (
    <button
      className="h-9 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors"
      style={{
        padding: label ? '0 12px' : '0 10px',
        background: '#201f1f',
        color: '#8d90a0',
        border: '1px solid rgba(66,70,84,0.15)',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#201f1f'; }}
    >
      {icon}
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Context rail button
// ---------------------------------------------------------------------------

function ContextRailButton({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <button
      title={title}
      className="p-2 transition-colors"
      style={{ color: '#8d90a0' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#b0c6ff'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#8d90a0'; }}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Inline SVG icons (folder + navigation extras)
// ---------------------------------------------------------------------------

function FolderIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} aria-hidden="true">
      <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
    </svg>
  );
}

function FolderOpenIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} aria-hidden="true">
      <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  );
}

function MaterialIcon({ name, color = 'currentColor' }: { name: string; color?: string }) {
  const icons: Record<string, React.ReactNode> = {
    description: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={color} aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zm-7 14v-2h10v2H6zm0-4v-2h10v2H6zm0-4V8h4v2H6z"/>
      </svg>
    ),
    article: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={color} aria-hidden="true">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
      </svg>
    ),
    language: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={color} aria-hidden="true">
        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/>
      </svg>
    ),
    auto_stories: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={color} aria-hidden="true">
        <path d="M19 1l-5 5v11l5-4.5V1zM1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5V6c-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6zm22 13.5c-1.45-1.1-3.55-1.5-5.5-1.5-1.45 0-3.4.45-4.75 1.1V8l-1-1v13.65c1.45-1.1 3.55-1.5 5.5-1.5 1.95 0 3.85.4 5.5 1.35-.1.05-.15.05-.25.05-.25 0-.5-.25-.5-.5V19.5z"/>
      </svg>
    ),
  };
  return <>{icons[name] ?? <svg width="20" height="20" viewBox="0 0 24 24" fill={color} aria-hidden="true"><circle cx="12" cy="12" r="3"/></svg>}</>;
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8d90a0" strokeWidth="2" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  );
}

function SortIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
    </svg>
  );
}

function MoreVertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
    </svg>
  );
}

function PublishIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 2v13M7 7l5-5 5 5"/><path d="M5 17H3a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-2"/>
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/>
      <path d="M12 7v5l4 2"/>
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  );
}

function TreeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function EditNoteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#b0c6ff" aria-hidden="true">
      <path d="M3 10h11v2H3zm0-4h11v2H3zm0 8h7v2H3zm13.41-1.5L18 11l1.59 1.5L15.5 17 14 17l0-1.5zM20 9l-1.5-1.5L20 6l1.5 1.5L20 9z"/>
    </svg>
  );
}

function TranslateIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffb59b" aria-hidden="true">
      <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
    </svg>
  );
}

function InsightsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#b3c5fd" aria-hidden="true">
      <path d="M21 8c-1.45 0-2.26 1.44-1.93 2.51l-3.55 3.56c-.3-.09-.74-.09-1.04 0l-2.55-2.55C12.27 10.45 11.46 9 10 9c-1.45 0-2.27 1.44-1.93 2.52l-4.56 4.55C2.44 15.74 1 16.55 1 18c0 1.1.9 2 2 2 1.45 0 2.26-1.44 1.93-2.51l4.55-4.56c.3.09.74.09 1.04 0l2.55 2.55C12.73 16.55 13.54 18 15 18c1.45 0 2.27-1.44 1.93-2.52l3.56-3.55c1.07.33 2.51-.48 2.51-1.93 0-1.1-.9-2-2-2z"/>
    </svg>
  );
}
