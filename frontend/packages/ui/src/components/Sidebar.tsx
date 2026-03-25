'use client';

import React, { createContext, useContext, useState } from 'react';
import { cn } from '../lib/utils';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('Sidebar children must be used inside <SidebarProvider>');
  return ctx;
}

// ---------------------------------------------------------------------------
// SidebarProvider
// ---------------------------------------------------------------------------

export interface SidebarProviderProps {
  defaultCollapsed?: boolean;
  children: React.ReactNode;
}

export function SidebarProvider({ defaultCollapsed = false, children }: SidebarProviderProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Sidebar root
// ---------------------------------------------------------------------------

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  /** Override collapsed state (controlled) */
  collapsed?: boolean;
}

export function Sidebar({ className, collapsed: controlledCollapsed, ...props }: SidebarProps) {
  const ctx = useContext(SidebarContext);
  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : (ctx?.collapsed ?? false);

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        'flex flex-col',
        'bg-[var(--color-card)] border-r border-[var(--color-border)]',
        'transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        'h-full',
        className
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// SidebarHeader
// ---------------------------------------------------------------------------

export function SidebarHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex h-16 items-center border-b border-[var(--color-border)] px-3', className)}
      {...props}
    />
  );
}
SidebarHeader.displayName = 'SidebarHeader';

// ---------------------------------------------------------------------------
// SidebarContent (scrollable area)
// ---------------------------------------------------------------------------

export function SidebarContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex-1 overflow-y-auto py-2', className)}
      {...props}
    />
  );
}
SidebarContent.displayName = 'SidebarContent';

// ---------------------------------------------------------------------------
// SidebarFooter
// ---------------------------------------------------------------------------

export function SidebarFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mt-auto border-t border-[var(--color-border)] py-2', className)}
      {...props}
    />
  );
}
SidebarFooter.displayName = 'SidebarFooter';

// ---------------------------------------------------------------------------
// SidebarGroup + SidebarGroupLabel
// ---------------------------------------------------------------------------

export function SidebarGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-2 py-1', className)} {...props} />;
}
SidebarGroup.displayName = 'SidebarGroup';

export function SidebarGroupLabel({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  const { collapsed } = useSidebar();
  if (collapsed) return null;
  return (
    <p
      className={cn(
        'mb-1 px-2 text-[0.65rem] font-semibold uppercase tracking-wider',
        'text-[var(--color-muted-foreground)]',
        className
      )}
      {...props}
    />
  );
}
SidebarGroupLabel.displayName = 'SidebarGroupLabel';

// ---------------------------------------------------------------------------
// SidebarMenu + SidebarMenuItem
// ---------------------------------------------------------------------------

export function SidebarMenu({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn('space-y-0.5', className)} {...props} />;
}
SidebarMenu.displayName = 'SidebarMenu';

export function SidebarMenuItem({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) {
  return <li className={cn('', className)} {...props} />;
}
SidebarMenuItem.displayName = 'SidebarMenuItem';

// ---------------------------------------------------------------------------
// SidebarMenuButton — the actual clickable nav item
// ---------------------------------------------------------------------------

export interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  tooltip?: string;
  asChild?: boolean;
}

export const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ className, isActive, icon, badge, tooltip, children, asChild: _asChild, ...props }, ref) => {
    const { collapsed } = useSidebar();

    return (
      <button
        ref={ref}
        title={collapsed ? (tooltip ?? (typeof children === 'string' ? children : undefined)) : undefined}
        className={cn(
          'w-full flex items-center gap-3 px-2 py-2 rounded-[var(--radius-sm)]',
          'text-sm font-medium transition-colors',
          'text-[var(--color-foreground)]',
          'hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]',
          isActive && 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]',
          collapsed && 'justify-center px-0',
          className
        )}
        {...props}
      >
        {icon && (
          <span className="h-5 w-5 shrink-0 flex items-center justify-center">{icon}</span>
        )}
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-left">{children}</span>
            {badge && <span className="shrink-0">{badge}</span>}
          </>
        )}
      </button>
    );
  }
);
SidebarMenuButton.displayName = 'SidebarMenuButton';

// ---------------------------------------------------------------------------
// SidebarSeparator
// ---------------------------------------------------------------------------

export function SidebarSeparator({ className, ...props }: React.HTMLAttributes<HTMLHRElement>) {
  return (
    <hr
      className={cn('my-2 border-t border-[var(--color-border)] mx-2', className)}
      {...props}
    />
  );
}
SidebarSeparator.displayName = 'SidebarSeparator';

// ---------------------------------------------------------------------------
// SidebarToggleButton — collapse/expand button
// ---------------------------------------------------------------------------

export function SidebarToggleButton({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { collapsed, setCollapsed } = useSidebar();
  return (
    <button
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      onClick={() => setCollapsed(!collapsed)}
      className={cn(
        'h-8 w-8 flex items-center justify-center rounded-[var(--radius-sm)]',
        'text-[var(--color-muted-foreground)]',
        'hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]',
        'transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]',
        className
      )}
      {...props}
    >
      <PanelLeftIcon className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
    </button>
  );
}

function PanelLeftIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
    </svg>
  );
}
