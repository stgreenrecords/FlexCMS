'use client';

import React, { useState, useMemo } from 'react';
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

type ComponentStatus = 'active' | 'deprecated' | 'draft';
type ComponentGroup = 'content' | 'media' | 'layout' | 'navigation' | 'forms' | 'commerce' | 'utility';

interface ComponentDef {
  id: string;
  resourceType: string;
  title: string;
  description: string;
  group: ComponentGroup;
  isContainer: boolean;
  status: ComponentStatus;
  usageCount: number;
  lastModified: string;
  lastModifiedBy: string;
  version: string;
  hasDialog: boolean;
  hasPolicies: boolean;
}

type ViewMode = 'table' | 'grid';

// ---------------------------------------------------------------------------
// Mock data — mirrors ComponentDefinition from flexcms-core
// ---------------------------------------------------------------------------

const MOCK_COMPONENTS: ComponentDef[] = [
  {
    id: 'c1',
    resourceType: 'flexcms/hero',
    title: 'Hero Banner',
    description: 'Full-width hero section with headline, subtext, background image, and CTA buttons.',
    group: 'media',
    isContainer: false,
    status: 'active',
    usageCount: 1248,
    lastModified: 'Oct 12, 2023',
    lastModifiedBy: 'Alex Rivera',
    version: 'v2.4.1',
    hasDialog: true,
    hasPolicies: true,
  },
  {
    id: 'c2',
    resourceType: 'flexcms/text',
    title: 'Rich Text',
    description: 'WYSIWYG rich text editor component with HTML sanitization and XSS protection.',
    group: 'content',
    isContainer: false,
    status: 'active',
    usageCount: 3120,
    lastModified: 'Oct 11, 2023',
    lastModifiedBy: 'Sarah Chen',
    version: 'v3.0.0',
    hasDialog: true,
    hasPolicies: false,
  },
  {
    id: 'c3',
    resourceType: 'flexcms/image',
    title: 'Image',
    description: 'Responsive image with DAM picker, alt text, caption, and rendition support.',
    group: 'media',
    isContainer: false,
    status: 'active',
    usageCount: 842,
    lastModified: 'Oct 10, 2023',
    lastModifiedBy: 'Marcus Kane',
    version: 'v2.1.0',
    hasDialog: true,
    hasPolicies: true,
  },
  {
    id: 'c4',
    resourceType: 'flexcms/container',
    title: 'Layout Container',
    description: 'Generic container component that accepts child components. Supports grid and flex layouts.',
    group: 'layout',
    isContainer: true,
    status: 'active',
    usageCount: 2340,
    lastModified: 'Oct 09, 2023',
    lastModifiedBy: 'System Bot',
    version: 'v1.5.2',
    hasDialog: true,
    hasPolicies: true,
  },
  {
    id: 'c5',
    resourceType: 'flexcms/navigation',
    title: 'Navigation Menu',
    description: 'Dynamic navigation menu driven by content tree structure with multi-level support.',
    group: 'navigation',
    isContainer: false,
    status: 'active',
    usageCount: 156,
    lastModified: 'Oct 08, 2023',
    lastModifiedBy: 'Priya Nair',
    version: 'v2.0.1',
    hasDialog: true,
    hasPolicies: false,
  },
  {
    id: 'c6',
    resourceType: 'flexcms/product-teaser',
    title: 'Product Teaser',
    description: 'PIM-connected product card with SKU, price, stock indicator, and add-to-cart CTA.',
    group: 'commerce',
    isContainer: false,
    status: 'active',
    usageCount: 521,
    lastModified: 'Oct 07, 2023',
    lastModifiedBy: 'Marcus Kane',
    version: 'v1.2.0',
    hasDialog: true,
    hasPolicies: true,
  },
  {
    id: 'c7',
    resourceType: 'flexcms/form',
    title: 'Contact Form',
    description: 'Schema-driven form builder with validation, honeypot spam protection, and webhook output.',
    group: 'forms',
    isContainer: true,
    status: 'draft',
    usageCount: 0,
    lastModified: 'Oct 06, 2023',
    lastModifiedBy: 'Sarah Chen',
    version: 'v0.9.0-rc1',
    hasDialog: true,
    hasPolicies: false,
  },
  {
    id: 'c8',
    resourceType: 'flexcms/tabs',
    title: 'Tab Panel',
    description: 'Container component with tabbed sub-panels. Accepts any child component per tab.',
    group: 'layout',
    isContainer: true,
    status: 'active',
    usageCount: 389,
    lastModified: 'Oct 05, 2023',
    lastModifiedBy: 'Alex Rivera',
    version: 'v1.1.0',
    hasDialog: true,
    hasPolicies: true,
  },
  {
    id: 'c9',
    resourceType: 'flexcms/video',
    title: 'Video Player',
    description: 'Embedded video player with DAM asset source, captions, autoplay, and loop controls.',
    group: 'media',
    isContainer: false,
    status: 'active',
    usageCount: 212,
    lastModified: 'Oct 04, 2023',
    lastModifiedBy: 'Priya Nair',
    version: 'v1.3.0',
    hasDialog: true,
    hasPolicies: false,
  },
  {
    id: 'c10',
    resourceType: 'flexcms/breadcrumb',
    title: 'Breadcrumb',
    description: 'Auto-generated breadcrumb trail from content tree path. Configurable separator and root.',
    group: 'navigation',
    isContainer: false,
    status: 'active',
    usageCount: 98,
    lastModified: 'Sep 28, 2023',
    lastModifiedBy: 'System Bot',
    version: 'v1.0.2',
    hasDialog: false,
    hasPolicies: false,
  },
  {
    id: 'c11',
    resourceType: 'flexcms/teaser-list',
    title: 'Teaser List',
    description: 'Legacy multi-page teaser list component — superseded by flexcms/content-list.',
    group: 'content',
    isContainer: false,
    status: 'deprecated',
    usageCount: 52,
    lastModified: 'Sep 15, 2023',
    lastModifiedBy: 'Marcus Aurelius',
    version: 'v0.9.4',
    hasDialog: true,
    hasPolicies: false,
  },
  {
    id: 'c12',
    resourceType: 'flexcms/content-list',
    title: 'Content List',
    description: 'Dynamic content list driven by content tree query with sorting, pagination, and templates.',
    group: 'content',
    isContainer: false,
    status: 'active',
    usageCount: 641,
    lastModified: 'Oct 12, 2023',
    lastModifiedBy: 'Alex Rivera',
    version: 'v1.4.0',
    hasDialog: true,
    hasPolicies: true,
  },
];

