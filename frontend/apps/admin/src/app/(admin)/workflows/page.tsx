'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
  Button,
  Skeleton,
  Textarea,
} from '@flexcms/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WorkflowStatus = 'pending' | 'approved' | 'rejected';
type WorkflowPriority = 'critical' | 'high' | 'medium' | 'low' | 'system';

interface TimelineStep {
  id: string;
  label: string;
  actor: string;
  timestamp: string;
  completed: boolean;
  current?: boolean;
}

interface WorkflowTask {
  id: string;
  title: string;
  description: string;
  status: WorkflowStatus;
  priority?: WorkflowPriority;
  age: string;
  commentCount: number;
  attachmentCount: number;
  assigneeCount: number;
  iconType: 'article' | 'inventory' | 'workflow' | 'warning';
  fullDescription: string;
  initiator: string;
  initiatorInitials: string;
  dueDate: string;
  dueDateOverdue: boolean;
  workflowId: string;
  timeline: TimelineStep[];
}

type TabFilter = 'pending' | 'approved' | 'rejected';
type SortOrder = 'newest' | 'priority' | 'deadline';

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_FLEXCMS_API ?? 'http://localhost:8080';


// ---------------------------------------------------------------------------
// Icon helpers
// ---------------------------------------------------------------------------

function TaskIcon({ type }: { type: WorkflowTask['iconType'] }) {
  const iconMap: Record<WorkflowTask['iconType'], { bg: string; text: string; symbol: string }> = {
    article:   { bg: 'var(--color-primary-container)',   text: 'var(--color-on-primary-container)',   symbol: 'article' },
    inventory: { bg: 'var(--color-tertiary-container)',  text: 'var(--color-on-tertiary-container)',  symbol: 'inventory_2' },
    workflow:  { bg: 'var(--color-secondary-container)', text: 'var(--color-on-secondary-container)', symbol: 'account_tree' },
    warning:   { bg: 'var(--color-error-container)',     text: 'var(--color-on-error-container)',     symbol: 'warning' },
  };
  const { bg, text, symbol } = iconMap[type];
  return (
    <div
      className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
      style={{ backgroundColor: bg, color: text }}
    >
      <span className="material-symbols-outlined text-xl">{symbol}</span>
    </div>
  );
}

