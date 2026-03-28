'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem,
  BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage,
  Skeleton,
} from '@flexcms/ui';

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

import { getApiBase } from '@/lib/apiBase';
const API_BASE = getApiBase();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VariantStatus = 'live' | 'oos' | 'draft';

interface ProductVariant {
  id: string;
  skuSuffix: string;
  region: string;
  stock: number;
  status: VariantStatus;
}

interface LinkedAsset {
  id: string;
  url?: string;
  label?: string;
  isHero: boolean;
}

interface DataHealthItem {
  ok: boolean;
  label: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------


const VARIANT_STATUS_CONFIG: Record<VariantStatus, { label: string; color: string; dot: string }> = {
  live:  { label: 'Live',  color: '#b0c6ff', dot: '#b0c6ff' },
  oos:   { label: 'OOS',   color: '#ffb4ab', dot: '#ffb4ab' },
  draft: { label: 'Draft', color: '#8d90a0', dot: '#8d90a0' },
};

const QUICK_NAV = [
  { href: '#general',    icon: 'info',       label: 'General Info',    badge: 'AUTO-FILLED' },
  { href: '#specs',      icon: 'memory',     label: 'Technical Specs', badge: null          },
  { href: '#variants',   icon: 'alt_route',  label: 'Variants',        badge: null          },
  { href: '#assets',     icon: 'image',      label: 'Asset Linker',    badge: null          },
  { href: '#locale',     icon: 'language',   label: 'Localization',    badge: null          },
];

// ---------------------------------------------------------------------------
// Accordion section wrapper
// ---------------------------------------------------------------------------

interface SectionProps {
  id: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Section({ id, icon, iconBg, iconColor, title, subtitle, defaultOpen = true, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section id={id} className="rounded-xl overflow-hidden" style={{ background: '#1c1b1b' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-6 text-left group"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: iconBg }}>
            <span className="material-symbols-outlined" style={{ color: iconColor }}>{icon}</span>
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: '#e5e2e1' }}>{title}</h2>
            <p className="text-xs" style={{ color: '#8d90a0' }}>{subtitle}</p>
          </div>
        </div>
        <span
          className="material-symbols-outlined transition-transform"
          style={{ color: '#8d90a0', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          expand_more
        </span>
      </button>
      {open && <div className="px-6 pb-8">{children}</div>}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Field components
// ---------------------------------------------------------------------------

interface FieldProps {
  label: string;
  inherited?: boolean;
  children: React.ReactNode;
  colSpan?: number;
}

function Field({ label, inherited, children, colSpan = 1 }: FieldProps) {
  return (
    <div style={{ gridColumn: `span ${colSpan}` }}>
      <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#8d90a0' }}>
        {label}
      </label>
      <div className="relative group">
        {children}
        {inherited && (
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: 'rgba(50,69,117,0.3)', color: '#b3c5fd' }}
          >
            <span className="material-symbols-outlined text-xs">cloud_done</span>
            INHERITED
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  background: '#353534',
  border: 'none',
  borderBottom: '2px solid transparent',
  color: '#e5e2e1',
  borderRadius: '6px 6px 0 0',
  padding: '12px 16px',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.2s',
} as const;

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function ProductEditorSkeleton() {
  return (
    <div className="p-8 grid grid-cols-12 gap-8">
      <div className="col-span-8 space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl p-6 space-y-4" style={{ background: '#1c1b1b' }}>
            <Skeleton style={{ height: 40, width: '60%', borderRadius: 8 }} />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton style={{ height: 48, borderRadius: 8 }} />
              <Skeleton style={{ height: 48, borderRadius: 8 }} />
            </div>
          </div>
        ))}
      </div>
      <div className="col-span-4 space-y-6">
        <Skeleton style={{ height: 200, borderRadius: 12 }} />
        <Skeleton style={{ height: 280, borderRadius: 12 }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ProductEditorPage() {
  const params = useParams();
  const productId = params?.productId as string;
  const catalogId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeSection, setActiveSection] = useState('general');

  // Form state
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [sku, setSku] = useState('');
  const [specPanel, setSpecPanel] = useState('');
  const [msrp, setMsrp] = useState('');
  const [productStatus, setProductStatus] = useState('DRAFT');
  const [description, setDescription] = useState('');
  const [modifiedAt, setModifiedAt] = useState('');
  const [modifiedBy, setModifiedBy] = useState('');
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [assets] = useState<LinkedAsset[]>([]);
  const [activeQuickNav, setActiveQuickNav] = useState('general');

  // Fetch product from API
  useEffect(() => {
    if (!productId) { setIsLoading(false); return; }
    setIsLoading(true);
    fetch(`${API_BASE}/api/pim/v1/products/${productId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: Record<string, unknown>) => {
        setProductName((data.name as string) ?? '');
        setSku((data.sku as string) ?? productId);
        setProductStatus((data.status as string) ?? 'DRAFT');
        setModifiedAt((data.updatedAt as string) ?? '');
        setModifiedBy((data.updatedBy as string) ?? '');
        const attrs = (data.attributes as Record<string, unknown>) ?? {};
        setBrand((attrs.brand as string) ?? '');
        setCategory((attrs.category as string) ?? '');
        setSpecPanel((attrs.panel as string) ?? '');
        setMsrp(attrs.price != null ? String(attrs.price) : '');
        setDescription((attrs.description as string) ?? '');
      })
      .catch(() => {
        // API unavailable — leave fields empty
      });

    fetch(`${API_BASE}/api/pim/v1/products/${productId}/variants`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: Record<string, unknown>[]) => {
        const mapped: ProductVariant[] = data.map((v) => {
          const inv = (v.inventory as Record<string, unknown>) ?? {};
          const variantAttrs = (v.attributes as Record<string, unknown>) ?? {};
          const apiStatus = (v.status as string ?? '').toUpperCase();
          let status: VariantStatus = 'draft';
          if (apiStatus === 'ACTIVE') status = 'live';
          else if (apiStatus === 'OUT_OF_STOCK' || apiStatus === 'INACTIVE') status = 'oos';
          return {
            id: String(v.id ?? ''),
            skuSuffix: (v.variantSku as string) ?? '',
            region: (variantAttrs.region as string) ?? '',
            stock: Number(inv.stock ?? inv.quantity ?? 0),
            status,
          };
        });
        setVariants(mapped);
      })
      .catch(() => {
        // variants unavailable — leave empty
      })
      .finally(() => setIsLoading(false));
  }, [productId]);

  const markDirty = () => setIsDirty(true);

  const handleSaveDraft = () => {
    setIsSaving(true);
    fetch(`${API_BASE}/api/pim/v1/products/${sku}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attributes: { brand, category, panel: specPanel, price: msrp ? Number(msrp) : undefined, description },
        userId: 'admin',
      }),
    })
      .then((r) => { if (r.ok) setIsDirty(false); })
      .catch(() => {})
      .finally(() => setIsSaving(false));
  };

  const handlePublish = () => {
    setIsPublishing(true);
    fetch(`${API_BASE}/api/pim/v1/products/${sku}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PUBLISHED', userId: 'admin' }),
    })
      .then((r) => { if (r.ok) { setProductStatus('PUBLISHED'); setIsDirty(false); } })
      .catch(() => {})
      .finally(() => setIsPublishing(false));
  };

  const dataHealth: DataHealthItem[] = [
    { ok: !!productName, label: productName ? 'Product name set' : 'Product name missing' },
    { ok: assets.length > 0, label: assets.length > 0 ? `Assets linked (${assets.length})` : 'No assets linked' },
    { ok: !!sku, label: sku ? 'SKU identifier set' : 'Missing SKU identifier' },
  ];
  const dataHealthScore = dataHealth.length > 0
    ? Math.round((dataHealth.filter((d) => d.ok).length / dataHealth.length) * 100)
    : 0;

  if (isLoading) {
    return <div style={{ background: '#201f1f', minHeight: '100vh' }}><ProductEditorSkeleton /></div>;
  }

  return (
    <div className="min-h-screen" style={{ background: '#201f1f' }}>
      {/* ── Sticky header bar ── */}
      <div
        className="sticky top-16 z-30 px-8 py-4 flex flex-col md:flex-row md:items-end justify-between gap-4"
        style={{ background: 'rgba(32,31,31,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(66,70,84,0.2)' }}
      >
        <div>
          {/* Breadcrumb */}
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
                <BreadcrumbLink href={catalogId ? `/pim/${catalogId}` : '/pim'} style={{ color: '#8d90a0' }}>
                  Electronics
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage style={{ color: '#b0c6ff' }}>X-Series OLED</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-3xl font-extrabold tracking-tight mt-2" style={{ color: '#e5e2e1' }}>
            SKU: {sku}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#8d90a0' }}>
            {modifiedAt
              ? <>Last modified: <span style={{ color: '#e5e2e1' }}>{new Date(modifiedAt).toLocaleDateString()}</span>{modifiedBy ? <> by <span style={{ color: '#e5e2e1' }}>{modifiedBy}</span></> : null}</>
              : 'Last modified: —'
            }
            {isDirty && <span className="ml-2 text-xs font-bold" style={{ color: '#ffb59b' }}>• Unsaved changes</span>}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95"
            style={{ background: '#353534', color: '#e5e2e1' }}
          >
            <span className="material-symbols-outlined text-lg">history</span>
            Version History
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95 disabled:opacity-60"
            style={{ background: '#353534', color: '#e5e2e1' }}
          >
            {isSaving ? 'Saving…' : 'Save Draft'}
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-95 shadow-lg disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #b0c6ff, #0058cc)', color: '#002d6f', boxShadow: '0 8px 20px rgba(176,198,255,0.2)' }}
          >
            <span className="material-symbols-outlined text-lg">publish</span>
            {isPublishing ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </div>

      {/* ── Main 12-col grid ── */}
      <div className="px-8 py-8 grid grid-cols-12 gap-8">

        {/* ── Left: form sections (8 cols) ── */}
        <div className="col-span-12 lg:col-span-8 space-y-6">

          {/* General Info */}
          <Section
            id="general"
            icon="info"
            iconBg="rgba(176,198,255,0.1)"
            iconColor="#b0c6ff"
            title="General Info"
            subtitle="Basic product identification and identity"
            defaultOpen
          >
            <div className="grid grid-cols-2 gap-6">
              <Field label="Product Name" inherited colSpan={2}>
                <input
                  style={{ ...inputStyle, paddingRight: 120 }}
                  value={productName}
                  onChange={(e) => { setProductName(e.target.value); markDirty(); }}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = '#b0c6ff')}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = 'transparent')}
                />
              </Field>

              <Field label="Brand">
                <input
                  style={inputStyle}
                  value={brand}
                  onChange={(e) => { setBrand(e.target.value); markDirty(); }}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = '#b0c6ff')}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = 'transparent')}
                />
              </Field>

              <Field label="Primary Category">
                <div
                  className="flex items-center gap-2 rounded-t-lg"
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <span className="material-symbols-outlined text-sm" style={{ color: '#8d90a0' }}>folder</span>
                  <span className="text-sm" style={{ color: '#e5e2e1' }}>{category}</span>
                </div>
              </Field>

              <Field label="MSRP (USD)">
                <input
                  type="number"
                  value={msrp}
                  style={inputStyle}
                  onChange={(e) => { setMsrp(e.target.value); markDirty(); }}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = '#b0c6ff')}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = 'transparent')}
                />
              </Field>

              <Field label="Status">
                <select
                  style={inputStyle}
                  value={productStatus}
                  onChange={(e) => { setProductStatus(e.target.value); markDirty(); }}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </Field>

              <Field label="Long Description" colSpan={2}>
                <textarea
                  rows={4}
                  value={description}
                  style={{ ...inputStyle, borderRadius: 6, resize: 'vertical' }}
                  onChange={(e) => { setDescription(e.target.value); markDirty(); }}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = '#b0c6ff')}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = 'transparent')}
                />
              </Field>
            </div>
          </Section>

          {/* Technical Specs */}
          <Section
            id="specs"
            icon="memory"
            iconBg="rgba(169,56,2,0.15)"
            iconColor="#ffb59b"
            title="Technical Specs"
            subtitle="Performance metrics and hardware details"
            defaultOpen
          >
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Resolution', value: '3840 x 2160 (4K)', editable: false },
                { label: 'Refresh Rate', value: '120Hz Native',     editable: false },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="p-4 rounded-lg flex flex-col gap-2"
                  style={{ background: '#353534' }}
                >
                  <span className="text-[10px] font-black uppercase" style={{ color: '#8d90a0' }}>{label}</span>
                  <span className="font-semibold text-sm" style={{ color: '#e5e2e1' }}>{value}</span>
                </div>
              ))}
              <div
                className="p-4 rounded-lg flex flex-col gap-2"
                style={{ background: '#353534', borderLeft: '2px solid rgba(176,198,255,0.4)' }}
              >
                <span className="text-[10px] font-black uppercase" style={{ color: '#b0c6ff' }}>Panel Type</span>
                <input
                  value={specPanel}
                  onChange={(e) => { setSpecPanel(e.target.value); markDirty(); }}
                  className="font-semibold text-sm"
                  style={{ background: 'transparent', border: 'none', color: '#e5e2e1', outline: 'none', padding: 0 }}
                />
              </div>
              {[
                { label: 'HDR Support', value: 'Dolby Vision IQ, HDR10+' },
                { label: 'Connectivity', value: 'HDMI 2.1 × 4, USB × 3'  },
                { label: 'Weight',       value: '18.5 kg (without stand)' },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="p-4 rounded-lg flex flex-col gap-2"
                  style={{ background: '#353534' }}
                >
                  <span className="text-[10px] font-black uppercase" style={{ color: '#8d90a0' }}>{label}</span>
                  <input
                    defaultValue={value}
                    onChange={markDirty}
                    className="font-semibold text-sm"
                    style={{ background: 'transparent', border: 'none', color: '#e5e2e1', outline: 'none', padding: 0 }}
                  />
                </div>
              ))}
            </div>
          </Section>

          {/* Asset Linker */}
          <Section
            id="assets"
            icon="perm_media"
            iconBg="rgba(50,69,117,0.3)"
            iconColor="#b3c5fd"
            title="Asset Linker"
            subtitle="Manage linked media from central DAM"
            defaultOpen
          >
            <div className="grid grid-cols-4 gap-4">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="aspect-square rounded-lg relative group overflow-hidden"
                  style={{ background: '#353534' }}
                >
                  {/* Placeholder thumbnail */}
                  <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2a2a2a, #353534)' }}>
                    <span className="material-symbols-outlined text-4xl" style={{ color: '#424654' }}>image</span>
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.6)' }}>
                    <button className="p-2 rounded-full" style={{ background: '#393939', color: '#e5e2e1' }}>
                      <span className="material-symbols-outlined text-sm">visibility</span>
                    </button>
                    <button className="p-2 rounded-full" style={{ background: '#93000a', color: '#ffdad6' }}>
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                  {asset.isHero && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-black" style={{ background: '#b0c6ff', color: '#002d6f' }}>
                      HERO
                    </div>
                  )}
                </div>
              ))}
              {/* Add media button */}
              <button
                className="aspect-square rounded-lg flex flex-col items-center justify-center gap-2 group transition-all"
                style={{ border: '2px dashed rgba(141,144,160,0.25)' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(176,198,255,0.5)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(141,144,160,0.25)')}
              >
                <span className="material-symbols-outlined group-hover:text-primary transition-colors" style={{ color: '#8d90a0' }}>upload_file</span>
                <span className="text-[10px] font-bold uppercase group-hover:text-primary transition-colors" style={{ color: '#8d90a0' }}>Add Media</span>
              </button>
            </div>
            <div className="mt-4">
              <button
                className="flex items-center gap-2 text-sm font-bold"
                style={{ color: '#b0c6ff' }}
              >
                <span className="material-symbols-outlined text-sm">add_circle</span>
                Open DAM Picker
              </button>
            </div>
          </Section>

          {/* Product Variants */}
          <section id="variants" className="rounded-xl overflow-hidden" style={{ background: '#1c1b1b' }}>
            <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(66,70,84,0.1)' }}>
              <h2 className="text-lg font-bold" style={{ color: '#e5e2e1' }}>Product Variants</h2>
              <div className="flex items-center gap-3">
                <span
                  className="px-2.5 py-1 rounded text-[10px] font-black"
                  style={{ background: '#353534', color: '#8d90a0' }}
                >
                  {variants.filter((v) => v.status === 'live').length} ACTIVE VARIANTS
                </span>
                <button
                  className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                  style={{ color: '#b0c6ff', border: '1px solid rgba(176,198,255,0.3)', background: 'rgba(176,198,255,0.05)' }}
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Add Variant
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead style={{ background: 'rgba(53,53,52,0.5)' }}>
                  <tr>
                    {['SKU Suffix', 'Region', 'Stock', 'Status', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-4 text-[11px] font-black uppercase tracking-widest"
                        style={{ color: '#8d90a0' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) => {
                    const cfg = VARIANT_STATUS_CONFIG[v.status];
                    return (
                      <tr
                        key={v.id}
                        className="transition-colors"
                        style={{ borderTop: '1px solid rgba(66,70,84,0.05)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(53,53,52,0.3)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td className="px-6 py-4 text-sm font-medium" style={{ color: '#e5e2e1' }}>{v.skuSuffix}</td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#8d90a0' }}>{v.region}</td>
                        <td className="px-6 py-4 text-sm font-semibold" style={{ color: v.stock === 0 ? '#ffb4ab' : '#e5e2e1' }}>
                          {v.stock.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: cfg.dot, boxShadow: v.status === 'live' ? `0 0 6px ${cfg.dot}` : 'none' }} />
                            <span className="text-xs font-bold uppercase" style={{ color: '#e5e2e1' }}>{cfg.label}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            className="transition-colors"
                            style={{ color: '#8d90a0' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#b0c6ff')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#8d90a0')}
                          >
                            <span className="material-symbols-outlined">edit_square</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Localization */}
          <Section
            id="locale"
            icon="language"
            iconBg="rgba(74,222,128,0.1)"
            iconColor="#4ade80"
            title="Localization"
            subtitle="Locale-specific overrides and translations"
            defaultOpen={false}
          >
            <div className="grid grid-cols-2 gap-4">
              {[
                { locale: 'de-DE', label: 'German (DE)', value: 'Quantum X-Serie Ultra OLED 55' },
                { locale: 'fr-FR', label: 'French (FR)',  value: 'Quantum Série X Ultra OLED 55' },
                { locale: 'es-ES', label: 'Spanish (ES)', value: 'Quantum Serie X Ultra OLED 55' },
                { locale: 'ja-JP', label: 'Japanese (JP)', value: 'クアンタム Xシリーズ ウルトラ OLED 55' },
              ].map(({ locale, label, value }) => (
                <div key={locale}>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#8d90a0' }}>{label}</label>
                  <input
                    defaultValue={value}
                    onChange={markDirty}
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = '#b0c6ff')}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = 'transparent')}
                  />
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* ── Right sidebar (4 cols) ── */}
        <aside className="col-span-12 lg:col-span-4 space-y-6">

          {/* Data Health card */}
          <div className="p-6 rounded-xl relative overflow-hidden" style={{ background: '#1c1b1b' }}>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#8d90a0' }}>Data Health</h3>
                <span className="font-black text-2xl" style={{ color: '#b0c6ff' }}>{dataHealthScore}%</span>
              </div>
              <div className="w-full h-2 rounded-full mb-6 overflow-hidden" style={{ background: '#353534' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${dataHealthScore}%`, background: '#b0c6ff' }} />
              </div>
              <ul className="space-y-3">
                {dataHealth.map((item) => (
                  <li key={item.label} className="flex items-center gap-3 text-xs" style={{ color: '#c3c6d6' }}>
                    <span
                      className="material-symbols-outlined text-base flex-shrink-0"
                      style={{ color: item.ok ? '#b0c6ff' : '#ffb4ab', fontVariationSettings: item.ok ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {item.ok ? 'check_circle' : 'warning'}
                    </span>
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
            {/* Decorative icon */}
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <span className="material-symbols-outlined" style={{ fontSize: 120, color: '#8d90a0' }}>health_and_safety</span>
            </div>
          </div>

          {/* Quick navigation rail */}
          <div className="rounded-xl overflow-hidden" style={{ background: '#1c1b1b' }}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(66,70,84,0.1)' }}>
              <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: '#8d90a0' }}>Quick Navigation</h3>
            </div>
            <nav className="py-2">
              {QUICK_NAV.map(({ href, icon, label, badge }) => {
                const sectionId = href.replace('#', '');
                const isActive = activeQuickNav === sectionId;
                return (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setActiveQuickNav(sectionId)}
                    className="flex items-center justify-between px-6 py-3 transition-all group"
                    style={
                      isActive
                        ? { borderLeft: '4px solid #b0c6ff', background: 'rgba(176,198,255,0.05)', paddingLeft: 20 }
                        : { borderLeft: '4px solid transparent', paddingLeft: 20 }
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="material-symbols-outlined text-xl transition-colors"
                        style={{ color: isActive ? '#b0c6ff' : '#8d90a0' }}
                      >
                        {icon}
                      </span>
                      <span
                        className="text-sm font-medium transition-colors"
                        style={{ color: isActive ? '#e5e2e1' : '#c3c6d6' }}
                      >
                        {label}
                      </span>
                    </div>
                    {badge && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                        style={{ background: 'rgba(176,198,255,0.1)', color: '#b0c6ff' }}
                      >
                        {badge}
                      </span>
                    )}
                  </a>
                );
              })}
            </nav>
          </div>

          {/* Live preview / storefront context */}
          <div className="p-4 rounded-xl" style={{ background: '#1c1b1b' }}>
            <div
              className="aspect-video rounded-lg mb-4 overflow-hidden relative group flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2a2a2a, #1c1b1b)' }}
            >
              <span className="material-symbols-outlined text-5xl" style={{ color: '#424654' }}>tv</span>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(176,198,255,0.1)' }}>
                <button
                  className="px-4 py-2 rounded-full text-xs font-bold shadow-lg"
                  style={{ background: '#131313', color: '#b0c6ff' }}
                >
                  Preview Live Store
                </button>
              </div>
            </div>
            <h4 className="text-sm font-bold mb-1" style={{ color: '#e5e2e1' }}>Digital Storefront Sync</h4>
            <p className="text-xs leading-relaxed" style={{ color: '#8d90a0' }}>
              This product is currently mapped to the{' '}
              <span style={{ color: '#b0c6ff' }}>&apos;Premium Home&apos;</span> storefront channel.
            </p>
            <div className="mt-3 flex gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: '#4ade80' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#4ade80' }} />
                Shopify
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: '#4ade80' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#4ade80' }} />
                Amazon
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: '#fbbf24' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#fbbf24' }} />
                Walmart
              </span>
            </div>
          </div>

          {/* Danger zone */}
          <div className="p-5 rounded-xl" style={{ background: '#1c1b1b', border: '1px solid rgba(255,180,171,0.1)' }}>
            <h4 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#8d90a0' }}>Danger Zone</h4>
            <div className="space-y-2">
              <button
                className="w-full flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg transition-all"
                style={{ color: '#ffb59b', background: 'rgba(255,181,155,0.05)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,181,155,0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,181,155,0.05)')}
              >
                <span className="material-symbols-outlined text-sm">archive</span>
                Archive Product
              </button>
              <button
                className="w-full flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg transition-all"
                style={{ color: '#ffb4ab', background: 'rgba(255,180,171,0.05)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,180,171,0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,180,171,0.05)')}
              >
                <span className="material-symbols-outlined text-sm">delete_forever</span>
                Delete Product
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