const TOTAL_COMPONENTS = 148;
const PAGE_SIZE = 12;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GROUP_LABELS: Record<ComponentGroup, string> = {
  content: 'Content',
  media: 'Media',
  layout: 'Layout',
  navigation: 'Navigation',
  forms: 'Forms',
  commerce: 'Commerce',
  utility: 'Utility',
};

const GROUP_COLORS: Record<ComponentGroup, { bg: string; text: string }> = {
  content:    { bg: '#0058cc22', text: '#b0c6ff' },
  media:      { bg: '#a9380222', text: '#ffb59b' },
  layout:     { bg: '#32457522', text: '#b3c5fd' },
  navigation: { bg: '#22c55e22', text: '#4ade80' },
  forms:      { bg: '#eab30822', text: '#fbbf24' },
  commerce:   { bg: '#8b5cf622', text: '#c4b5fd' },
  utility:    { bg: '#42465433', text: '#c3c6d6' },
};

const STATUS_CONFIG: Record<ComponentStatus, { dot: string; label: string; labelColor: string }> = {
  active:     { dot: '#b0c6ff', label: 'Active',      labelColor: '#e5e2e1' },
  deprecated: { dot: '#ef4444', label: 'Deprecated',  labelColor: '#fca5a5' },
  draft:      { dot: '#8d90a0', label: 'Draft',       labelColor: '#c3c6d6' },
};

