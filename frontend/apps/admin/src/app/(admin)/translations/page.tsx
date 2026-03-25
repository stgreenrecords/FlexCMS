'use client';

import React, { useState, useCallback } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Skeleton,
} from '@flexcms/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TranslationStatus = 'translated' | 'outdated' | 'missing';

interface LocaleTranslation {
  status: TranslationStatus;
  value: string;
}

interface TranslationKey {
  id: string;
  key: string;
  section: string;
  sourceText: string;
  fr: LocaleTranslation;
  de: LocaleTranslation;
  es: LocaleTranslation;
}

type StatusFilter = 'all' | 'translated' | 'outdated' | 'missing';
type SectionFilter = 'all' | 'home' | 'dashboard' | 'global' | 'settings' | 'auth';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_KEYS: TranslationKey[] = [
  {
    id: 'k1',
    key: 'common.buttons.save',
    section: 'Global Components',
    sourceText: 'Save Changes',
    fr: { status: 'translated', value: 'Sauvegarder les modifications' },
    de: { status: 'translated', value: 'Änderungen speichern' },
    es: { status: 'translated', value: 'Guardar cambios' },
  },
  {
    id: 'k2',
    key: 'dashboard.welcome_msg',
    section: 'Dashboard Home',
    sourceText: 'Welcome back, {user}!',
    fr: { status: 'outdated', value: 'Bon retour, {user} !' },
    de: { status: 'translated', value: 'Willkommen zurück, {user}!' },
    es: { status: 'missing', value: '' },
  },
  {
    id: 'k3',
    key: 'settings.privacy.disclaimer',
    section: 'Settings',
    sourceText: 'Your data privacy is our priority. We never sell your personal information.',
    fr: { status: 'translated', value: 'La confidentialité de vos données est notre priorité. Nous ne vendons jamais vos informations.' },
    de: { status: 'translated', value: 'Datenschutz ist unsere Priorität. Wir verkaufen niemals Ihre Informationen.' },
    es: { status: 'missing', value: '' },
  },
  {
    id: 'k4',
    key: 'auth.forgot_password',
    section: 'Authentication',
    sourceText: 'Forgot password?',
    fr: { status: 'translated', value: 'Mot de passe oublié ?' },
    de: { status: 'translated', value: 'Passwort vergessen?' },
    es: { status: 'translated', value: '¿Has olvidado tu contraseña?' },
  },
  {
    id: 'k5',
    key: 'nav.products.catalog',
    section: 'Navigation',
    sourceText: 'Product Catalog',
    fr: { status: 'translated', value: 'Catalogue produits' },
    de: { status: 'outdated', value: 'Produktkatalog' },
    es: { status: 'translated', value: 'Catálogo de productos' },
  },
  {
    id: 'k6',
    key: 'dam.upload.drag_hint',
    section: 'Media Library',
    sourceText: 'Drag and drop files here, or click to browse',
    fr: { status: 'translated', value: 'Faites glisser les fichiers ici ou cliquez pour parcourir' },
    de: { status: 'translated', value: 'Dateien hier ablegen oder zum Durchsuchen klicken' },
    es: { status: 'missing', value: '' },
  },
  {
    id: 'k7',
    key: 'pim.product.status.draft',
    section: 'PIM',
    sourceText: 'Draft',
    fr: { status: 'translated', value: 'Brouillon' },
    de: { status: 'translated', value: 'Entwurf' },
    es: { status: 'translated', value: 'Borrador' },
  },
  {
    id: 'k8',
    key: 'pim.product.status.published',
    section: 'PIM',
    sourceText: 'Published',
    fr: { status: 'translated', value: 'Publié' },
    de: { status: 'translated', value: 'Veröffentlicht' },
    es: { status: 'translated', value: 'Publicado' },
  },
  {
    id: 'k9',
    key: 'workflow.action.approve',
    section: 'Workflows',
    sourceText: 'Approve',
    fr: { status: 'translated', value: 'Approuver' },
    de: { status: 'translated', value: 'Genehmigen' },
    es: { status: 'outdated', value: 'Aprobar' },
  },
  {
    id: 'k10',
    key: 'workflow.action.reject',
    section: 'Workflows',
    sourceText: 'Reject',
    fr: { status: 'translated', value: 'Rejeter' },
    de: { status: 'translated', value: 'Ablehnen' },
    es: { status: 'translated', value: 'Rechazar' },
  },
  {
    id: 'k11',
    key: 'common.labels.loading',
    section: 'Global Components',
    sourceText: 'Loading...',
    fr: { status: 'translated', value: 'Chargement...' },
    de: { status: 'translated', value: 'Laden...' },
    es: { status: 'translated', value: 'Cargando...' },
  },
  {
    id: 'k12',
    key: 'common.labels.error',
    section: 'Global Components',
    sourceText: 'An error occurred. Please try again.',
    fr: { status: 'translated', value: 'Une erreur s\'est produite. Veuillez réessayer.' },
    de: { status: 'missing', value: '' },
    es: { status: 'missing', value: '' },
  },
  {
    id: 'k13',
    key: 'auth.login.title',
    section: 'Authentication',
    sourceText: 'Sign in to your account',
    fr: { status: 'translated', value: 'Connectez-vous à votre compte' },
    de: { status: 'translated', value: 'Melden Sie sich bei Ihrem Konto an' },
    es: { status: 'translated', value: 'Inicia sesión en tu cuenta' },
  },
  {
    id: 'k14',
    key: 'settings.account.save_changes',
    section: 'Settings',
    sourceText: 'Save account settings',
    fr: { status: 'outdated', value: 'Enregistrer les paramètres du compte' },
    de: { status: 'translated', value: 'Kontoeinstellungen speichern' },
    es: { status: 'missing', value: '' },
  },
  {
    id: 'k15',
    key: 'dam.asset.delete_confirm',
    section: 'Media Library',
    sourceText: 'Are you sure you want to delete this asset? This action cannot be undone.',
    fr: { status: 'translated', value: 'Êtes-vous sûr de vouloir supprimer cet actif ? Cette action est irréversible.' },
    de: { status: 'translated', value: 'Möchten Sie dieses Asset wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.' },
    es: { status: 'missing', value: '' },
  },
];

