'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@flexcms/ui';

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

import { getApiBase } from '@/lib/apiBase';
const API_BASE = getApiBase();

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
  /**
   * The variation an author edits. A fragment folder holds no components of its own —
   * its children are variations, and the components live under one of them — so this
   * is what the editor is opened on. `master` where it exists, otherwise the first.
   */
  editPath?: string;
  /** Every variation path, for operations that apply to the whole fragment. */
  variationPaths?: string[];
}

/** Slash form of an ltree path, which is what the editor route expects. */
function toEditorPath(ltreePath: string): string {
  return `/${ltreePath.replace(/^content\./, '').replace(/\./g, '/')}`;
}


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
  const router = useRouter();
  const [xfNodes, setXfNodes]           = useState<XFNode[]>([]);
  const [loading, setLoading]           = useState(true);
  const [view, setView]                 = useState<'list' | 'tree'>('tree');
  const [search, setSearch]             = useState('');
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [expanded, setExpanded]         = useState<Set<string>>(new Set());
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  /** The site the fragments were read from, and the locales it declares. */
  const [siteId, setSiteId] = useState<string>('');
  const [locales, setLocales] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  /**
   * Loads the fragments for the first configured site.
   *
   * The site is resolved rather than hardcoded: this page asked for `corporate`, which
   * is not a configured site here, so the list came back empty even when the URL was
   * right.
   */
  const loadFragments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const siteRes = await fetch(`${API_BASE}/api/admin/sites`);
      if (!siteRes.ok) throw new Error(`Could not read sites (HTTP ${siteRes.status})`);
      const sites = (await siteRes.json()) as Record<string, unknown>[];
      const site = sites[0];
      const siteId = site?.siteId as string | undefined;
      setSiteId(siteId ?? '');
      setLocales(
        Array.isArray(site?.supportedLocales) ? (site.supportedLocales as string[]) : [],
      );
      if (!siteId) {
        setXfNodes([]);
        setError('No site is configured, so there are no Experience Fragments to show.');
        return;
      }

      // Note the URL: the list is `GET /api/author/xf`. `/api/author/xf/list` matches
      // the `/{*xfPath}` catch-all and 404s as a fragment literally named "list".
      const res = await fetch(
        `${API_BASE}/api/author/xf?siteId=${encodeURIComponent(siteId)}&locale=en`,
      );
      if (!res.ok) throw new Error(`Could not list Experience Fragments (HTTP ${res.status})`);
      const data = (await res.json()) as Record<string, unknown>[];

      // Variations come from a second call per fragment: the list response carries no
      // variation data, and the variation is what an author actually edits.
      const items: XFNode[] = await Promise.all(
        data.map(async (n, i) => {
          const path = (n.xf_path as string) ?? '';
          let variations: Record<string, unknown>[] = [];
          try {
            const vres = await fetch(
              `${API_BASE}/api/author/xf/variations?path=${encodeURIComponent(path)}`,
            );
            if (vres.ok) variations = (await vres.json()) as Record<string, unknown>[];
          } catch {
            // A fragment with unreadable variations is still worth listing.
          }

          const paths = variations.map((v) => v.path as string).filter(Boolean);
          const master = paths.find((p) => p.endsWith('.master')) ?? paths[0];
          const published = variations.some((v) => v.status === 'PUBLISHED');
          const modifiedBy =
            (variations.find((v) => v.modifiedBy)?.modifiedBy as string) ?? 'system';

          return {
            id: path || String(i),
            name: (n.title as string) ?? path.split('.').pop() ?? 'Untitled',
            icon: 'widgets',
            status: (published ? 'live' : 'draft') as XFStatus,
            path,
            variationCount: paths.length,
            lastModified: n.updated_at
              ? new Date(n.updated_at as string).toLocaleDateString()
              : '—',
            author: {
              initials: modifiedBy.slice(0, 2).toUpperCase(),
              name: modifiedBy,
              color: '#b0c6ff',
            },
            depth: 0,
            editPath: master,
            variationPaths: paths,
          };
        }),
      );
      setXfNodes(items);
    } catch (e) {
      // Previously swallowed, which is why the page looked empty rather than broken.
      setXfNodes([]);
      setError(e instanceof Error ? e.message : 'Could not load Experience Fragments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadFragments(); }, [loadFragments]);

  /** Opens the editor on the fragment's variation. */
  const editFragment = useCallback((node: XFNode) => {
    if (!node.editPath) {
      setError(`"${node.name}" has no variation to edit yet — add one first.`);
      return;
    }
    router.push(`/editor?path=${encodeURIComponent(toEditorPath(node.editPath))}`);
  }, [router]);

  /**
   * Runs one fragment action, then re-reads the list.
   *
   * Every action here maps onto an endpoint that exists. `Rename` is absent from the
   * menu on purpose: the XF API has no rename, and shipping a button that cannot work
   * is the defect being fixed.
   */
  const runAction = useCallback(async (action: string, node: XFNode) => {
    if (action === 'Edit Variations') {
      editFragment(node);
      return;
    }

    setBusy(node.id);
    setError(null);
    try {
      if (action === 'Delete') {
        const res = await fetch(
          `${API_BASE}/api/author/xf/${node.path}?userId=admin`,
          { method: 'DELETE' },
        );
        if (!res.ok) throw new Error(`Delete failed (HTTP ${res.status})`);
      } else if (action === 'Publish') {
        // A fragment is published by publishing its variations; there is no
        // fragment-level publish endpoint.
        const paths = node.variationPaths ?? [];
        if (paths.length === 0) throw new Error('Nothing to publish — no variations exist.');
        for (const path of paths) {
          const res = await fetch(
            `${API_BASE}/api/author/content/node/status?path=${encodeURIComponent(path)}` +
              '&status=PUBLISHED&userId=admin',
            { method: 'POST' },
          );
          if (!res.ok) throw new Error(`Publishing ${path} failed (HTTP ${res.status})`);
        }
      } else if (action === 'Duplicate') {
        const segments = node.path.split('.');
        const name = segments.pop() ?? 'fragment';
        const siteId = segments[2] ?? '';
        const category = segments[3] ?? 'global';
        const res = await fetch(`${API_BASE}/api/author/xf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteId,
            locale: 'en',
            category,
            name: `${name}-copy`,
            title: `${node.name} (copy)`,
            description: `Copy of ${node.name}`,
            userId: 'admin',
          }),
        });
        if (!res.ok) throw new Error(`Duplicate failed (HTTP ${res.status})`);

        // The server decides the path — it inserts a locale segment, which a
        // hand-built path would miss. Predicting it left copies with no variations,
        // and a fragment without a variation cannot be edited.
        const createdNode = (await res.json()) as { path?: string };
        const copyPath = createdNode.path;
        if (!copyPath) throw new Error('Duplicate returned no path for the new fragment.');

        // Carry the variation structure across, so the copy is editable like the original.
        for (const variationPath of node.variationPaths ?? []) {
          const variationType = variationPath.split('.').pop() ?? 'master';
          const vres = await fetch(
            `${API_BASE}/api/author/xf/variations?path=${encodeURIComponent(copyPath)}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ variationType, title: variationType, userId: 'admin' }),
            },
          );
          if (!vres.ok) {
            throw new Error(
              `Copied the fragment but not its "${variationType}" variation (HTTP ${vres.status}).`,
            );
          }
        }
      } else if (action === 'New Fragment Here') {
        const segments = node.path.split('.');
        const siteId = segments[2] ?? '';
        const category = segments[3] ?? 'global';
        const name = `fragment-${Date.now()}`;
        const res = await fetch(`${API_BASE}/api/author/xf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteId,
            locale: 'en',
            category,
            name,
            title: 'New fragment',
            description: '',
            userId: 'admin',
          }),
        });
        if (!res.ok) throw new Error(`Create failed (HTTP ${res.status})`);

        const createdNode = (await res.json()) as { path?: string };
        if (!createdNode.path) throw new Error('Create returned no path for the new fragment.');

        // A fragment with no variation cannot be edited, so give it a master.
        const vres = await fetch(
          `${API_BASE}/api/author/xf/variations?path=${encodeURIComponent(createdNode.path)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ variationType: 'master', title: 'Master', userId: 'admin' }),
          },
        );
        if (!vres.ok) {
          throw new Error(
            `Created the fragment but could not add its master variation (HTTP ${vres.status}).`,
          );
        }
      }

      await loadFragments();
    } catch (e) {
      setError(e instanceof Error ? e.message : `${action} failed.`);
    } finally {
      setBusy(null);
    }
  }, [editFragment, loadFragments]);

  /** Figures for the footer and the Usage Overview, from the fragments actually loaded. */
  const totals = useMemo(() => {
    const all = flattenAll(xfNodes);
    const fragments = all.filter((n) => !n.children || n.children.length === 0);
    const variations = fragments.reduce((sum, n) => sum + n.variationCount, 0);
    // Anything that is not the master is an alternative variant of the fragment.
    const variants = fragments.reduce(
      (sum, n) => sum + (n.variationPaths ?? []).filter((p) => !p.endsWith('.master')).length,
      0,
    );
    const published = fragments.filter((n) => n.status === 'live').length;
    return { fragments: fragments.length, variations, variants, published };
  }, [xfNodes]);

  const visibleNodes = useMemo(() => {
    if (view === 'list') {
      const all = flattenAll(xfNodes);
      if (!search.trim()) return all;
      return all.filter(
        (n) =>
          n.name.toLowerCase().includes(search.toLowerCase()) ||
          n.path.toLowerCase().includes(search.toLowerCase()),
      );
    }
    const flat = flattenTree(xfNodes, expanded);
    if (!search.trim()) return flat;
    return flat.filter(
      (n) =>
        n.name.toLowerCase().includes(search.toLowerCase()) ||
        n.path.toLowerCase().includes(search.toLowerCase()),
    );
  }, [view, search, expanded, xfNodes]);

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
              <h1 className="text-3xl font-extrabold tracking-tight" data-testid="xf-heading" style={{ color: '#e5e2e1' }}>
                Experience Fragments
              </h1>
              <p className="text-sm mt-1" style={{ color: '#8d90a0' }}>
                Reusable content blocks shared across sites, channels and locales.
              </p>
              {/* Failures used to be swallowed by a bare `.catch(() => {})`, so a 404
                  from the list endpoint looked identical to having no fragments. */}
              {error && (
                <p
                  className="text-sm mt-2 rounded px-3 py-2"
                  style={{ color: '#ffb4ab', background: 'rgba(147,0,10,0.18)' }}
                  data-testid="xf-error"
                >
                  {error}
                </p>
              )}
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
                data-testid="xf-create-btn"
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
                  data-testid="xf-search"
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
            data-testid="xf-table"
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
                    onEdit={editFragment}
                    onAction={runAction}
                    busy={busy === node.id}
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
              <p className="text-[0.7rem] font-medium" style={{ color: '#8d90a0' }} data-testid="xf-count">
                Showing{' '}
                <span style={{ color: '#e5e2e1' }}>{visibleNodes.length}</span>
                {' '}of{' '}
                <span style={{ color: '#e5e2e1' }}>{totals.fragments}</span>
                {totals.fragments === 1 ? ' fragment' : ' fragments'}
              </p>
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
                badge={siteId || '—'}
                badgeColor="#b0c6ff"
                label="Fragments"
                value={`${totals.fragments} ${totals.fragments === 1 ? 'Fragment' : 'Fragments'}`}
                description={`${totals.variations} ${
                  totals.variations === 1 ? 'variation' : 'variations'
                } in total.`}
              />
              <StatCard
                iconName="translate"
                iconColor="#ffb59b"
                badge={`${locales.length} ${locales.length === 1 ? 'locale' : 'locales'}`}
                badgeColor="#8d90a0"
                label="Locales"
                value={locales.join(', ') || '—'}
                description="Locales this site is configured for."
              />
              <StatCard
                iconName="call_split"
                iconColor="#b3c5fd"
                badge={`${totals.published} live`}
                badgeColor="#b3c5fd"
                label="Alternative Variants"
                value={`${totals.variants} ${totals.variants === 1 ? 'Variant' : 'Variants'}`}
                description="Variations beyond each fragment's master."
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
  onEdit,
  onAction,
  busy,
}: {
  node: XFNode;
  isSelected: boolean;
  onSelect: () => void;
  isExpanded: boolean;
  onToggleExpand?: () => void;
  showActionMenu: boolean;
  onActionMenu: (id: string | null) => void;
  onEdit: (node: XFNode) => void;
  onAction: (action: string, node: XFNode) => void;
  busy: boolean;
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
          {isLeaf ? (
            // The primary way in. Opening a fragment used to be impossible from this
            // page: the name was plain text and every menu action was inert.
            <button
              type="button"
              onClick={() => onEdit(node)}
              className="text-sm font-semibold text-left transition-colors"
              style={{ color: '#e5e2e1', textDecoration: 'underline', textDecorationColor: 'transparent' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecorationColor = '#b0c6ff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecorationColor = 'transparent'; }}
              title={node.editPath ? `Edit ${node.editPath}` : 'No variation to edit yet'}
              data-testid={`xf-edit-${node.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
            >
              {node.name}
            </button>
          ) : (
            <span className="text-sm font-semibold" style={{ color: '#e5e2e1' }}>
              {node.name}
            </span>
          )}
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
              {/* Rename is absent deliberately: the XF API has no rename operation, and
                  an action that cannot work is the defect this page had. */}
              {(isLeaf
                ? ['Edit Variations', 'Publish', 'Duplicate', 'Delete']
                : ['New Fragment Here', 'Delete']
              ).map((action) => (
                <button
                  key={action}
                  className="w-full text-left px-4 py-2 text-sm transition-colors"
                  style={{ color: action === 'Delete' ? '#ffb4ab' : '#e5e2e1', opacity: busy ? 0.5 : 1 }}
                  disabled={busy}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  onClick={() => { onActionMenu(null); onAction(action, node); }}
                  data-testid={`xf-action-${action.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
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