// Group icon SVGs
function GroupIcon({ group }: { group: ComponentGroup }) {
  const iconMap: Record<ComponentGroup, React.ReactNode> = {
    content: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    media: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
    layout: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="3" y1="15" x2="21" y2="15"/>
        <line x1="12" y1="9" x2="12" y2="21"/>
      </svg>
    ),
    navigation: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    ),
    forms: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
    commerce: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      </svg>
    ),
    utility: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  };
  return <>{iconMap[group]}</>;
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function ComponentBrowserSkeleton() {
  return (
    <div className="px-8 py-10">
      <Skeleton className="h-4 w-48 mb-6 rounded" />
      <Skeleton className="h-10 w-72 mb-2 rounded" />
      <Skeleton className="h-4 w-96 mb-8 rounded" />
      <div className="rounded-xl overflow-hidden" style={{ background: '#1c1b1b' }}>
        <div className="p-4 flex gap-4" style={{ borderBottom: '1px solid #42465418' }}>
          <Skeleton className="h-9 w-72 rounded" />
          <Skeleton className="h-9 w-32 rounded" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-5" style={{ borderBottom: '1px solid #42465410' }}>
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-48 rounded mb-2" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
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
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: '#e5e2e1' }}>
        No components found
      </h3>
      <p className="text-sm max-w-xs mb-6" style={{ color: '#8d90a0' }}>
        Try adjusting your filters or register a new component type.
      </p>
      <Button>Register Component</Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grid card view
// ---------------------------------------------------------------------------

