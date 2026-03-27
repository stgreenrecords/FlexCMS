'use client';

/**
 * Content Preview Page — P3-18
 *
 * Displays any CMS page inside a sandboxed iframe with a viewport toggle
 * (Desktop / Tablet / Mobile). Accessed via ?path=/some/page/path from the
 * content tree or page editor. Connects to the FlexCMS publish service
 * (NEXT_PUBLIC_FLEXCMS_PUBLISH_URL, default http://localhost:8081).
 *
 * Actions available:
 * - Switch viewport: Desktop (1280px) / Tablet (768px) / Mobile (390px)
 * - Refresh iframe
 * - Open in new tab
 * - Copy preview URL
 * - Navigate to page editor
 */

import React, { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// ---------------------------------------------------------------------------
// Viewport definitions
// ---------------------------------------------------------------------------

type Viewport = 'desktop' | 'tablet' | 'mobile';

interface ViewportDef {
  id: Viewport;
  label: string;
  width: number | null; // null = 100%
  frameWidth: string;
  icon: React.ReactNode;
}

const VIEWPORTS: ViewportDef[] = [
  {
    id: 'desktop',
    label: 'Desktop',
    width: null,
    frameWidth: '100%',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="2" />
        <path d="M8 21h8M12 17v4" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'tablet',
    label: 'Tablet',
    width: 768,
    frameWidth: '768px',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="4" y="2" width="16" height="20" rx="2" strokeWidth="2" />
        <circle cx="12" cy="18" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'mobile',
    label: 'Mobile',
    width: 390,
    frameWidth: '390px',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="7" y="2" width="10" height="20" rx="2" strokeWidth="2" />
        <circle cx="12" cy="18" r="1" fill="currentColor" />
        <path d="M10 5h4" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

const PUBLISH_BASE =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_FLEXCMS_PUBLISH_URL ?? 'http://localhost:8081')
    : 'http://localhost:8081';

const DRAFT_BASE =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_FLEXCMS_SITE_URL ?? 'http://localhost:3001')
    : 'http://localhost:3001';

type PreviewMode = 'live' | 'draft';

// ---------------------------------------------------------------------------
// Inner component (uses useSearchParams — must be inside Suspense)
// ---------------------------------------------------------------------------

function PreviewContent() {
  const searchParams = useSearchParams();
  const rawPath = searchParams.get('path') ?? '/';
  const initialMode = (searchParams.get('mode') === 'draft' ? 'draft' : 'live') as PreviewMode;

  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [previewMode, setPreviewMode] = useState<PreviewMode>(initialMode);
  const [iframeKey, setIframeKey] = useState(0); // increment to force refresh
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const normalizedPath = rawPath.startsWith('/') ? rawPath : '/' + rawPath;
  const base = previewMode === 'draft' ? DRAFT_BASE : PUBLISH_BASE;
  const previewUrl = `${base}/preview${normalizedPath}`;
  const currentVP = VIEWPORTS.find((v) => v.id === viewport)!;

  const refresh = useCallback(() => {
    setLoading(true);
    setIframeKey((k) => k + 1);
  }, []);

  const copyUrl = useCallback(async () => {
    await navigator.clipboard.writeText(previewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [previewUrl]);

  // Reset loading state when iframe loads
  const handleLoad = useCallback(() => setLoading(false), []);

  // Breadcrumb segments from rawPath
  const segments = rawPath.replace(/^\//, '').split('/').filter(Boolean);
  const breadcrumbParts = [
    { label: 'Sites', href: '/sites' },
    { label: 'Content', href: '/content' },
    ...segments.map((seg, i) => ({
      label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
      href: null,
    })),
    { label: 'Preview', href: null },
  ];

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: 'var(--color-background)', color: 'var(--color-foreground)' }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Top toolbar                                                          */}
      {/* ------------------------------------------------------------------ */}
      <header
        className="shrink-0 flex items-center gap-4 px-4 border-b"
        style={{
          height: '56px',
          background: 'var(--color-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-xs shrink-0" aria-label="Breadcrumb">
          {breadcrumbParts.map((part, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <span style={{ color: 'var(--color-muted-foreground)' }}>/</span>
              )}
              {part.href ? (
                <Link
                  href={part.href}
                  className="hover:underline"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  {part.label}
                </Link>
              ) : (
                <span
                  style={{
                    color: i === breadcrumbParts.length - 1
                      ? 'var(--color-foreground)'
                      : 'var(--color-muted-foreground)',
                    fontWeight: i === breadcrumbParts.length - 1 ? 600 : 400,
                  }}
                >
                  {part.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Divider */}
        <div
          className="w-px h-5 shrink-0"
          style={{ background: 'var(--color-border)' }}
        />

        {/* Preview mode toggle */}
        <div
          className="flex items-center rounded-[var(--radius-md)] overflow-hidden border shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
          role="group"
          aria-label="Preview mode"
        >
          {(['draft', 'live'] as PreviewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => { setPreviewMode(mode); setIframeKey((k) => k + 1); setLoading(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors capitalize"
              style={{
                background: previewMode === mode ? 'var(--color-primary)' : 'transparent',
                color: previewMode === mode ? 'var(--color-primary-foreground)' : 'var(--color-muted-foreground)',
              }}
              aria-pressed={previewMode === mode}
            >
              {mode === 'draft' ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              )}
              {mode}
            </button>
          ))}
        </div>

        {/* Viewport toggle */}
        <div
          className="flex items-center rounded-[var(--radius-md)] overflow-hidden border shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
          role="group"
          aria-label="Viewport size"
        >
          {VIEWPORTS.map((vp) => (
            <button
              key={vp.id}
              onClick={() => setViewport(vp.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background:
                  viewport === vp.id
                    ? 'var(--color-primary)'
                    : 'transparent',
                color:
                  viewport === vp.id
                    ? 'var(--color-primary-foreground)'
                    : 'var(--color-muted-foreground)',
              }}
              title={`${vp.label}${vp.width ? ` (${vp.width}px)` : ''}`}
              aria-pressed={viewport === vp.id}
            >
              {vp.icon}
              <span className="hidden sm:inline">{vp.label}</span>
              {vp.width && (
                <span className="hidden md:inline text-[10px] opacity-60">
                  {vp.width}px
                </span>
              )}
            </button>
          ))}
        </div>

        {/* URL bar */}
        <div
          className="flex-1 min-w-0 flex items-center gap-2 px-3 rounded-[var(--radius-md)] border text-sm"
          style={{
            background: 'var(--color-background)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-muted-foreground)',
            height: '32px',
          }}
        >
          {/* Lock icon */}
          <svg className="w-3.5 h-3.5 shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="5" y="11" width="14" height="10" rx="2" strokeWidth="2" />
            <path d="M8 11V7a4 4 0 018 0v4" strokeWidth="2" />
          </svg>
          <span className="truncate font-mono text-xs">{previewUrl}</span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Refresh */}
          <button
            onClick={refresh}
            className="p-2 rounded-[var(--radius-md)] transition-colors hover:bg-[var(--color-accent)]"
            style={{ color: 'var(--color-muted-foreground)' }}
            title="Refresh preview"
            aria-label="Refresh preview"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          {/* Copy URL */}
          <button
            onClick={copyUrl}
            className="p-2 rounded-[var(--radius-md)] transition-colors hover:bg-[var(--color-accent)]"
            style={{
              color: copied ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
            }}
            title={copied ? 'Copied!' : 'Copy preview URL'}
            aria-label="Copy preview URL"
          >
            {copied ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth="2" />
              </svg>
            )}
          </button>

          {/* Open in new tab */}
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-[var(--radius-md)] transition-colors hover:bg-[var(--color-accent)]"
            style={{ color: 'var(--color-muted-foreground)' }}
            title="Open in new tab"
            aria-label="Open in new tab"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>

          {/* Divider */}
          <div className="w-px h-5 mx-1" style={{ background: 'var(--color-border)' }} />

          {/* Edit in page editor */}
          <Link
            href={`/editor?path=${encodeURIComponent(rawPath)}`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] transition-colors"
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-primary-foreground)',
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Link>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Preview canvas                                                       */}
      {/* ------------------------------------------------------------------ */}
      <main
        className="flex-1 overflow-auto flex items-start justify-center"
        style={{
          background: 'var(--color-muted)',
          padding: viewport === 'desktop' ? '0' : '24px 24px 48px',
        }}
      >
        {/* Viewport frame container */}
        <div
          className="relative transition-all duration-300 ease-in-out h-full"
          style={{
            width: currentVP.frameWidth,
            maxWidth: '100%',
            minHeight: viewport !== 'desktop' ? '600px' : undefined,
            background: 'var(--color-background)',
            boxShadow:
              viewport !== 'desktop'
                ? '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px var(--color-border)'
                : 'none',
            borderRadius: viewport !== 'desktop' ? 'var(--radius-md)' : 0,
            overflow: 'hidden',
          }}
        >
          {/* Loading overlay */}
          {loading && (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center"
              style={{ background: 'var(--color-card)' }}
            >
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-8 h-8 border-2 rounded-full animate-spin"
                  style={{
                    borderColor: 'var(--color-border)',
                    borderTopColor: 'var(--color-primary)',
                  }}
                />
                <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  Loading preview…
                </p>
              </div>
            </div>
          )}

          {/* Iframe */}
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={previewUrl}
            title={`Preview: ${rawPath}`}
            className="w-full"
            style={{
              border: 'none',
              height: viewport !== 'desktop' ? '900px' : '100%',
              minHeight: viewport === 'desktop' ? '100%' : undefined,
              display: 'block',
            }}
            onLoad={handleLoad}
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>

        {/* Device label badge below frame */}
        {viewport !== 'desktop' && (
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full"
            style={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-muted-foreground)',
            }}
          >
            {currentVP.icon}
            {currentVP.label} — {currentVP.width}px
          </div>
        )}
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* Status bar                                                           */}
      {/* ------------------------------------------------------------------ */}
      <footer
        className="shrink-0 flex items-center justify-between px-4 text-xs"
        style={{
          height: '28px',
          background: 'var(--color-card)',
          borderTop: '1px solid var(--color-border)',
          color: 'var(--color-muted-foreground)',
        }}
      >
        <span>
          {loading ? (
            <span style={{ color: 'var(--color-warning, #f59e0b)' }}>Loading…</span>
          ) : (
            <span style={{ color: 'var(--color-success, #22c55e)' }}>Preview ready</span>
          )}
        </span>
        <span className="font-mono">{rawPath}</span>
        <span>
          {currentVP.label}{currentVP.width ? ` · ${currentVP.width}px` : ' · Full width'}{' '}
          · <span style={{ color: previewMode === 'draft' ? 'var(--color-warning, #f59e0b)' : 'var(--color-success, #22c55e)' }}>
            {previewMode === 'draft' ? 'Draft' : 'Live'}
          </span>
        </span>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page export (wraps inner content in Suspense for useSearchParams)
// ---------------------------------------------------------------------------

export default function ContentPreviewPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex items-center justify-center h-screen"
          style={{ background: 'var(--color-background)', color: 'var(--color-muted-foreground)' }}
        >
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-8 h-8 border-2 rounded-full animate-spin"
              style={{
                borderColor: 'var(--color-border)',
                borderTopColor: 'var(--color-primary)',
              }}
            />
            <p className="text-sm">Loading preview…</p>
          </div>
        </div>
      }
    >
      <PreviewContent />
    </Suspense>
  );
}
