'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActivityStatus = 'draft' | 'published' | 'review' | 'archived';

interface ActivityItem {
  id: string;
  name: string;
  path: string;
  status: ActivityStatus;
  timeAgo: string;
  curator: { initials: string; name: string; color: string };
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_FLEXCMS_API ?? 'http://localhost:8080';

interface DashboardStats {
  totalPages: string;
  activeSites: string;
  workflows: string;
  storageUsed: string;
}

const DEFAULT_STATS: DashboardStats = {
  totalPages: '—',
  activeSites: '—',
  workflows: '—',
  storageUsed: '—',
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------


const STATUS_STYLES: Record<ActivityStatus, { label: string; bg: string; color: string; border?: string }> = {
  draft:     { label: 'DRAFT',     bg: '#324575',                  color: '#b3c5fd' },
  published: { label: 'PUBLISHED', bg: 'rgba(52,211,153,0.1)',     color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' },
  review:    { label: 'REVIEW',    bg: '#a93802',                  color: '#ffcebd' },
  archived:  { label: 'ARCHIVED',  bg: 'rgba(141,144,160,0.15)',   color: '#8d90a0' },
};

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real data from backend
  useEffect(() => {
    setLoading(true);
    const statusMap: Record<string, ActivityStatus> = {
      PUBLISHED: 'published',
      DRAFT: 'draft',
      IN_REVIEW: 'review',
      APPROVED: 'review',
      ARCHIVED: 'archived',
    };

    // Fetch content list for recent activity + stats
    fetch(`${API_BASE}/api/author/content/list?size=50`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        const nodes = (data.content ?? []) as Record<string, unknown>[];
        const totalElements = (data.totalElements ?? nodes.length) as number;

        // Build stats
        setStats({
          totalPages: totalElements.toLocaleString(),
          activeSites: String(new Set(nodes.map((n) => n.siteId).filter(Boolean)).size || '—'),
          workflows: '—',
          storageUsed: '—',
        });

        // Build recent activity from the first 5 nodes
        if (nodes.length > 0) {
          const items: ActivityItem[] = nodes.slice(0, 5).map((n, i) => {
            const updatedBy = (n.modifiedBy as string) ?? (n.createdBy as string) ?? 'System';
            const initials = updatedBy.slice(0, 2).toUpperCase();
            const modAt = n.modifiedAt ? new Date(n.modifiedAt as string) : null;
            const timeAgo = modAt ? timeSince(modAt) : '—';
            return {
              id: (n.id as string) ?? String(i),
              name: (n.name as string) ?? 'Untitled',
              path: '/' + ((n.path as string) ?? '').replace(/\./g, '/'),
              status: statusMap[(n.status as string) ?? 'DRAFT'] ?? 'draft',
              timeAgo,
              curator: { initials, name: updatedBy, color: '#b0c6ff' },
            };
          });
          setActivity(items);
        }
      })
      .catch(() => {
        // API unavailable
      })
      .finally(() => setLoading(false));
  }, []);

  // Helper: human-readable time since date
  function timeSince(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return days === 1 ? 'Yesterday' : `${days} days ago`;
  }

  // Build dynamic stats array
  const DYNAMIC_STATS = [
    { icon: <PageIcon />, iconColor: '#b0c6ff', label: 'Total Pages', value: stats.totalPages, badge: loading ? '...' : 'Live', badgeColor: '#34d399', badgeBg: 'rgba(52,211,153,0.1)', hoverBorder: 'rgba(176,198,255,0.3)' },
    { icon: <SiteIcon />, iconColor: '#b3c5fd', label: 'Active Sites', value: stats.activeSites, badge: 'Live', badgeColor: '#8d90a0', badgeBg: 'rgba(141,144,160,0.1)', hoverBorder: 'rgba(179,197,253,0.3)' },
    { icon: <WorkflowIcon />, iconColor: '#ffb59b', label: 'Workflows', value: stats.workflows, badge: '—', badgeColor: '#ffb59b', badgeBg: 'rgba(255,181,155,0.1)', hoverBorder: 'rgba(255,181,155,0.3)' },
    { icon: <StorageIcon />, iconColor: '#8d90a0', label: 'Storage Used', value: stats.storageUsed, badge: '—', badgeColor: '#8d90a0', badgeBg: 'rgba(141,144,160,0.1)', hoverBorder: 'rgba(141,144,160,0.2)' },
  ];

  return (
    <div className="p-8" style={{ minHeight: 'calc(100vh - 64px)', background: '#201f1f' }}>
      {/* Breadcrumb + header */}
      <header className="mb-8">
        <nav className="flex items-center gap-2 mb-4 text-xs font-medium" style={{ color: 'rgba(195,198,214,0.6)' }}>
          <a href="#" className="hover:text-[#b0c6ff] transition-colors">Workspace</a>
          <span aria-hidden="true">›</span>
          <span style={{ color: '#e5e2e1' }}>CMS Dashboard</span>
        </nav>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: '#e5e2e1' }}>
              Workspace Overview
            </h1>
            <p className="font-medium" style={{ color: '#c3c6d6' }}>
              Monitoring architectural distribution and content lifecycles.
            </p>
          </div>
          <Link
            href="/content"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-transform active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #b0c6ff 0%, #0058cc 100%)',
              color: '#002d6f',
              boxShadow: '0 4px 16px rgba(0,88,204,0.2)',
            }}
          >
            <PlusIcon />
            Create New Resource
          </Link>
        </div>
      </header>

      {/* Stats grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {DYNAMIC_STATS.map(({ icon, iconColor, label, value, badge, badgeColor, badgeBg, hoverBorder }) => (
          <div
            key={label}
            className="p-6 rounded-xl border transition-all"
            style={{
              background: '#1c1b1b',
              borderColor: 'rgba(66,70,84,0.15)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = hoverBorder; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(66,70,84,0.15)'; }}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-lg" style={{ background: iconColor + '1a' }}>
                <span style={{ color: iconColor }}>{icon}</span>
              </div>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                style={{ color: badgeColor, background: badgeBg, borderColor: badgeColor + '33' }}
              >
                {badge}
              </span>
            </div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#8d90a0' }}>
              {label}
            </h4>
            <p className="text-2xl font-black" style={{ color: '#e5e2e1' }}>
              {value}
            </p>
          </div>
        ))}
      </section>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Content Updates (2/3 width) */}
        <section
          className="xl:col-span-2 rounded-xl p-8 border"
          style={{ background: '#1c1b1b', borderColor: 'rgba(66,70,84,0.1)' }}
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold tracking-tight" style={{ color: '#e5e2e1' }}>
                Content Updates
              </h3>
              <p className="text-xs mt-0.5" style={{ color: '#8d90a0' }}>
                System-wide performance overview
              </p>
            </div>
          </div>

          {/* Empty state when no data */}
          <div className="flex flex-col items-center justify-center h-[240px]" style={{ color: '#8d90a0' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true" style={{ opacity: 0.3 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            <p className="text-sm mt-4 font-medium">No content activity data yet</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(141,144,160,0.6)' }}>
              Activity charts will appear once content is authored
            </p>
          </div>
        </section>

        {/* Smart Tasks (1/3 width) */}
        <section
          className="rounded-xl p-6 border"
          style={{ background: '#1c1b1b', borderColor: 'rgba(66,70,84,0.1)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: '#c3c6d6' }}>
              <SparkleIcon />
              Smart Tasks
            </h3>
            <span
              className="text-[10px] px-2 py-0.5 rounded font-bold"
              style={{ background: 'rgba(176,198,255,0.1)', color: '#b0c6ff' }}
            >
              AI Priority
            </span>
          </div>

          <div className="flex flex-col items-center justify-center py-12" style={{ color: '#8d90a0' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" style={{ opacity: 0.3 }}>
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
            <p className="text-xs mt-3 font-medium">No pending tasks</p>
            <p className="text-[10px] mt-1 text-center" style={{ color: 'rgba(141,144,160,0.6)' }}>
              AI-prioritised tasks will appear here based on your content activity
            </p>
          </div>
        </section>

        {/* Recent Activity table (full width) */}
        <section
          className="xl:col-span-3 rounded-xl overflow-hidden border"
          style={{ background: '#1c1b1b', borderColor: 'rgba(66,70,84,0.1)' }}
        >
          <div
            className="px-8 py-6 flex justify-between items-center"
            style={{ background: 'rgba(28,27,27,0.5)' }}
          >
            <h3 className="text-lg font-bold tracking-tight" style={{ color: '#e5e2e1' }}>
              Recent Global Activity
            </h3>
            <div className="flex gap-4">
              <button
                className="text-xs font-bold flex items-center gap-2 transition-colors"
                style={{ color: '#8d90a0' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#e5e2e1'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#8d90a0'; }}
              >
                <FilterIcon />
                Filter
              </button>
              <button
                className="text-xs font-bold flex items-center gap-2 transition-colors"
                style={{ color: '#8d90a0' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#e5e2e1'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#8d90a0'; }}
              >
                <ExportIcon />
                Export
              </button>
            </div>
          </div>

          <table className="w-full text-left text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{
                  background: 'rgba(42,42,42,0.3)',
                  borderTop: '1px solid rgba(66,70,84,0.08)',
                  borderBottom: '1px solid rgba(66,70,84,0.08)',
                  color: '#8d90a0',
                }}
              >
                <th className="px-8 py-4">Resource Name</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Timeline</th>
                <th className="px-6 py-4">Curator</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((item) => {
                const s = STATUS_STYLES[item.status];
                return (
                  <tr
                    key={item.id}
                    className="transition-colors group"
                    style={{ borderBottom: '1px solid rgba(66,70,84,0.08)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(42,42,42,0.4)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <span style={{ color: item.curator.color }}>
                          <DocIcon />
                        </span>
                        <div>
                          <p className="font-bold" style={{ color: '#e5e2e1' }}>{item.name}</p>
                          <p className="text-[10px]" style={{ color: '#8d90a0' }}>{item.path}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase"
                        style={{ background: s.bg, color: s.color, border: s.border }}
                      >
                        {s.label}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-xs font-medium" style={{ color: '#8d90a0' }}>
                      {item.timeAgo}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                          style={{
                            background: '#2a2a2a',
                            color: item.curator.color,
                            border: '1px solid rgba(66,70,84,0.4)',
                          }}
                        >
                          {item.curator.initials}
                        </div>
                        <span className="text-xs font-medium" style={{ color: '#e5e2e1' }}>
                          {item.curator.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        className="transition-colors"
                        style={{ color: '#8d90a0' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#b0c6ff'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#8d90a0'; }}
                      >
                        <MoreVertIcon />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div
            className="px-8 py-4 flex justify-center"
            style={{ background: 'rgba(28,27,27,0.5)', borderTop: '1px solid rgba(66,70,84,0.08)' }}
          >
            <button
              className="text-[11px] font-bold uppercase tracking-widest transition-all hover:underline"
              style={{ color: '#b0c6ff' }}
            >
              View Complete Activity Logs
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function PageIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4z"/></svg>; }
function SiteIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>; }
function WorkflowIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }
function StorageIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>; }
function PlusIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function SparkleIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#b0c6ff' }} aria-hidden="true"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>; }
function FilterIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>; }
function ExportIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
function DocIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM6 17v-2h12v2H6zm0-4v-2h12v2H6z"/></svg>; }
function MoreVertIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>; }
