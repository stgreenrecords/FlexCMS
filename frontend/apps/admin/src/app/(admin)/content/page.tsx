'use client';

import React, { useState, useMemo } from 'react';
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
  urlPath: string;
  lastModified: string;
  author: { initials: string; name: string; color: string };
  depth?: number;
  children?: ContentNode[];
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_NODES: ContentNode[] = [
  {
    id: '1',
    name: 'Homepage Redesign',
    icon: 'description',
    status: 'live',
    urlPath: '/index',
    lastModified: '2 mins ago',
    author: { initials: 'JD', name: 'Jane Doe', color: 'var(--color-primary)' },
    depth: 0,
    children: [
      {
        id: '1-1',
        name: 'Hero Section',
        icon: 'article',
        status: 'live',
        urlPath: '/index#hero',
        lastModified: '5 mins ago',
        author: { initials: 'JD', name: 'Jane Doe', color: 'var(--color-primary)' },
        depth: 1,
      },
      {
        id: '1-2',
        name: 'Features Grid',
        icon: 'article',
        status: 'draft',
        urlPath: '/index#features',
        lastModified: '1 hour ago',
        author: { initials: 'MK', name: 'Marc K.', color: '#b3c5fd' },
        depth: 1,
      },
    ],
  },
  {
    id: '2',
    name: 'About Our Team',
    icon: 'article',
    status: 'draft',
    urlPath: '/company/about',
    lastModified: '1 hour ago',
    author: { initials: 'MK', name: 'Marc K.', color: '#b3c5fd' },
    depth: 0,
  },
  {
    id: '3',
    name: 'Product Catalog',
    icon: 'shopping_cart',
    status: 'live',
    urlPath: '/shop/catalog',
    lastModified: 'Yesterday',
    author: { initials: 'SA', name: 'Sarah A.', color: '#b0c6ff' },
    depth: 0,
    children: [
      {
        id: '3-1',
        name: 'Electronics',
        icon: 'article',
        status: 'live',
        urlPath: '/shop/catalog/electronics',
        lastModified: '2 days ago',
        author: { initials: 'SA', name: 'Sarah A.', color: '#b0c6ff' },
        depth: 1,
      },
      {
        id: '3-2',
        name: 'Clothing',
        icon: 'article',
        status: 'review',
        urlPath: '/shop/catalog/clothing',
        lastModified: '3 days ago',
        author: { initials: 'JD', name: 'Jane Doe', color: 'var(--color-primary)' },
        depth: 1,
      },
    ],
  },
  {
    id: '4',
    name: 'Contact (Broken Links)',
    icon: 'warning',
    status: 'error',
    urlPath: '/support/contact',
    lastModified: '3 days ago',
    author: { initials: 'SY', name: 'System', color: '#424654' },
    depth: 0,
  },
  {
    id: '5',
    name: 'Blog Article: Future of CMS',
    icon: 'auto_stories',
    status: 'archived',
    urlPath: '/blog/future-of-cms',
    lastModified: 'Oct 12, 2023',
    author: { initials: 'JD', name: 'Jane Doe', color: 'var(--color-primary)' },
    depth: 0,
  },
  {
    id: '6',
    name: 'Pricing Page',
    icon: 'description',
    status: 'review',
    urlPath: '/pricing',
    lastModified: '6 hours ago',
    author: { initials: 'MK', name: 'Marc K.', color: '#b3c5fd' },
    depth: 0,
  },
  {
    id: '7',
    name: 'Legal Documents',
    icon: 'gavel',
    status: 'live',
    urlPath: '/legal',
    lastModified: '1 week ago',
    author: { initials: 'SA', name: 'Sarah A.', color: '#b0c6ff' },
    depth: 0,
    children: [
      {
        id: '7-1',
        name: 'Privacy Policy',
        icon: 'article',
        status: 'live',
        urlPath: '/legal/privacy',
        lastModified: '1 week ago',
        author: { initials: 'SA', name: 'Sarah A.', color: '#b0c6ff' },
        depth: 1,
      },
      {
        id: '7-2',
        name: 'Terms of Service',
        icon: 'article',
        status: 'live',
        urlPath: '/legal/terms',
        lastModified: '1 week ago',
        author: { initials: 'SA', name: 'Sarah A.', color: '#b0c6ff' },
        depth: 1,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Status badge config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<ContentStatus, { label: string; dot: string; bg: string; text: string }> = {
  live:     { label: 'Live',     dot: 'var(--color-primary)',       bg: 'rgba(176,198,255,0.1)',  text: 'var(--color-primary)' },
  draft:    { label: 'Draft',    dot: '#ffb59b',                    bg: 'rgba(255,181,155,0.1)', text: '#ffb59b' },
  error:    { label: 'Error',    dot: '#ffb4ab',                    bg: 'rgba(147,0,10,0.2)',    text: '#ffb4ab' },
  archived: { label: 'Archived', dot: 'var(--color-muted-foreground)', bg: 'rgba(66,70,84,0.2)', text: 'var(--color-muted-foreground)' },
  review:   { label: 'In Review', dot: '#b3c5fd',                   bg: 'rgba(179,197,253,0.1)', text: '#b3c5fd' },
};

// ---------------------------------------------------------------------------
// Helpers to flatten tree for list/tree view
// ---------------------------------------------------------------------------

function flattenTree(nodes: ContentNode[], expanded: Set<string>): ContentNode[] {
  const result: ContentNode[] = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children && expanded.has(node.id)) {
      result.push(...flattenTree(node.children, expanded));
    }
  }
  return result;
}

function flattenAll(nodes: ContentNode[]): ContentNode[] {
  const result: ContentNode[] = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children) {
      result.push(...flattenAll(node.children));
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function ContentTreePage() {
  const [view, setView]               = useState<'list' | 'tree'>('list');
  const [search, setSearch]           = useState('');
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [expanded, setExpanded]       = useState<Set<string>>(new Set(['1', '3', '7']));
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  // Determine visible rows
  const visibleNodes = useMemo(() => {
    if (view === 'list') {
      const all = flattenAll(MOCK_NODES);
      if (!search.trim()) return all;
      return all.filter(
        (n) =>
          n.name.toLowerCase().includes(search.toLowerCase()) ||
          n.urlPath.toLowerCase().includes(search.toLowerCase()),
      );
    }
    // tree view: only top-level + expanded children
    const flat = flattenTree(MOCK_NODES, expanded);
    if (!search.trim()) return flat;
    return flat.filter(
      (n) =>
        n.name.toLowerCase().includes(search.toLowerCase()) ||
        n.urlPath.toLowerCase().includes(search.toLowerCase()),
    );
  }, [view, search, expanded]);

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

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const allSelected    = visibleNodes.length > 0 && selected.size === visibleNodes.length;
  const someSelected   = selected.size > 0 && selected.size < visibleNodes.length;

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
                <Button
                  variant="outline"
                  onClick={() => setSelected(new Set())}
                >
                  {selected.size} selected
                </Button>
              )}
              <button
                className="h-10 px-4 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                style={{
                  background: '#2a2a2a',
                  color: '#e5e2e1',
                  border: '1px solid rgba(66,70,84,0.3)',
                }}
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
            className="rounded-xl p-3 flex items-center justify-between mb-6"
            style={{
              background: '#1c1b1b',
              border: '1px solid rgba(66,70,84,0.1)',
            }}
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
                  style={{
                    background: '#201f1f',
                    border: 'none',
                    color: '#e5e2e1',
                    caretColor: '#b0c6ff',
                  }}
                />
              </div>

              <div style={{ width: '1px', height: '32px', background: 'rgba(66,70,84,0.3)' }} />

              {/* View toggle */}
              <div className="flex rounded-lg p-1" style={{ background: '#201f1f' }}>
                {(['list', 'tree'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className="px-3 py-1 rounded text-xs font-semibold transition-colors"
                    style={
                      view === v
                        ? { background: '#2a2a2a', color: '#b0c6ff' }
                        : { color: '#8d90a0' }
                    }
                  >
                    {v === 'list' ? <><ListIcon /> List</> : <><TreeIcon /> Tree</>}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ToolbarButton icon={<FilterIcon />} label="Filter" />
              <ToolbarButton icon={<SortIcon />}   label="Sort" />
              <ToolbarButton icon={<MoreIcon />} />
            </div>
          </div>

          {/* Table */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: '#1c1b1b',
              border: '1px solid rgba(66,70,84,0.1)',
            }}
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
                {visibleNodes.map((node) => (
                  <ContentRow
                    key={node.id}
                    node={node}
                    isSelected={selected.has(node.id)}
                    onSelect={() => toggleSelect(node.id)}
                    isExpanded={expanded.has(node.id)}
                    onToggleExpand={view === 'tree' ? () => toggleExpand(node.id) : undefined}
                    showActionMenu={actionMenuId === node.id}
                    onActionMenu={(id) => setActionMenuId(id)}
                  />
                ))}
                {visibleNodes.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-16 text-center text-sm"
                      style={{ color: '#8d90a0' }}
                    >
                      No pages found matching &quot;{search}&quot;
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Footer pagination */}
            <div
              className="p-4 flex items-center justify-between"
              style={{ background: 'rgba(42,42,42,0.1)', borderTop: '1px solid rgba(66,70,84,0.1)' }}
            >
              <p className="text-[0.7rem] font-medium" style={{ color: '#8d90a0' }}>
                Showing{' '}
                <span style={{ color: '#e5e2e1' }}>1 – {visibleNodes.length}</span>
                {' '}of{' '}
                <span style={{ color: '#e5e2e1' }}>124</span> pages
              </p>
              <PaginationControls />
            </div>
          </div>

          {/* Activity overview */}
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#e5e2e1' }}>
              Activity Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <StatCard
                iconName="edit_note"
                iconColor="#b0c6ff"
                badge="+12%"
                badgeColor="#b0c6ff"
                label="Content Velocity"
                value="42 New Pages"
                description="Added in the last 7 days across 4 sites."
              />
              <StatCard
                iconName="translate"
                iconColor="#ffb59b"
                badge="85% Complete"
                badgeColor="#8d90a0"
                label="Localization Health"
                value="12 Languages"
                description="Active sync across European regions."
              />
              <StatCard
                iconName="insights"
                iconColor="#b3c5fd"
                badge="-2%"
                badgeColor="#ffb4ab"
                label="Performance Index"
                value="94/100"
                description="Avg Core Web Vitals for live pages."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right context rail */}
      <div
        className="fixed top-16 right-0 flex flex-col items-center py-4 gap-4"
        style={{
          width: 48,
          bottom: 0,
          background: '#0e0e0e',
          borderLeft: '1px solid rgba(66,70,84,0.1)',
        }}
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
// ContentRow
// ---------------------------------------------------------------------------

function ContentRow({
  node,
  isSelected,
  onSelect,
  isExpanded,
  onToggleExpand,
  showActionMenu,
  onActionMenu,
}: {
  node: ContentNode;
  isSelected: boolean;
  onSelect: () => void;
  isExpanded: boolean;
  onToggleExpand?: () => void;
  showActionMenu: boolean;
  onActionMenu: (id: string | null) => void;
}) {
  const status = STATUS_CONFIG[node.status];
  const depth  = node.depth ?? 0;
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;

  return (
    <tr
      style={{
        background: isSelected ? 'rgba(176,198,255,0.06)' : 'transparent',
        borderBottom: '1px solid rgba(66,70,84,0.08)',
      }}
      onMouseLeave={() => { if (showActionMenu) onActionMenu(null); }}
    >
      {/* Checkbox */}
      <td className="py-3 px-4">
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
        <div
          className="flex items-center gap-3"
          style={{ paddingLeft: `${depth * 20}px` }}
        >
          {/* Expand/collapse toggle (tree view) */}
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="shrink-0 flex items-center justify-center transition-opacity"
              style={{
                width: 16,
                height: 16,
                color: '#8d90a0',
                opacity: hasChildren ? 1 : 0,
                cursor: hasChildren ? 'pointer' : 'default',
              }}
            >
              <ChevronIcon expanded={isExpanded} />
            </button>
          )}
          <MaterialIcon name={node.icon} color={node.status === 'error' ? '#ffb4ab' : node.status === 'live' ? '#b0c6ff' : '#8d90a0'} />
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
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: status.dot,
              flexShrink: 0,
            }}
          />
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
        <span className="text-xs" style={{ color: '#8d90a0' }}>
          {node.lastModified}
        </span>
      </td>

      {/* Author */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span
            className="flex items-center justify-center text-[8px] font-bold rounded-full"
            style={{
              width: 20,
              height: 20,
              background: node.author.color + '33',
              color: node.author.color,
              flexShrink: 0,
            }}
          >
            {node.author.initials}
          </span>
          <span className="text-xs font-medium" style={{ color: '#e5e2e1' }}>
            {node.author.name}
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="py-3 px-4 text-right" style={{ position: 'relative' }}>
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
              {/* Preview — navigates to the preview page */}
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
              {['Edit', 'Publish', 'Duplicate', 'Move', 'Delete'].map((action) => (
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
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  iconName,
  iconColor,
  badge,
  badgeColor,
  label,
  value,
  description,
}: {
  iconName: string;
  iconColor: string;
  badge: string;
  badgeColor: string;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: '#1c1b1b', border: '1px solid rgba(66,70,84,0.1)' }}
    >
      <div className="flex justify-between items-start mb-6">
        <div
          className="p-2 rounded-lg"
          style={{ background: iconColor + '1a' }}
        >
          <MaterialIcon name={iconName} color={iconColor} />
        </div>
        <span
          className="text-[0.6rem] font-bold px-2 py-0.5 rounded-full"
          style={{ color: badgeColor, background: badgeColor + '1a' }}
        >
          {badge}
        </span>
      </div>
      <p
        className="text-xs font-bold uppercase tracking-widest mb-1"
        style={{ color: '#8d90a0' }}
      >
        {label}
      </p>
      <h4 className="text-2xl font-bold" style={{ color: '#e5e2e1' }}>
        {value}
      </h4>
      <p className="text-[0.6875rem] mt-2" style={{ color: '#c3c6d6' }}>
        {description}
      </p>
    </div>
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
// Pagination controls
// ---------------------------------------------------------------------------

function PaginationControls() {
  const [page, setPage] = useState(1);
  return (
    <div className="flex gap-1">
      {[
        { label: '‹', action: () => setPage((p) => Math.max(1, p - 1)) },
        { label: '1', page: 1 },
        { label: '2', page: 2 },
        { label: '3', page: 3 },
        { label: '›', action: () => setPage((p) => Math.min(25, p + 1)) },
      ].map(({ label, page: pg, action }, i) => {
        const isActive = pg === page;
        return (
          <button
            key={i}
            onClick={action ?? (() => setPage(pg!))}
            className="flex items-center justify-center rounded text-xs font-bold transition-colors"
            style={{
              width: 32,
              height: 32,
              background: isActive ? '#b0c6ff' : '#201f1f',
              color: isActive ? '#002d6f' : '#8d90a0',
              border: '1px solid rgba(66,70,84,0.15)',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
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
// Material-style icon (inline SVG stubs — avoids font dependency)
// ---------------------------------------------------------------------------

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
    shopping_cart: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={color} aria-hidden="true">
        <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM5.2 5H3V3H1v2h2l3.6 7.59L5.25 15A2 2 0 0 0 7 18h14v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 14h8.45c.75 0 1.41-.41 1.75-1.03L21.7 6.5A1 1 0 0 0 21 5H5.2z"/>
      </svg>
    ),
    warning: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={color} aria-hidden="true">
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
      </svg>
    ),
    auto_stories: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={color} aria-hidden="true">
        <path d="M19 1l-5 5v11l5-4.5V1zM1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5V6c-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6zm22 13.5c-1.45-1.1-3.55-1.5-5.5-1.5-1.45 0-3.4.45-4.75 1.1V8l-1-1v13.65c1.45-1.1 3.55-1.5 5.5-1.5 1.95 0 3.85.4 5.5 1.35-.1.05-.15.05-.25.05-.25 0-.5-.25-.5-.5V19.5z"/>
      </svg>
    ),
    gavel: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={color} aria-hidden="true">
        <path d="M1 21h12v2H1zm5.5-4h1c.28 0 .5-.22.5-.5v-1.68l8.55-8.55c.2-.2.2-.51 0-.71L14.44 3.95a.5.5 0 0 0-.71 0L5.18 12.5H3.5c-.28 0-.5.22-.5.5v1c0 .28.22.5.5.5H5v1.5c0 .28.22.5.5.5zm3.54-9.02 1.44 1.44-7.02 7.02H3.5v-1.44l7.04-7.02zm2.87-2.87 1.44 1.44-1.44-1.44zm.71-.71 2.15 2.15L14.63 7.7l-2.15-2.15 1.14-1.15z"/>
      </svg>
    ),
    edit_note: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={color} aria-hidden="true">
        <path d="M3 10h11v2H3zm0-4h11v2H3zm0 8h7v2H3zm14.73-1.05 1.41 1.41L13 20.5V19h-1.5v-1.5l6.23-6.23zm1.41-1.41a1 1 0 0 1 1.41 0l.71.71a1 1 0 0 1 0 1.41l-.71.71-2.12-2.12.71-.71z"/>
      </svg>
    ),
    translate: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={color} aria-hidden="true">
        <path d="m12.87 15.07-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7 1.62-4.33L19.12 17h-3.24z"/>
      </svg>
    ),
    insights: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={color} aria-hidden="true">
        <path d="M21 8c-1.45 0-2.26 1.44-1.93 2.51l-3.55 3.56c-.3-.09-.74-.09-1.04 0l-2.55-2.55C12.27 10.45 11.46 9 10 9c-1.45 0-2.27 1.44-1.93 2.52l-4.56 4.55C2.44 15.74 1 16.55 1 18c0 1.1.9 2 2 2 1.45 0 2.26-1.44 1.93-2.51l4.55-4.56c.3.09.74.09 1.04 0l2.55 2.55C12.73 16.55 13.54 18 15 18c1.45 0 2.27-1.44 1.93-2.52l3.56-3.55c1.07.33 2.51-.48 2.51-1.93 0-1.1-.9-2-2-2z"/>
      </svg>
    ),
  };

  return <>{icons[name] ?? <svg width="20" height="20" viewBox="0 0 24 24" fill={color} aria-hidden="true"><circle cx="12" cy="12" r="3"/></svg>}</>;
}

// ---------------------------------------------------------------------------
// Small inline SVG icons
// ---------------------------------------------------------------------------

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8d90a0" strokeWidth="2" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: 'inline', marginRight: 4 }} aria-hidden="true">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  );
}

function TreeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', marginRight: 4 }} aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
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

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6"/>
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
