'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
  Button,
  Input,
  Skeleton,
  TagInput,
  Textarea,
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@flexcms/ui';

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_FLEXCMS_API ?? 'http://localhost:8080';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AssetStatus = 'published' | 'draft' | 'processing' | 'error';

interface Rendition {
  id: string;
  label: string;
  spec: string;       // e.g. "250×250 • WebP • 12kb"
  icon: React.ReactNode;
  hasThumbnail?: boolean;
}

interface UsageRef {
  label: string;
  count: number;
}

interface AssetDetail {
  id: string;
  filename: string;
  title: string;
  altText: string;
  tags: string[];
  copyright: string;
  status: AssetStatus;
  format: string;
  colorSpace: string;
  dimensions: string;
  fileSize: string;
  type: 'image' | 'video' | 'pdf' | 'other';
  renditions: Rendition[];
  usageRefs: UsageRef[];
}


// ---------------------------------------------------------------------------
// Status badge config
// ---------------------------------------------------------------------------

const STATUS_BADGE: Record<AssetStatus, { label: string; className: string }> = {
  published:  { label: 'Published',  className: 'text-[var(--color-primary)] bg-[var(--color-primary)]/10' },
  draft:      { label: 'Draft',      className: 'text-[var(--color-muted-foreground)] bg-[var(--color-muted)]/30' },
  processing: { label: 'Processing', className: 'text-[#ffb59b] bg-[#ffb59b]/10' },
  error:      { label: 'Error',      className: 'text-[var(--color-destructive)] bg-[var(--color-destructive)]/10' },
};

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function AssetDetailPage() {
  const params = useParams();
  const assetId = params?.id as string;
  const [loading, setLoading]   = useState(true);
  const [asset, setAsset]       = useState<AssetDetail | null>(null);
  const [title, setTitle]       = useState('');
  const [altText, setAltText]   = useState('');
  const [tags, setTags]         = useState<string[]>([]);
  const [copyright, setCopyright] = useState('');

  // Fetch asset from API
  useEffect(() => {
    if (!assetId) { setLoading(false); return; }
    setLoading(true);
    fetch(`${API_BASE}/api/author/assets/${assetId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: Record<string, unknown>) => {
        const det: AssetDetail = {
          id: (data.id as string) ?? assetId,
          filename: (data.originalFilename as string) ?? (data.name as string) ?? 'unnamed',
          title: (data.name as string) ?? '',
          altText: '',
          tags: (data.tags as string[]) ?? [],
          copyright: '',
          status: ((data.status as string) ?? 'ACTIVE').toLowerCase() === 'active' ? 'published' : 'draft',
          format: (data.mimeType as string) ?? '',
          colorSpace: 'sRGB',
          dimensions: data.width && data.height ? `${data.width} × ${data.height} px` : '—',
          fileSize: data.fileSize ? formatDetailBytes(data.fileSize as number) : '—',
          type: ((data.mimeType as string) ?? '').startsWith('image/') ? 'image'
            : ((data.mimeType as string) ?? '').startsWith('video/') ? 'video'
            : 'other',
          renditions: [],
          usageRefs: [],
        };
        setAsset(det);
        setTitle(det.title);
        setAltText(det.altText);
        setTags(det.tags);
        setCopyright(det.copyright);
      })
      .catch(() => {
        setAsset(null);
      })
      .finally(() => setLoading(false));
  }, [assetId]);

  // Loading skeleton
  if (loading) {
    return (
      <TooltipProvider>
        <div className="flex flex-col h-full min-h-0">
          {/* Breadcrumb skeleton */}
          <div className="px-6 pt-4 pb-2">
            <Skeleton className="h-4 w-64" />
          </div>
          {/* Action header skeleton */}
          <div className="h-14 flex items-center justify-between px-8 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-4">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-48" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-20 rounded-[var(--radius-md)]" />
              <Skeleton className="h-8 w-28 rounded-[var(--radius-md)]" />
            </div>
          </div>
          {/* Content skeleton */}
          <div className="p-8 grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-7 xl:col-span-8 space-y-6">
              <Skeleton className="aspect-video rounded-[var(--radius-lg)]" />
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-4">
                  <Skeleton className="h-6 w-48" />
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-[72px] rounded-[var(--radius-md)]" />
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-6 w-36" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-5 xl:col-span-4 space-y-6">
              <Skeleton className="h-[480px] rounded-[var(--radius-lg)]" />
              <Skeleton className="h-[120px] rounded-[var(--radius-lg)]" />
            </div>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Empty / not found state
  if (!asset) {
    return (
      <TooltipProvider>
        <div className="flex flex-col h-full min-h-0">
          <div className="px-6 pt-4 pb-2">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbLink href="/dam">Assets</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Not Found</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex flex-col items-center justify-center flex-1 min-h-[400px] gap-4 text-center">
            <div className="h-16 w-16 rounded-full bg-[var(--color-muted)]/30 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-[var(--color-muted-foreground)]" />
            </div>
            <div>
              <p className="font-semibold text-[var(--color-foreground)]">Asset not found</p>
              <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                The requested asset does not exist or has been deleted.
              </p>
            </div>
            <Link href="/dam">
              <Button variant="default">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Library
              </Button>
            </Link>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  const statusBadge = STATUS_BADGE[asset.status];

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full min-h-0">
        {/* Breadcrumb */}
        <div className="px-6 pt-4 pb-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/dam">Assets</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{asset.filename}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Action Header */}
        <div
          className="h-14 flex items-center justify-between px-8 border-b border-[var(--color-border)] sticky top-0 z-30"
          style={{ background: 'var(--color-card)', backdropFilter: 'blur(12px)' }}
        >
          <div className="flex items-center gap-4">
            <Link
              href="/dam"
              className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] flex items-center gap-1 text-sm font-medium transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Library
            </Link>
            <div className="h-4 w-[1px] bg-[var(--color-border)]" aria-hidden="true" />
            <h1 className="text-sm font-semibold tracking-wide text-[var(--color-foreground]">
              ASSET_ID: {asset.filename}
            </h1>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBadge.className}`}>
              {statusBadge.label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-xs font-bold">
              Discard
            </Button>
            <Button variant="default" size="sm" className="text-xs font-bold">
              Save Changes
            </Button>
          </div>
        </div>

        {/* Main content + context rail wrapper */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-8 grid grid-cols-12 gap-8">
              {/* =========================================== */}
              {/* LEFT COLUMN: Preview + Analysis             */}
              {/* =========================================== */}
              <div className="col-span-12 lg:col-span-7 xl:col-span-8 space-y-6">

                {/* Main Preview Surface */}
                <section className="rounded-[var(--radius-lg)] overflow-hidden aspect-video relative flex items-center justify-center group shadow-2xl bg-[var(--color-background)]">
                  {/* Placeholder image gradient (no external URLs) */}
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, var(--color-primary) 0%, rgba(0,88,204,0.3) 50%, var(--color-background) 100%)',
                    }}
                  >
                    <ImageIcon className="h-16 w-16 text-[var(--color-primary-foreground)]" />
                  </div>

                  {/* Preview toolbar (shown on hover) */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 rounded-full border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'rgba(53,53,52,0.6)', backdropFilter: 'blur(16px)' }}>
                    <PreviewButton icon={<ZoomInIcon />} label="Zoom in" />
                    <PreviewButton icon={<ZoomOutIcon />} label="Zoom out" />
                    <div className="w-[1px] h-4 bg-white/20 mx-1" aria-hidden="true" />
                    <PreviewButton icon={<CropIcon />} label="Crop" />
                    <PreviewButton icon={<PaletteIcon />} label="Color adjust" />
                    <div className="w-[1px] h-4 bg-white/20 mx-1" aria-hidden="true" />
                    <PreviewButton icon={<FullscreenIcon />} label="Fullscreen" />
                  </div>
                </section>

                {/* Analysis / Renditions Grid (Bento Style) */}
                <div className="grid grid-cols-3 gap-6">
                  {/* Renditions Panel */}
                  <div className="col-span-2 p-6 rounded-[var(--radius-lg)] space-y-4 bg-[var(--color-card)]">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[var(--color-foreground)] flex items-center gap-2">
                        <LayersIcon className="h-4 w-4 text-[var(--color-primary)]" />
                        Generated Renditions
                      </h3>
                      <button className="text-xs font-bold text-[var(--color-primary)] hover:underline transition-colors">
                        Regenerate All
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {asset.renditions.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center gap-4 p-3 rounded-[var(--radius-md)] transition-colors cursor-pointer group/rend bg-[var(--color-muted)]/20 hover:bg-[var(--color-accent)]"
                        >
                          <div className="w-12 h-12 rounded-[var(--radius-sm)] flex items-center justify-center overflow-hidden bg-[var(--color-muted)]/30">
                            {r.hasThumbnail ? (
                              <div
                                className="w-full h-full flex items-center justify-center"
                                style={{
                                  background: 'linear-gradient(135deg, var(--color-primary)/20 0%, var(--color-primary)/40 100%)',
                                }}
                              >
                                <ImageIcon className="h-5 w-5 text-[var(--color-primary)]" />
                              </div>
                            ) : (
                              <span className="text-[var(--color-muted-foreground)]">{r.icon}</span>
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[var(--color-foreground)]">{r.label}</div>
                            <div className="text-[10px] text-[var(--color-muted-foreground)] uppercase tracking-tight">
                              {r.spec}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Usage Stats Panel */}
                  <div className="p-6 rounded-[var(--radius-lg)] space-y-4 bg-[var(--color-card)]">
                    <h3 className="text-sm font-bold text-[var(--color-foreground)] flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-[var(--color-primary)]" />
                      Usage References
                    </h3>
                    <div className="space-y-4">
                      {asset.usageRefs.map((ref) => (
                        <div key={ref.label} className="flex items-center justify-between">
                          <span className="text-xs text-[var(--color-muted-foreground)]">{ref.label}</span>
                          <span className="text-xs font-bold bg-[var(--color-muted)]/30 px-2 py-0.5 rounded-[var(--radius-sm)]">
                            {ref.count}
                          </span>
                        </div>
                      ))}
                      <button className="w-full mt-2 py-2 text-[10px] uppercase font-black tracking-widest rounded-[var(--radius-md)] transition-colors bg-[var(--color-muted)]/20 hover:bg-[var(--color-accent)] text-[var(--color-primary)]">
                        View Full Report
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* =========================================== */}
              {/* RIGHT COLUMN: Metadata Editor               */}
              {/* =========================================== */}
              <div className="col-span-12 lg:col-span-5 xl:col-span-4">
                <div className="sticky top-32 space-y-6">

                  {/* Metadata Form Card */}
                  <div className="rounded-[var(--radius-lg)] p-8 shadow-xl bg-[var(--color-card)]">
                    <div className="flex items-center gap-3 mb-8">
                      <EditNoteIcon className="h-5 w-5 text-[var(--color-primary)]" />
                      <h2 className="text-lg font-bold text-[var(--color-foreground)] tracking-tight">Metadata Editor</h2>
                    </div>
                    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                      {/* Title */}
                      <div className="space-y-2">
                        <label
                          htmlFor="asset-title"
                          className="text-[10px] uppercase font-black tracking-widest text-[var(--color-muted-foreground)]"
                        >
                          Asset Title
                        </label>
                        <Input
                          id="asset-title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="text-sm font-medium"
                        />
                      </div>

                      {/* Alt Text */}
                      <div className="space-y-2">
                        <label
                          htmlFor="asset-alt"
                          className="text-[10px] uppercase font-black tracking-widest text-[var(--color-muted-foreground)]"
                        >
                          Alt Text (Accessibility)
                        </label>
                        <Textarea
                          id="asset-alt"
                          value={altText}
                          onChange={(e) => setAltText(e.target.value)}
                          rows={3}
                          className="text-sm resize-none"
                        />
                      </div>

                      {/* Tags */}
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-[var(--color-muted-foreground)]">
                          Tags
                        </label>
                        <TagInput
                          value={tags}
                          onChange={setTags}
                          placeholder="Add a tag..."
                        />
                      </div>

                      {/* Copyright Holder */}
                      <div className="space-y-2">
                        <label
                          htmlFor="asset-copyright"
                          className="text-[10px] uppercase font-black tracking-widest text-[var(--color-muted-foreground)]"
                        >
                          Copyright Holder
                        </label>
                        <div className="relative">
                          <CopyrightIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted-foreground)]" />
                          <Input
                            id="asset-copyright"
                            value={copyright}
                            onChange={(e) => setCopyright(e.target.value)}
                            className="pl-10 text-sm font-medium"
                          />
                        </div>
                      </div>

                      {/* Advanced IPTC/XMP Toggle */}
                      <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-2">
                          <TuneIcon className="h-4 w-4 text-[var(--color-muted-foreground)] group-hover:text-[var(--color-primary)] transition-colors" />
                          <span className="text-xs font-bold text-[var(--color-muted-foreground)] group-hover:text-[var(--color-foreground)] transition-colors">
                            Advanced IPTC/XMP Data
                          </span>
                        </div>
                        <ChevronRightIcon className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                      </div>
                    </form>
                  </div>

                  {/* Technical Specs Card */}
                  <div className="rounded-[var(--radius-lg)] p-6 border border-[var(--color-border)] bg-[var(--color-background)]">
                    <div className="grid grid-cols-2 gap-y-4">
                      <TechSpec label="Format" value={asset.format} />
                      <TechSpec label="Color Space" value={asset.colorSpace} />
                      <TechSpec label="Dimensions" value={asset.dimensions} />
                      <TechSpec label="File Size" value={asset.fileSize} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right context rail */}
          <aside className="w-14 shrink-0 border-l border-[var(--color-border)] flex flex-col items-center py-5 gap-3">
            <RailButton icon={<HistoryIcon />} label="Version History" />
            <RailButton icon={<CommentIcon />} label="Asset Comments" badge />
            <RailButton icon={<ShareIcon />} label="Share Asset" />
            <div className="w-6 h-[1px] bg-[var(--color-border)] my-1" aria-hidden="true" />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="h-9 w-9 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 transition-colors"
                  aria-label="Delete Asset"
                >
                  <TrashIcon />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">Delete Asset</TooltipContent>
            </Tooltip>
          </aside>
        </div>
      </div>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PreviewButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"
      aria-label={label}
    >
      {icon}
    </button>
  );
}

function TechSpec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-[var(--color-muted-foreground)] uppercase font-bold">{label}</div>
      <div className="text-xs font-bold text-[var(--color-foreground)]">{value}</div>
    </div>
  );
}

function RailButton({ icon, label, badge }: { icon: React.ReactNode; label: string; badge?: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className="relative h-9 w-9 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-accent)] transition-colors"
          aria-label={label}
        >
          {icon}
          {badge && (
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ background: 'var(--color-destructive)' }}
              aria-hidden="true"
            />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="left">{label}</TooltipContent>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// SVG Icons (inline, no external deps)
// ---------------------------------------------------------------------------

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function ImageThumbnailIcon() {
  return <ImageIcon className="h-5 w-5" />;
}

function SocialIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function SmartphoneIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function EditNoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-5 w-5'} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function CopyrightIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M14.83 14.83a4 4 0 1 1 0-5.66" />
    </svg>
  );
}

function TuneIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ZoomInIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function CropIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15" />
      <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="13.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="10.5" r="2.5" />
      <circle cx="8.5" cy="7.5" r="2.5" /><circle cx="6.5" cy="12.5" r="2.5" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

function FullscreenIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
      <polyline points="12 7 12 12 16 14" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function formatDetailBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
