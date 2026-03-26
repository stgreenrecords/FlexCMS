'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem,
  BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage,
  Skeleton,
} from '@flexcms/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CatalogStatus = 'active' | 'draft' | 'archived';

interface Catalog {
  id: string;
  catalogId: string;
  name: string;
  season: string;
  status: CatalogStatus;
  productCount: number;
  productDelta?: number;
  lastSync: string;
  thumbnail?: string;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_FLEXCMS_API ?? 'http://localhost:8080';

function apiToCatalog(c: Record<string, unknown>): Catalog {
  const statusRaw = ((c.status as string) ?? 'DRAFT').toUpperCase();
  const statusMap: Record<string, CatalogStatus> = {
    ACTIVE: 'active',
    DRAFT: 'draft',
    ARCHIVED: 'archived',
  };
  const season = (c.season as string) ?? `${c.year ?? ''}`;
  return {
    id: (c.id as string) ?? '',
    catalogId: `CAT-${(c.year as number) ?? ''}-${((c.season as string) ?? '').slice(0, 2).toUpperCase() || 'XX'}`,
    name: (c.name as string) ?? 'Unnamed Catalog',
    season,
    status: statusMap[statusRaw] ?? 'draft',
    productCount: 0,
    lastSync: c.updatedAt
      ? new Date(c.updatedAt as string).toLocaleDateString()
      : '—',
  };
}


const STATUS_CONFIG: Record<CatalogStatus, { label: string; bg: string; color: string; dot: string }> = {
  active: {
    label: 'Active',
    bg: 'rgba(176,198,255,0.1)',
    color: '#b0c6ff',
    dot: '#b0c6ff',
  },
  draft: {
    label: 'Draft',
    bg: 'rgba(179,197,253,0.15)',
    color: '#b3c5fd',
    dot: '#b3c5fd',
  },
  archived: {
    label: 'Archived',
    bg: 'rgba(141,144,160,0.15)',
    color: '#8d90a0',
    dot: '#8d90a0',
  },
};

const SEASONS = ['All Seasons', 'Summer 2026', 'Spring 2026', 'Winter 2025', 'Permanent'];
const STATUS_FILTERS = ['All Status', 'Active', 'Draft', 'Archived'];

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function CatalogListSkeleton() {
  return (
    <div className="px-8 flex-1 pb-10">
      <div style={{ background: '#1c1b1b', borderRadius: 12, overflow: 'hidden' }}>
        <div className="p-4 flex gap-4" style={{ borderBottom: '1px solid rgba(66,70,84,0.2)' }}>
          <Skeleton style={{ height: 36, width: 300, borderRadius: 8 }} />
          <Skeleton style={{ height: 36, width: 140, borderRadius: 8 }} />
          <Skeleton style={{ height: 36, width: 140, borderRadius: 8 }} />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-5" style={{ borderBottom: '1px solid rgba(66,70,84,0.1)' }}>
            <Skeleton style={{ width: 40, height: 40, borderRadius: 8 }} />
            <div className="flex-1 space-y-2">
              <Skeleton style={{ height: 14, width: 220, borderRadius: 4 }} />
              <Skeleton style={{ height: 11, width: 100, borderRadius: 4 }} />
            </div>
            <Skeleton style={{ height: 20, width: 80, borderRadius: 12 }} />
            <Skeleton style={{ height: 14, width: 60, borderRadius: 4 }} />
            <Skeleton style={{ height: 14, width: 80, borderRadius: 4 }} />
            <Skeleton style={{ height: 14, width: 80, borderRadius: 4 }} />
            <Skeleton style={{ width: 32, height: 32, borderRadius: 8 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function PimCatalogListPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [search, setSearch] = useState('');
  const [seasonFilter, setSeasonFilter] = useState('All Seasons');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [page, setPage] = useState(1);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const pageSize = 10;

  // Fetch catalogs from PIM API
  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_BASE}/api/pim/v1/catalogs`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: Record<string, unknown>[]) => {
        const items = data.map(apiToCatalog);
        setCatalogs(items);
      })
      .catch(() => setCatalogs([]))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return catalogs.filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(q) || c.catalogId.toLowerCase().includes(q);
      const matchSeason = seasonFilter === 'All Seasons' || c.season === seasonFilter;
      const matchStatus = statusFilter === 'All Status' || c.status === statusFilter.toLowerCase();
      return matchSearch && matchSeason && matchStatus;
    });
  }, [search, seasonFilter, statusFilter, catalogs]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const handleActionToggle = (id: string) => {
    setActionMenuId((prev) => (prev === id ? null : id));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#201f1f' }}>
        <div className="px-8 pt-10 pb-6">
          <Skeleton style={{ height: 36, width: 180, borderRadius: 6 }} />
          <Skeleton style={{ height: 16, width: 340, borderRadius: 4, marginTop: 8 }} />
        </div>
        <CatalogListSkeleton />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#201f1f' }}
      onClick={() => setActionMenuId(null)}
    >
      {/* ── Breadcrumb ── */}
      <div className="px-8 pt-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" style={{ color: '#8d90a0' }}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage style={{ color: '#e5e2e1' }}>Products</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage style={{ color: '#e5e2e1' }}>Catalogs</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* ── Hero Header ── */}
      <section className="px-8 pt-6 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1
            className="text-3xl font-extrabold tracking-tight"
            style={{ color: '#e5e2e1', fontFamily: 'Inter, sans-serif' }}
          >
            Catalog List
          </h1>
          <p className="text-sm font-medium" style={{ color: '#8d90a0', maxWidth: 520 }}>
            Orchestrate and manage your seasonal product collections across global distribution channels.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all active:scale-95"
            style={{ background: '#353534', color: '#e5e2e1' }}
          >
            <span className="material-symbols-outlined text-lg">file_download</span>
            Export
          </button>
          <button
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded shadow-lg transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #b0c6ff, #0058cc)',
              color: '#002d6f',
            }}
          >
            <span className="material-symbols-outlined text-lg font-bold">add</span>
            Create Catalog
          </button>
        </div>
      </section>

      {/* ── Toolbar / Filters ── */}
      <section className="px-8 mb-6">
        <div
          className="flex flex-col lg:flex-row items-center gap-4 p-4 rounded-xl"
          style={{ background: '#1c1b1b' }}
        >
          {/* Search */}
          <div className="relative flex-1 w-full">
            <span
              className="material-symbols-outlined absolute text-xl"
              style={{ left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8d90a0' }}
            >
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Filter by catalog name or ID..."
              className="w-full text-sm rounded-lg py-2.5 transition-all"
              style={{
                background: '#353534',
                border: 'none',
                borderBottom: '2px solid transparent',
                color: '#e5e2e1',
                paddingLeft: 44,
                paddingRight: 16,
                outline: 'none',
              }}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = '#b0c6ff')}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = 'transparent')}
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <select
              value={seasonFilter}
              onChange={(e) => { setSeasonFilter(e.target.value); setPage(1); }}
              className="text-sm py-2.5 px-4 rounded-lg appearance-none"
              style={{ background: '#353534', border: 'none', color: '#c3c6d6', minWidth: 160 }}
            >
              {SEASONS.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="text-sm py-2.5 px-4 rounded-lg appearance-none"
              style={{ background: '#353534', border: 'none', color: '#c3c6d6', minWidth: 140 }}
            >
              {STATUS_FILTERS.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button
              className="p-2.5 rounded-lg transition-colors"
              style={{ background: '#353534', color: '#8d90a0' }}
            >
              <span className="material-symbols-outlined">filter_list</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Data Table ── */}
      <section className="px-8 flex-1 pb-10">
        {filtered.length === 0 ? (
          /* ── Empty State ── */
          <div
            className="flex flex-col items-center justify-center py-24 rounded-xl"
            style={{ background: '#1c1b1b' }}
          >
            <span className="material-symbols-outlined text-5xl mb-4" style={{ color: '#424654' }}>
              inventory_2
            </span>
            <h3 className="text-lg font-bold mb-2" style={{ color: '#e5e2e1' }}>No catalogs found</h3>
            <p className="text-sm mb-6" style={{ color: '#8d90a0' }}>
              {search ? 'Try adjusting your filters or search terms.' : 'Create your first catalog to get started.'}
            </p>
            {!search && (
              <button
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded shadow-lg"
                style={{ background: 'linear-gradient(135deg, #b0c6ff, #0058cc)', color: '#002d6f' }}
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Create Catalog
              </button>
            )}
          </div>
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: '#1c1b1b', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ background: 'rgba(42,42,42,0.5)' }}>
                    {['Catalog Name', 'Season', 'Status', 'Product Count', 'Last Sync', 'Actions'].map((col, i) => (
                      <th
                        key={col}
                        className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold"
                        style={{ color: '#8d90a0', textAlign: i === 5 ? 'right' : 'left' }}
                      >
                        {col === 'Catalog Name' ? (
                          <div className="flex items-center gap-2">
                            {col}
                            <span className="material-symbols-outlined text-sm">arrow_downward</span>
                          </div>
                        ) : col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((catalog) => {
                    const statusCfg = STATUS_CONFIG[catalog.status];
                    return (
                      <tr
                        key={catalog.id}
                        className="group transition-colors"
                        style={{ borderTop: '1px solid rgba(66,70,84,0.1)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(42,42,42,0.6)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Catalog Name + Thumbnail */}
                        <td className="px-6 py-5">
                          <Link href={`/pim/${catalog.id}`} className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden"
                              style={{
                                background: '#353534',
                                border: '1px solid rgba(66,70,84,0.2)',
                                flexShrink: 0,
                              }}
                            >
                              {catalog.thumbnail ? (
                                <img
                                  src={catalog.thumbnail}
                                  alt={catalog.name}
                                  className="w-full h-full object-cover"
                                  style={{ opacity: 0.6 }}
                                />
                              ) : (
                                <span className="material-symbols-outlined text-lg" style={{ color: '#8d90a0' }}>
                                  inventory_2
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-sm hover:underline" style={{ color: '#e5e2e1' }}>
                                {catalog.name}
                              </p>
                              <p
                                className="text-[11px] font-medium uppercase tracking-tight"
                                style={{ color: '#8d90a0' }}
                              >
                                ID: {catalog.catalogId}
                              </p>
                            </div>
                          </Link>
                        </td>

                        {/* Season */}
                        <td className="px-6 py-5 text-sm font-medium" style={{ color: '#c3c6d6' }}>
                          {catalog.season}
                        </td>

                        {/* Status badge */}
                        <td className="px-6 py-5">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                            style={{ background: statusCfg.bg, color: statusCfg.color }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: statusCfg.dot }}
                            />
                            {statusCfg.label}
                          </span>
                        </td>

                        {/* Product count */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold" style={{ color: '#e5e2e1' }}>
                              {catalog.productCount.toLocaleString()}
                            </span>
                            {catalog.productDelta && (
                              <span
                                className="text-[10px] px-1 rounded"
                                style={{ color: '#b0c6ff', background: 'rgba(176,198,255,0.1)' }}
                              >
                                +{catalog.productDelta}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Last sync */}
                        <td className="px-6 py-5 text-sm" style={{ color: '#c3c6d6' }}>
                          {catalog.lastSync}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-5 text-right">
                          <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleActionToggle(catalog.id)}
                              className="p-2 rounded-lg transition-colors"
                              style={{ color: '#8d90a0' }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#e5e2e1')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = '#8d90a0')}
                            >
                              <span className="material-symbols-outlined">more_vert</span>
                            </button>
                            {actionMenuId === catalog.id && (
                              <div
                                className="absolute right-0 mt-1 rounded-lg py-1 z-10 w-44"
                                style={{
                                  background: '#2a2a2a',
                                  border: '1px solid rgba(66,70,84,0.4)',
                                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                                  top: '100%',
                                }}
                              >
                                {[
                                  { icon: 'open_in_new', label: 'View Details' },
                                  { icon: 'edit', label: 'Edit Catalog' },
                                  { icon: 'content_copy', label: 'Duplicate' },
                                  { icon: 'file_download', label: 'Export CSV' },
                                  { icon: 'delete', label: 'Delete', danger: true },
                                ].map(({ icon, label, danger }) => (
                                  <button
                                    key={label}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors"
                                    style={{ color: danger ? '#ffb4ab' : '#c3c6d6', textAlign: 'left' }}
                                    onMouseEnter={(e) =>
                                      (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')
                                    }
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                  >
                                    <span className="material-symbols-outlined text-lg">{icon}</span>
                                    {label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{
                borderTop: '1px solid rgba(66,70,84,0.1)',
                background: 'rgba(42,42,42,0.3)',
              }}
            >
              <p className="text-xs font-medium" style={{ color: '#8d90a0' }}>
                Showing{' '}
                <span style={{ color: '#e5e2e1' }}>
                  {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)}
                </span>{' '}
                of <span style={{ color: '#e5e2e1' }}>{filtered.length}</span> catalogs
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30"
                  style={{ color: '#8d90a0' }}
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  const pg = i + 1;
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors"
                      style={
                        page === pg
                          ? { background: '#b0c6ff', color: '#002d6f' }
                          : { color: '#8d90a0' }
                      }
                    >
                      {pg}
                    </button>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <span className="px-1" style={{ color: '#8d90a0' }}>…</span>
                    <button
                      onClick={() => setPage(totalPages)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold"
                      style={{ color: '#8d90a0' }}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30"
                  style={{ color: '#8d90a0' }}
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