function ComponentGridCard({ comp }: { comp: ComponentDef }) {
  const groupColor = GROUP_COLORS[comp.group];
  const statusCfg = STATUS_CONFIG[comp.status];

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-4 transition-all duration-200 cursor-pointer group"
      style={{ background: '#1c1b1b', border: '1px solid #42465418' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = '#b0c6ff33';
        (e.currentTarget as HTMLDivElement).style.background = '#201f1f';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = '#42465418';
        (e.currentTarget as HTMLDivElement).style.background = '#1c1b1b';
      }}
    >
      {/* Icon + title row */}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: groupColor.bg, color: groupColor.text }}
        >
          <GroupIcon group={comp.group} />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="text-sm font-bold truncate transition-colors group-hover:text-[#b0c6ff]"
            style={{ color: '#e5e2e1' }}
          >
            {comp.title}
          </h3>
          <code className="text-[10px]" style={{ color: '#8d90a0' }}>{comp.resourceType}</code>
        </div>
      </div>

      {/* Description */}
      <p
        className="text-xs leading-relaxed line-clamp-2"
        style={{ color: '#8d90a0' }}
      >
        {comp.description}
      </p>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Group badge */}
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-bold"
          style={{ background: groupColor.bg, color: groupColor.text }}
        >
          {GROUP_LABELS[comp.group]}
        </span>

        {/* Container badge */}
        {comp.isContainer && (
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-bold"
            style={{ background: '#32457522', color: '#b3c5fd' }}
          >
            Container
          </span>
        )}

        {/* Status */}
        <div className="flex items-center gap-1 ml-auto">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: statusCfg.dot,
              boxShadow: comp.status === 'active' ? `0 0 6px ${statusCfg.dot}66` : 'none',
            }}
            aria-hidden="true"
          />
          <span className="text-[10px] font-medium" style={{ color: statusCfg.labelColor }}>
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: '1px solid #42465418' }}
      >
        <span className="text-[10px] font-mono" style={{ color: '#8d90a0' }}>
          {comp.version}
        </span>
        <span className="text-[10px]" style={{ color: '#8d90a0' }}>
          {comp.usageCount.toLocaleString()} uses
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function ComponentRegistryPage() {
  const [isLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<ComponentGroup | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ComponentStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);

  const filteredComponents = useMemo(() => {
    return MOCK_COMPONENTS.filter((c) => {
      const matchSearch =
        !searchQuery ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.resourceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchGroup = groupFilter === 'all' || c.group === groupFilter;
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;

      return matchSearch && matchGroup && matchStatus;
    });
  }, [searchQuery, groupFilter, statusFilter]);

  const totalPages = Math.ceil(TOTAL_COMPONENTS / PAGE_SIZE);

  if (isLoading) return <ComponentBrowserSkeleton />;

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
                <BreadcrumbPage style={{ color: '#b0c6ff' }}>Component Registry</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: '#e5e2e1' }}>
            Component Registry
          </h1>
          <p className="mt-2 max-w-xl text-sm" style={{ color: '#8d90a0' }}>
            Browse and manage all registered CMS component types. Define authoring dialogs, policies,
            and data schemas for global content distribution.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ background: '#2a2a2a', color: '#e5e2e1', border: '1px solid #42465422' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#353534'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#2a2a2a'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Import Schema
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all"
            style={{ background: 'linear-gradient(135deg, #b0c6ff, #0058cc)', color: '#002d6f' }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Register Component
          </button>
        </div>
      </div>

      {/* ── Stats bento row ─────────────────────────────────────────────────── */}
      <div className="px-8 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Components', value: TOTAL_COMPONENTS, icon: '◈', color: '#b0c6ff' },
            { label: 'Active', value: MOCK_COMPONENTS.filter(c => c.status === 'active').length, icon: '●', color: '#4ade80' },
            { label: 'Containers', value: MOCK_COMPONENTS.filter(c => c.isContainer).length, icon: '⬡', color: '#b3c5fd' },
            { label: 'Deprecated', value: MOCK_COMPONENTS.filter(c => c.status === 'deprecated').length, icon: '⚠', color: '#ef4444' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl p-4"
              style={{ background: '#1c1b1b' }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#8d90a0' }}>
                {label}
              </p>
              <p className="text-2xl font-extrabold" style={{ color }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main data panel ─────────────────────────────────────────────────── */}
      <div className="px-8 pb-12">
        <div className="rounded-xl overflow-hidden" style={{ background: '#1c1b1b', border: '1px solid #42465410' }}>

          {/* Toolbar */}
          <div
            className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
            style={{ borderBottom: '1px solid #42465418' }}
          >
            {/* Left: search + group filter */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ background: '#353534', border: '1px solid #42465422' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8d90a0" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  placeholder="Filter by name or resource type..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent border-none text-sm focus:outline-none"
                  style={{ color: '#e5e2e1', width: '260px' }}
                />
              </div>

              {/* Group filter */}
              <select
                value={groupFilter}
                onChange={(e) => { setGroupFilter(e.target.value as ComponentGroup | 'all'); setCurrentPage(1); }}
                className="rounded-lg text-xs focus:outline-none px-3 py-2"
                style={{ background: '#353534', border: '1px solid #42465422', color: '#c3c6d6' }}
              >
                <option value="all">All Groups</option>
                {Object.entries(GROUP_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as ComponentStatus | 'all'); setCurrentPage(1); }}
                className="rounded-lg text-xs focus:outline-none px-3 py-2"
                style={{ background: '#353534', border: '1px solid #42465422', color: '#c3c6d6' }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="deprecated">Deprecated</option>
              </select>
            </div>

            {/* Right: view toggle + count */}
            <div className="flex items-center gap-4">
              {/* View mode toggle */}
              <div className="flex rounded-lg overflow-hidden" style={{ background: '#2a2a2a' }}>
                {(['table', 'grid'] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className="px-3 py-1.5 text-xs font-bold capitalize transition-colors"
                    style={
                      viewMode === mode
                        ? { background: '#353534', color: '#b0c6ff' }
                        : { color: '#8d90a0' }
                    }
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <span className="text-xs font-medium" style={{ color: '#8d90a0' }}>
                Showing <span style={{ color: '#e5e2e1', fontWeight: 700 }}>{filteredComponents.length}</span> of {TOTAL_COMPONENTS}
              </span>
            </div>
          </div>

          {/* ── Table view ──────────────────────────────────────────────────── */}
          {viewMode === 'table' && (
            filteredComponents.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" style={{ minWidth: '900px' }}>
                  <thead>
                    <tr style={{ background: '#201f1f' }}>
                      {['Component', 'Group', 'Status', 'Type', 'Uses', 'Last Modified', 'Actions'].map((h, i) => (
                        <th
                          key={h}
                          className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest"
                          style={{
                            color: '#8d90a0',
                            borderBottom: '1px solid #42465418',
                            textAlign: i === 6 ? 'right' : undefined,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComponents.map((comp, idx) => {
                      const groupColor = GROUP_COLORS[comp.group];
                      const statusCfg = STATUS_CONFIG[comp.status];
                      return (
                        <tr
                          key={comp.id}
                          className="group transition-colors"
                          style={{
                            background: idx % 2 !== 0 ? '#1a1a1a' : 'transparent',
                            borderBottom: '1px solid #42465410',
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '#2a2a2a40'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 !== 0 ? '#1a1a1a' : 'transparent'; }}
                        >
                          {/* Component name + resource type */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: groupColor.bg, color: groupColor.text }}
                              >
                                <GroupIcon group={comp.group} />
                              </div>
                              <div>
                                <div
                                  className="text-sm font-bold transition-colors group-hover:text-[#b0c6ff]"
                                  style={{ color: '#e5e2e1' }}
                                >
                                  {comp.title}
                                </div>
                                <code className="text-[10px]" style={{ color: '#8d90a0' }}>
                                  {comp.resourceType}
                                </code>
                              </div>
                            </div>
                          </td>

                          {/* Group badge */}
                          <td className="px-6 py-5">
                            <span
                              className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                              style={{ background: groupColor.bg, color: groupColor.text }}
                            >
                              {GROUP_LABELS[comp.group]}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{
                                  background: statusCfg.dot,
                                  boxShadow: comp.status === 'active' ? `0 0 8px ${statusCfg.dot}66` : 'none',
                                }}
                                aria-hidden="true"
                              />
                              <span className="text-[13px] font-medium" style={{ color: statusCfg.labelColor }}>
                                {statusCfg.label}
                              </span>
                            </div>
                          </td>

                          {/* Container / leaf */}
                          <td className="px-6 py-5">
                            <span
                              className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                              style={
                                comp.isContainer
                                  ? { background: '#32457522', color: '#b3c5fd' }
                                  : { background: '#42465422', color: '#8d90a0' }
                              }
                            >
                              {comp.isContainer ? 'Container' : 'Leaf'}
                            </span>
                          </td>

                          {/* Usage count */}
                          <td className="px-6 py-5 font-mono text-[13px]" style={{ color: '#8d90a0' }}>
                            {comp.usageCount.toLocaleString()}
                          </td>

                          {/* Modified */}
                          <td className="px-6 py-5">
                            <div className="text-[13px]" style={{ color: '#e5e2e1' }}>{comp.lastModified}</div>
                            <div className="text-[10px]" style={{ color: '#8d90a0' }}>by {comp.lastModifiedBy}</div>
                          </td>

                          {/* Action menu */}
                          <td className="px-6 py-5 text-right">
                            <div className="relative inline-block">
                              <button
                                className="p-2 rounded-full transition-colors"
                                style={{ color: '#8d90a0' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#353534'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                onClick={() => setOpenActionMenu(openActionMenu === comp.id ? null : comp.id)}
                                aria-label={`Actions for ${comp.title}`}
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                  <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                                </svg>
                              </button>

                              {openActionMenu === comp.id && (
                                <div
                                  className="absolute right-0 top-full mt-1 rounded-xl py-1 z-50 min-w-[160px] shadow-2xl"
                                  style={{ background: '#2a2a2a', border: '1px solid #42465433' }}
                                >
                                  {[
                                    { label: 'Edit Dialog', icon: '✏' },
                                    { label: 'View Schema', icon: '{ }' },
                                    { label: 'View Usages', icon: '◈' },
                                    { label: 'Clone', icon: '⊕' },
                                    { label: 'Deprecate', icon: '⚠', danger: true },
                                  ].map(({ label, icon, danger }) => (
                                    <button
                                      key={label}
                                      className="flex items-center gap-3 w-full px-4 py-2 text-sm transition-colors text-left"
                                      style={{ color: danger ? '#ef4444' : '#c3c6d6' }}
                                      onMouseEnter={(e) => { e.currentTarget.style.background = '#353534'; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                      onClick={() => setOpenActionMenu(null)}
                                    >
                                      <span className="font-mono text-xs w-5">{icon}</span>
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
            )
          )}

          {/* ── Grid view ───────────────────────────────────────────────────── */}
          {viewMode === 'grid' && (
            filteredComponents.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredComponents.map((comp) => (
                  <ComponentGridCard key={comp.id} comp={comp} />
                ))}
              </div>
            )
          )}

          {/* Pagination footer */}
          <div
            className="px-6 py-4 flex flex-col md:flex-row gap-4 items-center justify-between"
            style={{ borderTop: '1px solid #42465418' }}
          >
            <div className="flex items-center gap-4">
              <span className="text-xs font-medium" style={{ color: '#8d90a0' }}>Rows per page:</span>
              <select
                defaultValue="25"
                className="rounded-lg text-xs font-bold px-3 py-1.5 focus:outline-none"
                style={{ background: '#2a2a2a', border: '1px solid #42465422', color: '#c3c6d6' }}
              >
                <option>10</option>
                <option>25</option>
                <option>50</option>
                <option>100</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg transition-colors disabled:opacity-30"
                style={{ color: '#8d90a0' }}
                onMouseEnter={(e) => { if (currentPage > 1) e.currentTarget.style.background = '#2a2a2a'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                aria-label="First page"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/>
                </svg>
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg transition-colors disabled:opacity-30"
                style={{ color: '#8d90a0' }}
                onMouseEnter={(e) => { if (currentPage > 1) e.currentTarget.style.background = '#2a2a2a'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                aria-label="Previous page"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>

              <div className="flex items-center gap-1 px-4">
                <span className="text-sm font-bold" style={{ color: '#b0c6ff' }}>{currentPage}</span>
                <span className="text-sm font-medium" style={{ color: '#8d90a0' }}>of {totalPages}</span>
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg transition-colors disabled:opacity-30"
                style={{ color: '#8d90a0' }}
                onMouseEnter={(e) => { if (currentPage < totalPages) e.currentTarget.style.background = '#2a2a2a'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                aria-label="Next page"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg transition-colors disabled:opacity-30"
                style={{ color: '#8d90a0' }}
                onMouseEnter={(e) => { if (currentPage < totalPages) e.currentTarget.style.background = '#2a2a2a'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                aria-label="Last page"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── Quick-action cards ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {[
            {
              title: 'Usage Analytics',
              desc: 'View which pages and sites consume each component type.',
              color: '#b0c6ff',
              bg: '#b0c6ff18',
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              ),
            },
            {
              title: 'Policy Matrix',
              desc: 'Configure which components are allowed inside each container type.',
              color: '#b3c5fd',
              bg: '#b3c5fd18',
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              ),
            },
            {
              title: 'Dialog Builder',
              desc: 'Design authoring dialogs with drag-and-drop field configuration.',
              color: '#ffb59b',
              bg: '#ffb59b18',
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
                </svg>
              ),
            },
          ].map(({ title, desc, color, bg, icon }) => (
            <div
              key={title}
              className="rounded-xl p-6 flex items-center gap-5 cursor-pointer transition-all"
              style={{ background: '#1c1b1b', border: '1px solid #42465418' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = `${color}44`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#42465418'; }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: bg, color }}
              >
                {icon}
              </div>
              <div>
                <h3 className="text-sm font-bold mb-1" style={{ color: '#e5e2e1' }}>{title}</h3>
                <p className="text-xs" style={{ color: '#8d90a0' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Click-outside handler for action menu */}
      {openActionMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpenActionMenu(null)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export default ComponentRegistryPage;