const TOTAL_KEYS = 142;
const PAGE_SIZE = 15;

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<TranslationStatus, { label: string; dotColor: string; labelColor: string; borderColor: string }> = {
  translated: { label: 'Translated', dotColor: '#22c55e', labelColor: '#22c55e', borderColor: 'transparent' },
  outdated:   { label: 'Outdated',   dotColor: '#eab308', labelColor: '#eab308', borderColor: '#eab308' },
  missing:    { label: 'Missing',    dotColor: '#ef4444', labelColor: '#ef4444', borderColor: '#b0c6ff' },
};

function getHealthStats(keys: TranslationKey[]) {
  let healthy = 0, missing = 0, outdated = 0;
  keys.forEach((k) => {
    [k.fr, k.de, k.es].forEach((loc) => {
      if (loc.status === 'translated') healthy++;
      else if (loc.status === 'missing') missing++;
      else outdated++;
    });
  });
  const total = healthy + missing + outdated;
  const completion = total > 0 ? Math.round((healthy / total) * 100) : 0;
  return { healthy, missing, outdated, completion };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface LocaleCellProps {
  locale: LocaleTranslation;
  onEdit: (value: string) => void;
}

function LocaleCell({ locale, onEdit }: LocaleCellProps) {
  const cfg = STATUS_CONFIG[locale.status];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(locale.value);

  return (
    <div
      className="relative group/cell"
      style={locale.status === 'outdated' ? { borderBottom: `1px solid ${cfg.borderColor}33` } : {}}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: cfg.dotColor }}
          aria-hidden="true"
        />
        <span className="text-[10px] font-bold uppercase" style={{ color: cfg.labelColor }}>
          {cfg.label}
        </span>
      </div>
      {editing ? (
        <div>
          <textarea
            className="w-full rounded border p-1 text-[13px] resize-none focus:outline-none"
            style={{
              background: '#201f1f',
              border: '1px solid #b0c6ff44',
              color: '#e5e2e1',
              minHeight: '40px',
            }}
            rows={Math.max(1, draft.split('\n').length)}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            onBlur={() => {
              setEditing(false);
              onEdit(draft);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setDraft(locale.value);
                setEditing(false);
              }
            }}
          />
        </div>
      ) : (
        <div className="relative">
          <div
            className="text-[13px] leading-relaxed cursor-text"
            style={{ color: locale.status === 'missing' ? '#8d90a0' : '#e5e2e1' }}
            onClick={() => setEditing(true)}
          >
            {locale.value || (
              <span style={{ color: '#8d90a0', fontStyle: 'italic' }}>Type translation...</span>
            )}
          </div>
          <button
            className="absolute right-0 top-0 opacity-0 group-hover/cell:opacity-100 transition-opacity"
            style={{ color: '#8d90a0' }}
            title="Edit translation"
            onClick={() => setEditing(true)}
            aria-label="Edit translation"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function TranslationManagerSkeleton() {
  return (
    <div className="px-8 py-10">
      <Skeleton className="h-4 w-48 mb-6 rounded" />
      <Skeleton className="h-10 w-72 mb-2 rounded" />
      <Skeleton className="h-4 w-96 mb-8 rounded" />
      <div className="rounded-xl overflow-hidden" style={{ background: '#1c1b1b' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-6 py-4 border-b" style={{ borderColor: '#42465422' }}>
            <Skeleton className="h-5 w-44 rounded" />
            <Skeleton className="h-5 w-32 rounded flex-1" />
            <Skeleton className="h-5 w-32 rounded flex-1" />
            <Skeleton className="h-5 w-32 rounded flex-1" />
            <Skeleton className="h-5 w-32 rounded flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: '#201f1f' }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b0c6ff" strokeWidth="1.5" aria-hidden="true">
          <path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" />
          <path d="M2 5h12" /><path d="M7 2h1" />
          <path d="m22 22-5-10-5 10" /><path d="M14 18h6" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: '#e5e2e1' }}>
        No translation keys found
      </h3>
      <p className="text-sm max-w-xs mb-6" style={{ color: '#8d90a0' }}>
        Try adjusting your filters or import a translation file to get started.
      </p>
      <Button>Import Translations</Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

function TranslationManagerPage() {
  const [isLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [keys, setKeys] = useState<TranslationKey[]>(MOCK_KEYS);

  // Filter logic
  const filteredKeys = keys.filter((k) => {
    const matchSearch =
      !searchQuery ||
      k.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.sourceText.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus =
      statusFilter === 'all' ||
      [k.fr, k.de, k.es].some((loc) => loc.status === statusFilter);

    const matchSection =
      sectionFilter === 'all' ||
      (sectionFilter === 'home' && k.section === 'Navigation') ||
      (sectionFilter === 'dashboard' && k.section === 'Dashboard Home') ||
      (sectionFilter === 'global' && k.section === 'Global Components') ||
      (sectionFilter === 'settings' && k.section === 'Settings') ||
      (sectionFilter === 'auth' && k.section === 'Authentication');

    return matchSearch && matchStatus && matchSection;
  });

  const totalPages = Math.ceil(TOTAL_KEYS / PAGE_SIZE);
  const stats = getHealthStats(keys);

  const handleLocaleEdit = useCallback(
    (keyId: string, locale: 'fr' | 'de' | 'es', value: string) => {
      setKeys((prev) =>
        prev.map((k) =>
          k.id === keyId
            ? {
                ...k,
                [locale]: {
                  value,
                  status: value.trim() ? 'translated' : 'missing',
                },
              }
            : k
        )
      );
    },
    []
  );

  if (isLoading) return <TranslationManagerSkeleton />;

  return (
    <div className="min-h-screen" style={{ background: '#201f1f' }}>
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="px-8 py-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          {/* Breadcrumb */}
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard" style={{ color: '#8d90a0' }}>
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/sites" style={{ color: '#8d90a0' }}>
                  Sites
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage style={{ color: '#b0c6ff' }}>Translation Manager</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: '#e5e2e1' }}>
            Language Matrix
          </h1>
          <p className="mt-2 max-w-xl text-sm" style={{ color: '#8d90a0' }}>
            Centralized i18n management for all pages and components. Sync across 4 active regions.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: '#2a2a2a',
              color: '#e5e2e1',
              border: '1px solid #42465422',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#353534'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#2a2a2a'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Import Translations
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: '#b0c6ff', color: '#002d6f' }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export XLIFF
          </button>
        </div>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="px-8 pb-4">
        <div
          className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl"
          style={{ background: '#1c1b1b', borderBottom: '1px solid #42465410' }}
        >
          {/* Left: status filters + search */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: '#2a2a2a', border: '1px solid #42465422' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8d90a0" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search keys..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="bg-transparent border-none text-sm focus:outline-none w-40"
                style={{ color: '#e5e2e1' }}
              />
            </div>

            {/* Status filter chips */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#8d90a0' }}>
                Status:
              </span>
              <div className="flex gap-1">
                {(['all', 'translated', 'outdated', 'missing'] as StatusFilter[]).map((s) => {
                  const active = statusFilter === s;
                  const colors: Record<StatusFilter, { bg: string; text: string; border: string }> = {
                    all:        { bg: active ? '#b0c6ff22' : 'transparent', text: active ? '#b0c6ff' : '#8d90a0', border: active ? '#b0c6ff33' : '#42465422' },
                    translated: { bg: active ? '#22c55e22' : 'transparent', text: active ? '#22c55e' : '#8d90a0', border: active ? '#22c55e33' : '#42465422' },
                    outdated:   { bg: active ? '#eab30822' : 'transparent', text: active ? '#eab308' : '#8d90a0', border: active ? '#eab30833' : '#42465422' },
                    missing:    { bg: active ? '#ef444422' : 'transparent', text: active ? '#ef4444' : '#8d90a0', border: active ? '#ef444433' : '#42465422' },
                  };
                  const c = colors[s];
                  return (
                    <button
                      key={s}
                      onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                      className="px-2 py-0.5 rounded text-[10px] font-bold border capitalize transition-all"
                      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
                    >
                      {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: section filter + count */}
          <div className="flex items-center gap-4">
            <select
              value={sectionFilter}
              onChange={(e) => { setSectionFilter(e.target.value as SectionFilter); setCurrentPage(1); }}
              className="rounded text-xs focus:outline-none focus:ring-1 px-2 py-1"
              style={{
                background: '#353534',
                border: '1px solid #42465422',
                color: '#c3c6d6',
              }}
            >
              <option value="all">All Sections</option>
              <option value="home">Navigation</option>
              <option value="dashboard">Dashboard Home</option>
              <option value="global">Global Components</option>
              <option value="settings">Settings</option>
              <option value="auth">Authentication</option>
            </select>
            <div className="h-4 w-px" style={{ background: '#42465422' }} />
            <span className="text-[11px] font-medium" style={{ color: '#8d90a0' }}>
              Showing{' '}
              <span style={{ color: '#e5e2e1', fontWeight: 700 }}>{filteredKeys.length}</span>{' '}
              keys
            </span>
          </div>
        </div>
      </div>

      {/* ── Translation grid ─────────────────────────────────────────────────── */}
      <div className="px-8 pb-12">
        {filteredKeys.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div
              className="overflow-x-auto rounded-xl"
              style={{ background: '#1c1b1b', border: '1px solid #42465410' }}
            >
              <table className="w-full text-left border-collapse" style={{ minWidth: '1000px' }}>
                <thead>
                  <tr style={{ background: '#13131380' }}>
                    {['Key Name & Context', 'English (Source)', 'French (FR)', 'German (DE)', 'Spanish (ES)'].map(
                      (h, i) => (
                        <th
                          key={h}
                          className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest"
                          style={{
                            color: '#8d90a0',
                            borderBottom: '1px solid #42465418',
                            width: i === 0 ? '18rem' : undefined,
                          }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredKeys.map((k, idx) => (
                    <tr
                      key={k.id}
                      className="group transition-colors"
                      style={{
                        background: idx % 2 !== 0 ? '#201f1f40' : 'transparent',
                        borderBottom: '1px solid #42465410',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '#2a2a2a'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 !== 0 ? '#201f1f40' : 'transparent'; }}
                    >
                      {/* Key + Section */}
                      <td className="px-6 py-4 align-top">
                        <span className="block text-sm font-semibold mb-1" style={{ color: '#b0c6ff' }}>
                          {k.key}
                        </span>
                        <span
                          className="inline-block text-[10px] font-mono px-1.5 py-0.5 rounded"
                          style={{ background: '#13131380', color: '#8d90a0' }}
                        >
                          {k.section}
                        </span>
                      </td>

                      {/* Source (EN) */}
                      <td className="px-6 py-4 align-top">
                        <div className="text-[13px] leading-relaxed" style={{ color: '#e5e2e1' }}>
                          {k.sourceText}
                        </div>
                      </td>

                      {/* FR */}
                      <td className="px-6 py-4 align-top">
                        <LocaleCell
                          locale={k.fr}
                          onEdit={(v) => handleLocaleEdit(k.id, 'fr', v)}
                        />
                      </td>

                      {/* DE */}
                      <td className="px-6 py-4 align-top">
                        <LocaleCell
                          locale={k.de}
                          onEdit={(v) => handleLocaleEdit(k.id, 'de', v)}
                        />
                      </td>

                      {/* ES */}
                      <td className="px-6 py-4 align-top">
                        <LocaleCell
                          locale={k.es}
                          onEdit={(v) => handleLocaleEdit(k.id, 'es', v)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ─────────────────────────────────────────────────── */}
            <div className="mt-6 flex items-center justify-between">
              <p className="text-[11px]" style={{ color: '#8d90a0' }}>
                Showing{' '}
                <span className="font-bold" style={{ color: '#e5e2e1' }}>
                  {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, TOTAL_KEYS)}
                </span>{' '}
                of{' '}
                <span className="font-bold" style={{ color: '#e5e2e1' }}>
                  {TOTAL_KEYS}
                </span>{' '}
                keys
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded transition-colors disabled:opacity-40"
                  style={{ background: '#1c1b1b', color: '#8d90a0' }}
                  onMouseEnter={(e) => { if (currentPage > 1) e.currentTarget.style.background = '#2a2a2a'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#1c1b1b'; }}
                  aria-label="Previous page"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className="px-3 py-1 rounded text-xs font-bold transition-colors"
                    style={
                      currentPage === page
                        ? { background: '#b0c6ff22', color: '#b0c6ff', border: '1px solid #b0c6ff33' }
                        : { background: '#1c1b1b', color: '#8d90a0', border: '1px solid #42465422' }
                    }
                    onMouseEnter={(e) => { if (currentPage !== page) e.currentTarget.style.background = '#2a2a2a'; }}
                    onMouseLeave={(e) => { if (currentPage !== page) e.currentTarget.style.background = '#1c1b1b'; }}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded transition-colors disabled:opacity-40"
                  style={{ background: '#1c1b1b', color: '#8d90a0' }}
                  onMouseEnter={(e) => { if (currentPage < totalPages) e.currentTarget.style.background = '#2a2a2a'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#1c1b1b'; }}
                  aria-label="Next page"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Translation Health panel (fixed bottom-right) ────────────────────── */}
      <div
        className="fixed bottom-6 right-6 z-50 rounded-xl p-4 max-w-xs shadow-2xl"
        style={{
          background: 'rgba(53, 53, 52, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid #42465422',
        }}
      >
        <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#8d90a0' }}>
          Translation Health
        </h4>

        {/* Completion bar */}
        <div className="flex-1 mb-3">
          <div className="flex justify-between text-[11px] mb-1">
            <span style={{ color: '#8d90a0' }}>Completion</span>
            <span className="font-bold" style={{ color: '#b0c6ff' }}>{stats.completion}%</span>
          </div>
          <div className="w-full rounded-full h-1" style={{ background: '#353534' }}>
            <div
              className="h-1 rounded-full"
              style={{
                width: `${stats.completion}%`,
                background: '#b0c6ff',
                boxShadow: '0 0 8px rgba(176,198,255,0.4)',
              }}
            />
          </div>
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Healthy', value: stats.healthy, color: '#22c55e' },
            { label: 'Outdated', value: stats.outdated, color: '#eab308' },
            { label: 'Missing', value: stats.missing, color: '#ef4444' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="p-2 rounded flex items-center gap-2"
              style={{ background: '#13131380' }}
            >
              <div className="w-1 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
              <div>
                <p className="text-[10px] leading-none" style={{ color: '#8d90a0' }}>{label}</p>
                <p className="text-xs font-bold" style={{ color: '#e5e2e1' }}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Named export for the page (Next.js App Router requires a default export)
export default TranslationManagerPage;

