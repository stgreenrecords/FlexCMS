'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem,
  BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage,
  Skeleton,
} from '@flexcms/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProductSyncStatus = 'synced' | 'draft' | 'out_of_stock' | 'error';

interface Product {
  id: string;
  sku: string;
  name: string;
  schema: string;
  price: number;
  stock: number;
  syncStatus: ProductSyncStatus;
  thumbnail?: string;
}

interface CatalogDetail {
  id: string;
  name: string;
  season: string;
  status: 'active' | 'draft' | 'archived';
  productCount: number;
  completionRate: number;
  stockValue: number;
  pendingSync: number;
  missingThumbnails: number;
  lastUpdated: string;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_CATALOG: CatalogDetail = {
  id: '1',
  name: 'Summer 2026 Catalog',
  season: 'Summer 2026',
  status: 'active',
  productCount: 1248,
  completionRate: 94.2,
  stockValue: 4200000,
  pendingSync: 142,
  missingThumbnails: 12,
  lastUpdated: '14m ago',
};

const MOCK_PRODUCTS: Product[] = [
  { id: '1', sku: 'ALP-2026-X9',  name: 'Alpine Performance Runner v4',   schema: 'Footwear',    price: 189.00, stock: 4280, syncStatus: 'synced' },
  { id: '2', sku: 'LUM-SM6-W',    name: 'Lumina Smart Watch Gen 6',        schema: 'Electronics', price: 349.00, stock: 1120, syncStatus: 'draft' },
  { id: '3', sku: 'DRK-NV-32L',   name: 'Drakon 32L Technical Pack',       schema: 'Gear',        price: 120.00, stock: 542,  syncStatus: 'synced' },
  { id: '4', sku: 'ZEN-FL-100',   name: 'Zenith Flow Incense Burner',       schema: 'Lifestyle',   price: 45.00,  stock: 0,    syncStatus: 'out_of_stock' },
  { id: '5', sku: 'TLC-H-M01',   name: 'Talc Heritage Chrono',             schema: 'Accessories', price: 1250.00,stock: 88,   syncStatus: 'synced' },
  { id: '6', sku: 'SOL-DRY-X4',  name: 'Solaris Dry-Fit Training Tee',     schema: 'Apparel',     price: 38.00,  stock: 2100, syncStatus: 'synced' },
  { id: '7', sku: 'KON-BLK-L11', name: 'Kono Blackout Sunglasses',         schema: 'Accessories', price: 195.00, stock: 340,  syncStatus: 'draft' },
  { id: '8', sku: 'NRD-CP-EVO',  name: 'Nordisk Capsule Backpack Evo',     schema: 'Gear',        price: 280.00, stock: 89,   syncStatus: 'synced' },
  { id: '9', sku: 'FLX-STR-007', name: 'Flex Studio Resistance Band Set',  schema: 'Fitness',     price: 55.00,  stock: 1850, syncStatus: 'synced' },
  { id: '10', sku: 'VRX-NL-PRO', name: 'Vortex Noise Loop Pro Headphones', schema: 'Electronics', price: 499.00, stock: 203,  syncStatus: 'error' },
];

const SYNC_STATUS_CONFIG: Record<ProductSyncStatus, { label: string; color: string; dot: string }> = {
  synced:       { label: 'Synced',       color: '#4ade80', dot: '#4ade80' },
  draft:        { label: 'Draft',        color: '#fbbf24', dot: '#fbbf24' },
  out_of_stock: { label: 'Out of Stock', color: '#ffb4ab', dot: '#ffb4ab' },
  error:        { label: 'Error',        color: '#f87171', dot: '#f87171' },
};

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function CatalogDetailSkeleton() {
  return (
    <div className="p-8">
      <Skeleton style={{ height: 16, width: 260, borderRadius: 4, marginBottom: 24 }} />
      <Skeleton style={{ height: 36, width: 300, borderRadius: 6, marginBottom: 8 }} />
      <Skeleton style={{ height: 16, width: 420, borderRadius: 4, marginBottom: 40 }} />
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} style={{ height: 100, borderRadius: 12 }} />
        ))}
      </div>
      <div style={{ background: '#1c1b1b', borderRadius: 12, overflow: 'hidden' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: '1px solid rgba(66,70,84,0.1)' }}>
            <Skeleton style={{ width: 16, height: 16, borderRadius: 3 }} />
            <Skeleton style={{ width: 90, height: 12, borderRadius: 4 }} />
            <div className="flex items-center gap-3 flex-1">
              <Skeleton style={{ width: 32, height: 32, borderRadius: 6 }} />
              <Skeleton style={{ width: 200, height: 14, borderRadius: 4 }} />
            </div>
            <Skeleton style={{ width: 70, height: 20, borderRadius: 4 }} />
            <Skeleton style={{ width: 60, height: 14, borderRadius: 4 }} />
            <Skeleton style={{ width: 50, height: 14, borderRadius: 4 }} />
            <Skeleton style={{ width: 60, height: 14, borderRadius: 4 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  progress?: number;
  badge?: string;
  badgeColor?: string;
}

function StatCard({ label, value, subtitle, progress, badge, badgeColor }: StatCardProps) {
  return (
    <div
      className="p-5 rounded-xl"
      style={{ background: '#1c1b1b', border: '1px solid rgba(66,70,84,0.05)' }}
    >
      <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(195,198,214,0.6)' }}>
        {label}
      </p>
      <div className="flex items-end justify-between">
        <h3 className="text-2xl font-black" style={{ color: '#e5e2e1' }}>{value}</h3>
        {badge && (
          <span className="text-xs font-bold flex items-center" style={{ color: badgeColor ?? '#4ade80' }}>
            {badge}
          </span>
        )}
      </div>
      {progress !== undefined && (
        <div
          className="w-full h-1.5 rounded-full mt-4 overflow-hidden"
          style={{ background: '#353534' }}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${progress}%`, background: '#b0c6ff' }}
          />
        </div>
      )}
      {subtitle && (
        <p className="text-[10px] mt-2 italic" style={{ color: '#8d90a0' }}>{subtitle}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function CatalogDetailPage() {
  const params = useParams();
  const catalogId = params?.id as string;

  const [isLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const pageSize = 25;

  // In a real app, fetch catalog by catalogId from the API
  const catalog = MOCK_CATALOG;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return MOCK_PRODUCTS.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    );
  }, [search]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const allSelected = paginated.length > 0 && paginated.every((p) => selectedIds.has(p.id));
  const someSelected = paginated.some((p) => selectedIds.has(p.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((p) => next.add(p.id));
        return next;
      });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalInventoryValue = MOCK_PRODUCTS.reduce((sum, p) => sum + p.price * p.stock, 0);

  if (isLoading) {
    return <div style={{ background: '#201f1f', minHeight: '100vh' }}><CatalogDetailSkeleton /></div>;
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: '#201f1f' }}
      onClick={() => setActionMenuId(null)}
    >
      <div className="px-8 pb-12 pt-6">
        {/* ── Breadcrumb ── */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" style={{ color: '#8d90a0' }}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/pim" style={{ color: '#8d90a0' }}>Catalogs</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage style={{ color: '#e5e2e1' }}>{catalog.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* ── Hero Header ── */}
        <header className="mb-8 mt-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black tracking-tight mb-2" style={{ color: '#e5e2e1' }}>
                {catalog.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: '#8d90a0' }}>
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: catalog.status === 'active' ? '#4ade80' : '#fbbf24' }}
                  />
                  <span style={{ textTransform: 'capitalize' }}>{catalog.status} Season</span>
                </span>
                <span style={{ color: 'rgba(66,70,84,0.8)' }}>•</span>
                <span>{catalog.productCount.toLocaleString()} Products</span>
                <span style={{ color: 'rgba(66,70,84,0.8)' }}>•</span>
                <span>Last updated {catalog.lastUpdated}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex rounded-lg p-1" style={{ background: '#2a2a2a' }}>
                {[
                  { icon: 'publish', label: 'Publish' },
                  { icon: 'archive', label: 'Archive' },
                  { icon: 'ios_share', label: 'Export' },
                ].map(({ icon, label }) => (
                  <button
                    key={label}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors"
                    style={{ color: '#e5e2e1' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#353534')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span className="material-symbols-outlined text-lg">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
              <button
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-md shadow-lg transition-transform active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #b0c6ff, #0058cc)',
                  color: '#002d6f',
                }}
              >
                <span className="material-symbols-outlined text-lg">forward</span>
                Carryforward
              </button>
            </div>
          </div>
        </header>

        {/* ── Stats Bento ── */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Completion Rate"
            value={`${catalog.completionRate}%`}
            badge="+2.1%"
            badgeColor="#4ade80"
            progress={catalog.completionRate}
          />
          <StatCard
            label="Stock Value"
            value={`$${(catalog.stockValue / 1_000_000).toFixed(1)}M`}
            subtitle="Based on MSRP pricing"
          />
          <StatCard
            label="Pending Sync"
            value={catalog.pendingSync.toString()}
            subtitle="Ready for ERP injection"
          />
          <div
            className="p-5 rounded-xl"
            style={{ background: '#1c1b1b', border: '1px solid rgba(66,70,84,0.05)' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(195,198,214,0.6)' }}>
              Media Health
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex -space-x-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(74,222,128,0.2)', border: '1px solid rgba(74,222,128,0.4)' }}
                >
                  <span className="material-symbols-outlined text-sm" style={{ color: '#4ade80' }}>check</span>
                </div>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.4)' }}
                >
                  <span className="material-symbols-outlined text-sm" style={{ color: '#fbbf24' }}>priority_high</span>
                </div>
              </div>
              <span className="text-xs" style={{ color: '#c3c6d6' }}>
                {catalog.missingThumbnails} Missing Thumbnails
              </span>
            </div>
          </div>
        </section>

        {/* ── Product Grid Table ── */}
        <section
          className="rounded-2xl overflow-hidden"
          style={{ background: '#1c1b1b', border: '1px solid rgba(66,70,84,0.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
        >
          {/* Toolbar */}
          <div
            className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ borderBottom: '1px solid rgba(66,70,84,0.05)', background: 'rgba(28,27,27,0.5)' }}
          >
            <div className="flex items-center gap-4 flex-1 w-full">
              {/* Search */}
              <div className="relative w-full" style={{ maxWidth: 400 }}>
                <span
                  className="material-symbols-outlined absolute"
                  style={{ left: 12, top: '50%', transform: 'translateY(-50%)', color: '#c3c6d6' }}
                >
                  search
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search by SKU or product name..."
                  className="w-full text-sm rounded-lg py-2"
                  style={{
                    background: '#2a2a2a',
                    border: 'none',
                    color: '#e5e2e1',
                    paddingLeft: 44,
                    paddingRight: 16,
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.currentTarget.style.outline = '1px solid rgba(176,198,255,0.3)')}
                  onBlur={(e) => (e.currentTarget.style.outline = 'none')}
                />
              </div>
              <button
                className="p-2 rounded-lg transition-colors"
                style={{ background: '#2a2a2a', color: '#8d90a0', border: '1px solid rgba(66,70,84,0.05)' }}
              >
                <span className="material-symbols-outlined">filter_list</span>
              </button>
            </div>

            {/* Pagination controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-medium" style={{ color: '#8d90a0', marginRight: 8 }}>
                Displaying {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
              </span>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-md transition-colors disabled:opacity-30"
                style={{ background: '#2a2a2a', color: '#c3c6d6' }}
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-md transition-colors disabled:opacity-30"
                style={{ background: '#2a2a2a', color: '#c3c6d6' }}
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <span className="material-symbols-outlined text-5xl mb-4" style={{ color: '#424654' }}>search_off</span>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#e5e2e1' }}>No products found</h3>
              <p className="text-sm" style={{ color: '#8d90a0' }}>Try adjusting your search terms.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr style={{ background: 'rgba(14,14,14,0.3)' }}>
                      {/* Select all */}
                      <th className="px-6 py-4 w-12">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                          onChange={toggleSelectAll}
                          className="rounded"
                          style={{ accentColor: '#b0c6ff' }}
                        />
                      </th>
                      {[
                        { label: 'SKU', align: 'left' },
                        { label: 'Product Name', align: 'left' },
                        { label: 'Schema', align: 'left' },
                        { label: 'Price', align: 'right' },
                        { label: 'Stock', align: 'right' },
                        { label: 'Status', align: 'left' },
                        { label: '', align: 'right' },
                      ].map(({ label, align }) => (
                        <th
                          key={label || 'actions'}
                          className="px-6 py-4 text-[11px] font-black uppercase tracking-widest cursor-pointer transition-colors group"
                          style={{ color: 'rgba(195,198,214,0.8)', textAlign: align as 'left' | 'right' }}
                        >
                          {label && (
                            <div
                              className="flex items-center gap-2"
                              style={{ justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}
                            >
                              {label}
                              <span
                                className="material-symbols-outlined text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                expand_more
                              </span>
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((product) => {
                      const sync = SYNC_STATUS_CONFIG[product.syncStatus];
                      const isSelected = selectedIds.has(product.id);
                      return (
                        <tr
                          key={product.id}
                          className="group transition-colors"
                          style={{
                            borderTop: '1px solid rgba(66,70,84,0.05)',
                            background: isSelected ? 'rgba(176,198,255,0.06)' : 'transparent',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'rgba(42,42,42,0.5)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = isSelected ? 'rgba(176,198,255,0.06)' : 'transparent';
                          }}
                        >
                          <td className="px-6 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(product.id)}
                              className="rounded"
                              style={{ accentColor: '#b0c6ff' }}
                            />
                          </td>
                          {/* SKU */}
                          <td className="px-6 py-3 text-xs font-mono" style={{ color: 'rgba(176,198,255,0.8)' }}>
                            {product.sku}
                          </td>
                          {/* Product Name */}
                          <td className="px-6 py-3">
                            <Link href={`/pim/${catalogId}/${product.id}`} className="flex items-center gap-3 group">
                              <div
                                className="w-8 h-8 rounded overflow-hidden flex-shrink-0"
                                style={{ background: '#353534' }}
                              >
                                {product.thumbnail ? (
                                  <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-sm" style={{ color: '#8d90a0' }}>
                                      image
                                    </span>
                                  </div>
                                )}
                              </div>
                              <span className="text-sm font-semibold group-hover:underline" style={{ color: '#e5e2e1' }}>
                                {product.name}
                              </span>
                            </Link>
                          </td>
                          {/* Schema */}
                          <td className="px-6 py-3">
                            <span
                              className="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-tighter"
                              style={{ background: 'rgba(50,69,117,0.6)', color: '#a1b4eb' }}
                            >
                              {product.schema}
                            </span>
                          </td>
                          {/* Price */}
                          <td className="px-6 py-3 text-sm font-bold text-right" style={{ color: '#e5e2e1' }}>
                            ${product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          {/* Stock */}
                          <td className="px-6 py-3 text-sm text-right" style={{ color: '#c3c6d6' }}>
                            {product.stock.toLocaleString()}
                          </td>
                          {/* Sync Status */}
                          <td className="px-6 py-3">
                            <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: sync.color }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: sync.dot }} />
                              {sync.label}
                            </span>
                          </td>
                          {/* Actions */}
                          <td className="px-6 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="relative inline-block">
                              <button
                                onClick={() => setActionMenuId((prev) => (prev === product.id ? null : product.id))}
                                className="p-1 transition-all"
                                style={{ color: '#8d90a0', opacity: 0 }}
                                ref={(el) => { if (el) el.style.opacity = ''; }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#b0c6ff')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = '#8d90a0')}
                              >
                                <span className="material-symbols-outlined">more_vert</span>
                              </button>
                              {actionMenuId === product.id && (
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
                                    { icon: 'edit', label: 'Edit Product' },
                                    { icon: 'content_copy', label: 'Duplicate' },
                                    { icon: 'sync', label: 'Force Sync' },
                                    { icon: 'history', label: 'View History' },
                                    { icon: 'delete', label: 'Remove from Catalog', danger: true },
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

              {/* Table Footer */}
              <div
                className="p-4 flex items-center justify-between text-xs font-medium"
                style={{
                  borderTop: '1px solid rgba(66,70,84,0.05)',
                  background: '#1c1b1b',
                  color: 'rgba(195,198,214,0.6)',
                }}
              >
                <div className="flex gap-4">
                  <span>Show {pageSize} items per page</span>
                  <span style={{ color: 'rgba(66,70,84,0.4)' }}>|</span>
                  <span>
                    Total Inventory:{' '}
                    <span style={{ color: '#c3c6d6' }}>
                      ${totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </span>
                </div>
                <div className="flex gap-1">
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const pg = i + 1;
                    return (
                      <button
                        key={pg}
                        onClick={() => setPage(pg)}
                        className="px-2 py-1 rounded transition-colors"
                        style={
                          page === pg
                            ? { background: '#353534', color: '#e5e2e1' }
                            : { color: '#8d90a0' }
                        }
                        onMouseEnter={(e) => { if (page !== pg) e.currentTarget.style.background = '#353534'; }}
                        onMouseLeave={(e) => { if (page !== pg) e.currentTarget.style.background = 'transparent'; }}
                      >
                        {pg}
                      </button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="px-2 py-1" style={{ color: '#8d90a0' }}>…</span>
                      <button className="px-2 py-1 rounded" style={{ color: '#8d90a0' }}>{totalPages}</button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </section>

        {/* ── Quick Action Cards ── */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: 'auto_awesome',
              title: 'AI Data Enrichment',
              desc: `Automatically generate SEO descriptions and meta tags for the ${catalog.season} collection.`,
              cta: 'Run Enrichment',
            },
            {
              icon: 'sync_alt',
              title: 'Channel Distribution',
              desc: `Sync these ${catalog.productCount.toLocaleString()} items across Shopify, Amazon, and Walmart storefronts.`,
              cta: 'Configure Sync',
            },
            {
              icon: 'history_edu',
              title: 'Change Journal',
              desc: "View the complete audit log of changes made to this catalog's schema and entries.",
              cta: 'View History',
            },
          ].map(({ icon, title, desc, cta }) => (
            <div
              key={title}
              className="p-6 rounded-2xl flex flex-col justify-between group transition-all cursor-pointer"
              style={{
                background: '#1c1b1b',
                border: '1px solid rgba(66,70,84,0.05)',
                height: 192,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.border = '1px solid rgba(176,198,255,0.2)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.border = '1px solid rgba(66,70,84,0.05)')
              }
            >
              <div>
                <div
                  className="inline-flex p-3 rounded-xl mb-4"
                  style={{ background: 'rgba(176,198,255,0.1)' }}
                >
                  <span className="material-symbols-outlined" style={{ color: '#b0c6ff' }}>{icon}</span>
                </div>
                <h4 className="font-bold mb-2" style={{ color: '#e5e2e1' }}>{title}</h4>
                <p className="text-xs" style={{ color: '#8d90a0' }}>{desc}</p>
              </div>
              <button
                className="flex items-center gap-1 text-xs font-bold transition-transform group-hover:translate-x-1"
                style={{ color: '#b0c6ff' }}
              >
                {cta}
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

