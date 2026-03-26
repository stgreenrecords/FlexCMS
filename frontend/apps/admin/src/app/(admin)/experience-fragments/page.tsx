'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@flexcms/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type XFStatus = 'live' | 'draft' | 'error' | 'archived' | 'review';

interface XFNode {
  id: string;
  name: string;
  icon: string;
  status: XFStatus;
  path: string;
  variationCount: number;
  lastModified: string;
  author: { initials: string; name: string; color: string };
  depth?: number;
  children?: XFNode[];
}

// ---------------------------------------------------------------------------
// Mock data — organised: site → locale → category → XF
// ---------------------------------------------------------------------------

const MOCK_XF_NODES: XFNode[] = [
  {
    id: 'site-1',
    name: 'Corporate Portal',
    icon: 'language',
    status: 'live',
    path: '/content/experience-fragments/corporate-portal',
    variationCount: 0,
    lastModified: '2 mins ago',
    author: { initials: 'JD', name: 'Jane Doe', color: 'var(--color-primary)' },
    depth: 0,
    children: [
      {
        id: 'site-1-en',
        name: 'en-GB',
        icon: 'translate',
        status: 'live',
        path: '/content/experience-fragments/corporate-portal/en-gb',
        variationCount: 0,
        lastModified: '2 mins ago',
        author: { initials: 'JD', name: 'Jane Doe', color: 'var(--color-primary)' },
        depth: 1,
        children: [
          {
            id: 'site-1-en-footer',
            name: 'Footer',
            icon: 'folder',
            status: 'live',
            path: '/content/experience-fragments/corporate-portal/en-gb/footer',
            variationCount: 0,
            lastModified: '5 mins ago',
            author: { initials: 'JD', name: 'Jane Doe', color: 'var(--color-primary)' },
            depth: 2,
            children: [
              {
                id: 'xf-1',
                name: 'Global Footer — 2024',
                icon: 'widgets',
                status: 'live',
                path: '/content/experience-fragments/corporate-portal/en-gb/footer/global-footer-2024',
                variationCount: 3,
                lastModified: '5 mins ago',
                author: { initials: 'JD', name: 'Jane Doe', color: 'var(--color-primary)' },
                depth: 3,
              },
              {
                id: 'xf-2',
                name: 'Minimal Footer',
                icon: 'widgets',
                status: 'draft',
                path: '/content/experience-fragments/corporate-portal/en-gb/footer/minimal-footer',
                variationCount: 1,
                lastModified: '1 hour ago',
                author: { initials: 'MK', name: 'Marc K.', color: '#b3c5fd' },
                depth: 3,
              },
            ],
          },
          {
            id: 'site-1-en-header',
            name: 'Header',
            icon: 'folder',
            status: 'live',
            path: '/content/experience-fragments/corporate-portal/en-gb/header',
            variationCount: 0,
            lastModified: '1 day ago',
            author: { initials: 'SA', name: 'Sarah A.', color: '#b0c6ff' },
            depth: 2,
            children: [
              {
                id: 'xf-3',
                name: 'Primary Header Nav',
                icon: 'widgets',
                status: 'live',
                path: '/content/experience-fragments/corporate-portal/en-gb/header/primary-nav',
                variationCount: 2,
                lastModified: '1 day ago',
                author: { initials: 'SA', name: 'Sarah A.', color: '#b0c6ff' },
                depth: 3,
              },
            ],
          },
          {
            id: 'site-1-en-promo',
            name: 'Promotional Banners',
            icon: 'folder',
            status: 'review',
            path: '/content/experience-fragments/corporate-portal/en-gb/promo',
            variationCount: 0,
            lastModified: '3 days ago',
            author: { initials: 'MK', name: 'Marc K.', color: '#b3c5fd' },
            depth: 2,
            children: [
              {
                id: 'xf-4',
                name: 'Spring Sale Banner',
                icon: 'widgets',
                status: 'review',
                path: '/content/experience-fragments/corporate-portal/en-gb/promo/spring-sale',
                variationCount: 4,
                lastModified: '3 days ago',
                author: { initials: 'MK', name: 'Marc K.', color: '#b3c5fd' },
                depth: 3,
              },
              {
                id: 'xf-5',
                name: 'Announcement Bar',
                icon: 'widgets',
                status: 'draft',
                path: '/content/experience-fragments/corporate-portal/en-gb/promo/announcement-bar',
                variationCount: 1,
                lastModified: '5 days ago',
                author: { initials: 'JD', name: 'Jane Doe', color: 'var(--color-primary)' },
                depth: 3,
              },
            ],
          },
        ],
      },
      {
        id: 'site-1-de',
        name: 'de-DE',
        icon: 'translate',
        status: 'draft',
        path: '/content/experience-fragments/corporate-portal/de-de',
        variationCount: 0,
        lastModified: '2 days ago',
        author: { initials: 'SA', name: 'Sarah A.', color: '#b0c6ff' },
        depth: 1,
        children: [
          {
            id: 'site-1-de-footer',
            name: 'Footer',
            icon: 'folder',
            status: 'draft',
            path: '/content/experience-fragments/corporate-portal/de-de/footer',
            variationCount: 0,
            lastModified: '2 days ago',
            author: { initials: 'SA', name: 'Sarah A.', color: '#b0c6ff' },
            depth: 2,
            children: [
              {
                id: 'xf-6',
                name: 'Global Footer — DE',
                icon: 'widgets',
                status: 'draft',
                path: '/content/experience-fragments/corporate-portal/de-de/footer/global-footer-de',
                variationCount: 2,
                lastModified: '2 days ago',
                author: { initials: 'SA', name: 'Sarah A.', color: '#b0c6ff' },
                depth: 3,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'site-2',
    name: 'E-Commerce Store',
    icon: 'language',
    status: 'live',
    path: '/content/experience-fragments/ecommerce',
    variationCount: 0,
    lastModified: '1 week ago',
    author: { initials: 'SA', name: 'Sarah A.', color: '#b0c6ff' },
    depth: 0,
    children: [
      {
        id: 'site-2-en',
        name: 'en-US',
        icon: 'translate',
        status: 'live',
        path: '/content/experience-fragments/ecommerce/en-us',
        variationCount: 0,
        lastModified: '1 week ago',
        author: { initials: 'SA', name: 'Sarah A.', color: '#b0c6ff' },
        depth: 1,
        children: [
          {
            id: 'site-2-en-cart',
            name: 'Cart & Checkout',
            icon: 'folder',
            status: 'live',
            path: '/content/experience-fragments/ecommerce/en-us/cart',
            variationCount: 0,
            lastModified: '1 week ago',
            author: { initials: 'SA', name: 'Sarah A.', color: '#b0c6ff' },
            depth: 2,
            children: [
              {
                id: 'xf-7',
                name: 'Cart Upsell Block',
                icon: 'widgets',
                status: 'live',
                path: '/content/experience-fragments/ecommerce/en-us/cart/cart-upsell',
                variationCount: 2,
                lastModified: '1 week ago',
                author: { initials: 'SA', name: 'Sarah A.', color: '#b0c6ff' },
                depth: 3,
              },
              {
                id: 'xf-8',
                name: 'Checkout Trust Badges',
                icon: 'widgets',
                status: 'archived',
                path: '/content/experience-fragments/ecommerce/en-us/cart/trust-badges',
                variationCount: 1,
                lastModified: 'Oct 12, 2023',
                author: { initials: 'JD', name: 'Jane Doe', color: 'var(--color-primary)' },
                depth: 3,
              },
            ],
          },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Status badge config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<XFStatus, { label: string; dot: string; bg: string; text: string }> = {
  live:     { label: 'Live',      dot: 'var(--color-primary)',          bg: 'rgba(176,198,255,0.1)',  text: 'var(--color-primary)' },
  draft:    { label: 'Draft',     dot: '#ffb59b',                       bg: 'rgba(255,181,155,0.1)', text: '#ffb59b' },
  error:    { label: 'Error',     dot: '#ffb4ab',                       bg: 'rgba(147,0,10,0.2)',    text: '#ffb4ab' },
  archived: { label: 'Archived',  dot: 'var(--color-muted-foreground)', bg: 'rgba(66,70,84,0.2)',    text: 'var(--color-muted-foreground)' },
  review:   { label: 'In Review', dot: '#b3c5fd',                       bg: 'rgba(179,197,253,0.1)', text: '#b3c5fd' },
};

// ---------------------------------------------------------------------------
// Tree flatten helpers
// ---------------------------------------------------------------------------

function flattenTree(nodes: XFNode[], expanded: Set<string>): XFNode[] {
  const result: XFNode[] = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children && expanded.has(node.id)) {
      result.push(...flattenTree(node.children, expanded));
    }
  }
  return result;
}

function flattenAll(nodes: XFNode[]): XFNode[] {
  const result: XFNode[] = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children) result.push(...flattenAll(node.children));
  }
  return result;
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function ExperienceFragmentsPage() {
  const [view, setView]                 = useState<'list' | 'tree'>('tree');
  const [search, setSearch]             = useState('');
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [expanded, setExpanded]         = useState<Set<string>>(new Set(['site-1', 'site-1-en', 'site-1-en-footer', 'site-2']));
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const visibleNodes = useMemo(() => {
    if (view === 'list') {
      const all = flattenAll(MOCK_XF_NODES);
      if (!search.trim()) return all;
      return all.filter(
        (n) =>
          n.name.toLowerCase().includes(search.toLowerCase()) ||
          n.path.toLowerCase().includes(search.toLowerCase()),
      );
    }
    const flat = flattenTree(MOCK_XF_NODES, expanded);
    if (!search.trim()) return flat;
    return flat.filter(
      (n) =>
        n.name.toLowerCase().includes(search.toLowerCase()) ||
        n.path.toLowerCase().includes(search.toLowerCase()),
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

  const allSelected  = visibleNodes.length > 0 && selected.size === visibleNodes.length;
  const someSelected = selected.size > 0 && selected.size < visibleNodes.length;

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
            <span style={{ color: '#b0c6ff' }}>Experience Fragments</span>
          </nav>

          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: '#e5e2e1' }}>
                Experience Fragments
              </h1>
              <p className="text-sm mt-1" style={{ color: '#8d90a0' }}>
                Reusable content blocks shared across sites, channels and locales.
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
                <ChannelsIcon />
                Manage Channels
              </button>
              <Button
                style={{
                  background: 'linear-gradient(135deg, #b0c6ff 0%, #0058cc 100%)',
                  color: '#002d6f',
                  border: 'none',
                  fontWeight: 600,
                }}
              >
                + Create Fragment
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
                  placeholder="Filter by name or path..."
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
                    {v === 'list' ? <><ListIcon /> List</> : <><TreeViewIcon /> Tree</>}
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
                  {['Name', 'Variations', 'Status', 'Path', 'Last Modified', 'Author'].map((col) => (
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
                  <XFRow
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
                      colSpan={8}
                      className="py-16 text-center text-sm"
                      style={{ color: '#8d90a0' }}
                    >
                      No fragments found matching &quot;{search}&quot;
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
                <span style={{ color: '#e5e2e1' }}>38</span> fragments
              </p>
              <PaginationControls />
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#e5e2e1' }}>
              Usage Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <StatCard
                iconName="widgets"
                iconColor="#b0c6ff"
                badge="+5"
                badgeColor="#b0c6ff"
                label="Active Fragments"
                value="38 Fragments"
                description="Used across 6 sites and 12 channel configurations."
              />
              <StatCard
                iconName="translate"
                iconColor="#ffb59b"
                badge="9 locales"
                badgeColor="#8d90a0"
                label="Localisation"
                value="72% Translated"
                description="28% of fragments awaiting localisation into target locales."
              />
              <StatCard
                iconName="call_split"
                iconColor="#b3c5fd"
                badge="3 active"
                badgeColor="#b3c5fd"
                label="A/B Variants"
                value="12 Variants"
                description="Live A/B tests running across promotional banners."
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
        <ContextRailButton title="Fragment info"><InfoIcon /></ContextRailButton>
        <ContextRailButton title="Comments"><CommentIcon /></ContextRailButton>
        <div className="mt-auto mb-20">
          <ContextRailButton title="Settings"><SettingsGearIcon /></ContextRailButton>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// XFRow
// ---------------------------------------------------------------------------

function XFRow({
  node,
  isSelected,
  onSelect,
  isExpanded,
  onToggleExpand,
  showActionMenu,
  onActionMenu,
}: {
  node: XFNode;
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
  const isLeaf = node.icon === 'widgets';

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
          style={{ paddingLeft: `${depth * 18}px` }}
        >
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
          <NodeIcon name={node.icon} status={node.status} />
          <span className="text-sm font-semibold" style={{ color: '#e5e2e1' }}>
            {node.name}
          </span>
        </div>
      </td>

      {/* Variations */}
      <td className="py-3 px-4">
        {isLeaf && node.variationCount > 0 ? (
          <span
            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold"
            style={{ background: 'rgba(176,198,255,0.1)', color: 'var(--color-primary)' }}
          >
            <VariationsIcon />
            {node.variationCount}
          </span>
        ) : (
          <span className="text-xs" style={{ color: '#424654' }}>—</span>
        )}
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

      {/* Path */}
      <td className="py-3 px-4">
        <span className="text-xs font-mono" style={{ color: '#8d90a0' }}>
          {node.path}
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
                minWidth: 180,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
            >
              {(isLeaf
                ? ['Edit Variations', 'Publish', 'Duplicate', 'Delete']
                : ['New Fragment Here', 'Rename', 'Delete']
              ).map((action) => (
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
      <div className="flex items-center justify-between mb-3">
        <span
          className="flex items-center justify-center rounded-lg"
          style={{ width: 36, height: 36, background: iconColor + '1a' }}
        >
          <span className="material-icons-round text-[18px]" style={{ color: iconColor }}>
            {iconName}
          </span>
        </span>
        <span
          className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full"
          style={{ background: badgeColor + '1a', color: badgeColor }}
        >
          {badge}
        </span>
      </div>
      <p className="text-[0.65rem] font-bold uppercase tracking-widest mb-1" style={{ color: '#8d90a0' }}>
        {label}
      </p>
      <p className="text-lg font-extrabold" style={{ color: '#e5e2e1' }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: '#8d90a0' }}>{description}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function NodeIcon({ name, status }: { name: string; status: XFStatus }) {
  const color =
    name === 'language' ? '#b0c6ff' :
    name === 'translate' ? '#b3c5fd' :
    name === 'folder' ? '#ffb59b' :
    status === 'error' ? '#ffb4ab' :
    status === 'live' ? '#b0c6ff' :
    '#8d90a0';
  return (
    <span className="material-icons-round text-[18px] shrink-0" style={{ color }} aria-hidden="true">
      {name}
    </span>
  );
}

function ToolbarButton({ icon, label }: { icon: React.ReactNode; label?: string }) {
  return (
    <button
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
      style={{ color: '#8d90a0', background: 'transparent' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a'; (e.currentTarget as HTMLButtonElement).style.color = '#e5e2e1'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#8d90a0'; }}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}

function ContextRailButton({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <button
      title={title}
      className="flex items-center justify-center rounded-lg transition-colors"
      style={{ width: 32, height: 32, color: '#424654' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#1c1b1b'; (e.currentTarget as HTMLButtonElement).style.color = '#b0c6ff'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#424654'; }}
    >
      {children}
    </button>
  );
}

function PaginationControls() {
  return (
    <div className="flex items-center gap-1">
      {['‹', '1', '2', '3', '…', '8', '›'].map((p, i) => (
        <button
          key={i}
          className="w-7 h-7 rounded text-xs font-semibold transition-colors"
          style={
            p === '1'
              ? { background: '#2a2a2a', color: '#b0c6ff' }
              : { color: '#8d90a0' }
          }
          onMouseEnter={(e) => { if (p !== '1') (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a'; }}
          onMouseLeave={(e) => { if (p !== '1') (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#8d90a0"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline', marginRight: 4 }}>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function TreeViewIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline', marginRight: 4 }}>
      <path d="M22 17H2a3 3 0 0 0 3-3V5a3 3 0 0 0-3 3" />
      <path d="M6 7v10" />
      <path d="M6 12h8" />
      <path d="M14 7v10" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="21" y1="10" x2="7" y2="10" />
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" />
      <line x1="21" y1="18" x2="7" y2="18" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
    </svg>
  );
}

function MoreVertIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
    </svg>
  );
}

function VariationsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3h5v5" /><path d="M8 3H3v5" /><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" />
      <path d="m15 9 6-6" />
    </svg>
  );
}

function ChannelsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6l8-4 8 4" /><path d="M4 18l8 4 8-4" />
      <path d="M4 12l8 4 8-4" /><path d="M4 6v12" /><path d="M20 6v12" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function SettingsGearIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