function PriorityBadge({ priority }: { priority?: WorkflowPriority }) {
  if (!priority) return null;
  const styles: Record<WorkflowPriority, { bg: string; color: string; label: string }> = {
    critical: { bg: 'rgba(var(--color-error-container-rgb, 147 0 10) / 0.2)', color: 'var(--color-error)', label: 'Critical' },
    high:     { bg: 'var(--color-surface-container-highest)', color: 'var(--color-on-surface-variant)', label: 'Priority High' },
    medium:   { bg: 'var(--color-surface-container-highest)', color: 'var(--color-on-surface-variant)', label: 'Medium' },
    low:      { bg: 'var(--color-surface-container-highest)', color: 'var(--color-on-surface-variant)', label: 'Low' },
    system:   { bg: 'var(--color-surface-container-highest)', color: 'var(--color-on-surface-variant)', label: 'System' },
  };
  const s = styles[priority];
  return (
    <span
      className="text-[0.625rem] font-bold px-2 py-0.5 rounded-full uppercase"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function WorkflowSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-surface-container-low)' }}>
          <div className="flex gap-4">
            <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TaskCard
// ---------------------------------------------------------------------------

interface TaskCardProps {
  task: WorkflowTask;
  selected: boolean;
  onClick: () => void;
}

function TaskCard({ task, selected, onClick }: TaskCardProps) {
  return (
    <div
      className="group p-4 rounded-xl transition-all cursor-pointer relative overflow-hidden"
      style={{
        backgroundColor: selected
          ? 'var(--color-surface-container-high)'
          : 'var(--color-surface-container-low)',
        outline: selected ? '1px solid rgba(176,198,255,0.4)' : 'none',
      }}
      onClick={onClick}
    >
      {selected && (
        <div className="absolute top-0 right-0 p-3">
          <span
            className="text-[0.625rem] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase"
            style={{
              backgroundColor: 'rgba(176,198,255,0.1)',
              color: 'var(--color-primary)',
            }}
          >
            Pending Approval
          </span>
        </div>
      )}

      <div className="flex gap-4">
        <TaskIcon type={task.iconType} />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3
              className="font-bold truncate pr-4"
              style={{ color: selected ? '#f2f0ef' : 'var(--color-on-surface)', fontWeight: selected ? 700 : 600 }}
            >
              {task.title}
            </h3>
            <span className="text-[0.6875rem] shrink-0" style={{ color: 'var(--color-on-surface-variant)' }}>
              {task.age}
            </span>
          </div>
          <p className="text-[0.8125rem] mt-1 line-clamp-1" style={{ color: 'var(--color-on-surface-variant)' }}>
            {task.description}
          </p>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {task.priority && <PriorityBadge priority={task.priority} />}
              {task.assigneeCount > 0 && (
                <div className="flex -space-x-2">
                  <div
                    className="h-6 w-6 rounded-full border flex items-center justify-center text-[10px] font-medium"
                    style={{
                      backgroundColor: 'var(--color-surface-container-highest)',
                      borderColor: 'var(--color-surface)',
                      color: 'var(--color-on-surface-variant)',
                    }}
                  >
                    +{task.assigneeCount}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {task.commentCount > 0 && (
                <span className="flex items-center gap-1 text-[0.6875rem]" style={{ color: 'var(--color-on-surface-variant)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>comment</span>
                  {task.commentCount}
                </span>
              )}
              {task.attachmentCount > 0 && (
                <span className="flex items-center gap-1 text-[0.6875rem]" style={{ color: 'var(--color-on-surface-variant)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>attachment</span>
                  {task.attachmentCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail panel — empty state
// ---------------------------------------------------------------------------

function DetailPanelEmpty() {
  return (
    <div
      className="w-[450px] shrink-0 rounded-2xl flex flex-col items-center justify-center p-12 gap-4"
      style={{
        background: 'rgba(53,53,52,0.8)',
        backdropFilter: 'blur(12px)',
        borderLeft: '1px solid rgba(66,70,84,0.1)',
      }}
    >
      <span className="material-symbols-outlined text-5xl" style={{ color: 'var(--color-on-surface-variant)' }}>
        inbox
      </span>
      <p className="text-sm text-center" style={{ color: 'var(--color-on-surface-variant)' }}>
        Select a task to view details
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

function WorkflowTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div>
      <h4
        className="text-[0.6875rem] font-bold uppercase tracking-widest mb-6"
        style={{ color: 'var(--color-on-surface-variant)' }}
      >
        Workflow Timeline
      </h4>

      <div className="relative space-y-6">
        {/* vertical line */}
        <div
          className="absolute left-[11px] top-2 bottom-2 w-0.5"
          style={{ backgroundColor: 'rgba(66,70,84,0.2)' }}
        />

        {steps.map(step => (
          <div key={step.id} className="relative pl-8">
            {step.completed && !step.current && (
              <div
                className="absolute left-0 top-1 h-6 w-6 rounded-full flex items-center justify-center ring-4"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  boxShadow: '0 0 0 4px var(--color-surface)',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '14px', color: 'var(--color-on-primary)', fontVariationSettings: "'FILL' 1" }}
                >
                  check
                </span>
              </div>
            )}
            {step.current && (
              <div
                className="absolute left-0 top-1 h-6 w-6 rounded-full border-2 flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--color-surface-container-highest)',
                  borderColor: 'var(--color-primary)',
                  boxShadow: '0 0 0 4px var(--color-surface)',
                }}
              >
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />
              </div>
            )}

            <div
              className="text-[0.8125rem] font-semibold"
              style={{ color: step.current ? 'var(--color-primary)' : 'var(--color-on-surface)' }}
            >
              {step.label}
            </div>
            <div className="text-[0.6875rem]" style={{ color: 'var(--color-on-surface-variant)' }}>
              {step.actor}{step.timestamp ? ` • ${step.timestamp}` : ''}
            </div>

            {step.current && (
              <div
                className="mt-4 p-3 rounded-xl"
                style={{
                  backgroundColor: 'var(--color-surface-container-low)',
                  border: '1px solid rgba(66,70,84,0.1)',
                }}
              >
                <Textarea
                  placeholder="Add a comment..."
                  className="border-0 bg-transparent text-[0.8125rem] resize-none min-h-[60px] focus:ring-0 p-0"
                  style={{ color: 'var(--color-on-surface)' }}
                />
                <div
                  className="flex justify-between items-center mt-2 pt-2"
                  style={{ borderTop: '1px solid rgba(66,70,84,0.1)' }}
                >
                  <button
                    className="hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--color-on-surface-variant)' }}
                  >
                    <span className="material-symbols-outlined text-lg">attach_file</span>
                  </button>
                  <span className="text-[10px]" style={{ color: 'var(--color-outline)' }}>
                    Press Cmd+Enter to post
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail panel
// ---------------------------------------------------------------------------

interface DetailPanelProps {
  task: WorkflowTask;
  onClose: () => void;
  onApprove: (id: string, comment?: string) => void;
  onReject: (id: string, comment?: string) => void;
}

function DetailPanel({ task, onClose, onApprove, onReject }: DetailPanelProps) {
  const [comment, setComment] = React.useState('');
  const isPending = task.status === 'pending';

  return (
    <aside
      className="w-[450px] flex flex-col rounded-2xl shrink-0 overflow-hidden"
      style={{
        background: 'rgba(53,53,52,0.8)',
        backdropFilter: 'blur(12px)',
        borderLeft: '1px solid rgba(66,70,84,0.1)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header */}
      <div className="p-6" style={{ borderBottom: '1px solid rgba(66,70,84,0.1)' }}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[0.625rem] font-bold px-2 py-0.5 rounded-full uppercase"
              style={{ backgroundColor: 'rgba(176,198,255,0.1)', color: 'var(--color-primary)' }}
            >
              Active Workflow
            </span>
            <span
              className="text-[0.625rem] font-mono tracking-tighter"
              style={{ color: 'var(--color-on-surface-variant)' }}
            >
              ID: {task.workflowId}
            </span>
          </div>
          <button
            onClick={onClose}
            className="hover:opacity-80 transition-opacity"
            style={{ color: 'var(--color-on-surface-variant)' }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <h2 className="text-xl font-bold leading-tight mt-2" style={{ color: '#f2f0ef' }}>
          {task.title}
        </h2>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Description + meta */}
        <div className="space-y-4">
          <p className="text-[0.8125rem] leading-relaxed" style={{ color: 'var(--color-on-surface-variant)' }}>
            {task.fullDescription}
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-[0.6875rem] block mb-1" style={{ color: 'var(--color-on-surface-variant)' }}>
                Initiator
              </label>
              <div className="flex items-center gap-2">
                <div
                  className="h-5 w-5 rounded-full flex items-center justify-center text-[8px]"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
                >
                  {task.initiatorInitials}
                </div>
                <span className="text-[0.8125rem] font-medium" style={{ color: 'var(--color-on-surface)' }}>
                  {task.initiator}
                </span>
              </div>
            </div>
            <div>
              <label className="text-[0.6875rem] block mb-1" style={{ color: 'var(--color-on-surface-variant)' }}>
                Due Date
              </label>
              <div className="flex items-center gap-2">
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '14px', color: task.dueDateOverdue ? 'var(--color-error)' : 'var(--color-on-surface-variant)' }}
                >
                  {task.dueDateOverdue ? 'event_busy' : 'event'}
                </span>
                <span
                  className="text-[0.8125rem] font-medium"
                  style={{ color: task.dueDateOverdue ? 'var(--color-error)' : 'var(--color-on-surface)' }}
                >
                  {task.dueDate}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <WorkflowTimeline steps={task.timeline} />
      </div>

      {/* Footer actions */}
      <div
        className="p-6 space-y-3"
        style={{
          backgroundColor: 'rgba(53,53,52,0.5)',
          borderTop: '1px solid rgba(66,70,84,0.1)',
        }}
      >
        {isPending && (
          <Textarea
            placeholder="Optional comment…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="border-0 text-[0.8125rem] resize-none min-h-[48px] focus:ring-0 rounded-lg w-full"
            style={{
              backgroundColor: 'var(--color-surface-container)',
              color: 'var(--color-on-surface)',
              padding: '8px 12px',
            }}
          />
        )}
        <div className="flex gap-3">
        {isPending ? (
          <>
            <button
              className="flex-1 font-bold py-3 rounded-xl text-sm transition-all"
              style={{
                backgroundColor: 'var(--color-surface-container-high)',
                color: 'var(--color-error)',
                border: '1px solid rgba(var(--color-error-rgb, 255 180 171) / 0.2)',
              }}
              onClick={() => onReject(task.id, comment || undefined)}
            >
              Reject Task
            </button>
            <button
              className="font-extrabold py-3 px-8 rounded-xl text-sm transition-transform active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-container))',
                color: 'var(--color-on-primary)',
                boxShadow: '0 10px 15px -3px rgba(176,198,255,0.2)',
              }}
              onClick={() => onApprove(task.id, comment || undefined)}
            >
              Approve Workflow
            </button>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-2" style={{ color: 'var(--color-on-surface-variant)' }}>
            <span className="material-symbols-outlined">
              {task.status === 'approved' ? 'check_circle' : 'cancel'}
            </span>
            <span className="text-sm font-medium capitalize">{task.status}</span>
          </div>
        )}
        </div>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WorkflowInboxPage() {
  const [activeTab, setActiveTab] = useState<TabFilter>('pending');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_BASE}/api/author/workflow/for-user?userId=admin&size=200`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: { content?: Record<string, unknown>[] } | Record<string, unknown>[]) => {
        // API returns Page<WorkflowInstance> — extract .content array
        const list: Record<string, unknown>[] = Array.isArray(data)
          ? data
          : (data as { content?: Record<string, unknown>[] }).content ?? [];

        // ACTIVE → pending, COMPLETED → approved or rejected depending on lastAction
        const items: WorkflowTask[] = list.map((w, i) => {
          const apiStatus = (w.status as string) ?? 'ACTIVE';
          const lastAction = (w.lastAction as string) ?? '';
          let uiStatus: WorkflowStatus = 'pending';
          if (apiStatus === 'COMPLETED') {
            uiStatus = lastAction === 'reject' ? 'rejected' : 'approved';
          } else if (apiStatus === 'CANCELLED') {
            uiStatus = 'rejected';
          }
          return {
            id: (w.id as string) ?? String(i),
            title: (w.workflowName as string) ?? 'Workflow',
            description: `Content path: ${(w.contentPath as string) ?? '—'}`,
            status: uiStatus,
            age: w.startedAt ? new Date(w.startedAt as string).toLocaleDateString() : '—',
            commentCount: w.lastComment ? 1 : 0,
            attachmentCount: 0,
            assigneeCount: 0,
            iconType: 'workflow' as const,
            fullDescription: `Workflow "${(w.workflowName as string) ?? ''}" is active for content at: ${(w.contentPath as string) ?? '—'}`,
            initiator: (w.startedBy as string) ?? 'System',
            initiatorInitials: ((w.startedBy as string) ?? 'SY').slice(0, 2).toUpperCase(),
            dueDate: '—',
            dueDateOverdue: false,
            workflowId: (w.id as string) ?? '',
            timeline: [
              { id: 'start', label: 'Workflow Started', actor: (w.startedBy as string) ?? 'System', timestamp: w.startedAt ? new Date(w.startedAt as string).toLocaleString() : '', completed: true, current: false },
              { id: 'review', label: 'Awaiting Review', actor: 'Reviewer', timestamp: '', completed: false, current: apiStatus === 'ACTIVE' },
            ],
          };
        });
        setTasks(items);
        if (items.length > 0) setSelectedTaskId(items[0].id);
      })
      .catch(() => {
        setTasks([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const filteredTasks = tasks
    .filter(t => t.status === activeTab)
    .sort((a, b) => {
      if (sortOrder === 'priority') {
        const order = { critical: 0, high: 1, medium: 2, system: 3, low: 4 };
        return (order[a.priority ?? 'low'] ?? 4) - (order[b.priority ?? 'low'] ?? 4);
      }
      return 0; // keep original order for newest/deadline
    });

  const selectedTask = tasks.find(t => t.id === selectedTaskId) ?? null;

  const pendingCount = tasks.filter(t => t.status === 'pending').length;

  const handleApprove = (id: string, comment?: string) => {
    fetch(`${API_BASE}/api/author/workflow/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceId: id, action: 'approve', userId: 'admin', comment: comment ?? '' }),
    }).catch(() => {/* ignore API errors — optimistic update proceeds */});
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'approved' as WorkflowStatus } : t));
    setSelectedTaskId(null);
  };

  const handleReject = (id: string, comment?: string) => {
    fetch(`${API_BASE}/api/author/workflow/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceId: id, action: 'reject', userId: 'admin', comment: comment ?? '' }),
    }).catch(() => {/* ignore API errors — optimistic update proceeds */});
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'rejected' as WorkflowStatus } : t));
    setSelectedTaskId(null);
  };

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'pending', label: `Pending (${pendingCount})` },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ backgroundColor: 'var(--color-surface)' }}>

      {/* Page header */}
      <section className="px-8 pt-8 pb-4 flex flex-col gap-2 shrink-0">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Workflows</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex justify-between items-end">
          <div>
            <h1
              className="text-3xl font-extrabold tracking-tight"
              style={{ color: '#f2f0ef' }}
            >
              Workflow Inbox
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
              Manage pending approvals and system orchestrations.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">filter_list</span>
              Filters
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Export
            </Button>
          </div>
        </div>
      </section>

      {/* Main workspace */}
      <section className="flex-1 flex min-h-0 px-8 pb-8 gap-6">

        {/* Task list */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 min-w-0">

          {/* Filter bar */}
          <div
            className="flex items-center gap-4 p-2 rounded-xl shrink-0"
            style={{ backgroundColor: 'var(--color-surface-container-low)' }}
          >
            <div
              className="flex rounded-lg p-1"
              style={{ backgroundColor: 'var(--color-surface-container)' }}
            >
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  className="px-4 py-1.5 rounded-md text-[0.8125rem] font-medium transition-all"
                  style={
                    activeTab === tab.key
                      ? {
                          backgroundColor: 'var(--color-primary)',
                          color: 'var(--color-on-primary)',
                          fontWeight: 700,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        }
                      : { color: 'var(--color-on-surface-variant)' }
                  }
                  onClick={() => { setActiveTab(tab.key); setSelectedTaskId(null); }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="h-4 w-px" style={{ backgroundColor: 'rgba(66,70,84,0.3)' }} />

            <select
              className="bg-transparent border-none text-[0.8125rem] focus:ring-0 cursor-pointer"
              style={{ color: 'var(--color-on-surface-variant)' }}
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as SortOrder)}
            >
              <option value="newest">Sort by: Newest First</option>
              <option value="priority">Sort by: Priority</option>
              <option value="deadline">Sort by: Deadline</option>
            </select>
          </div>

          {/* Task cards */}
          {isLoading ? (
            <WorkflowSkeleton />
          ) : filteredTasks.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-24 gap-4 rounded-xl"
              style={{ backgroundColor: 'var(--color-surface-container-low)' }}
            >
              <span className="material-symbols-outlined text-5xl" style={{ color: 'var(--color-on-surface-variant)' }}>
                inbox
              </span>
              <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                No {activeTab} workflows
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  selected={task.id === selectedTaskId}
                  onClick={() => setSelectedTaskId(task.id === selectedTaskId ? null : task.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedTask ? (
          <DetailPanel
            task={selectedTask}
            onClose={() => setSelectedTaskId(null)}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ) : (
          <DetailPanelEmpty />
        )}
      </section>
    </div>
  );
}
