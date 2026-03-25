'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { cn } from '../lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToastVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;      // ms, 0 = persistent
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastInstance extends ToastOptions {
  id: string;
  exiting: boolean;
}

// ---------------------------------------------------------------------------
// Toast variants
// ---------------------------------------------------------------------------

export const toastVariants = cva(
  [
    'flex w-full items-start gap-3 rounded-[var(--radius-md)] p-4 shadow-lg',
    'border transition-all duration-300',
    'text-sm font-medium',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-[var(--color-card)] border-[var(--color-border)]',
          'text-[var(--color-card-foreground)]',
        ],
        success: [
          'bg-[var(--color-card)] border-[rgba(52,211,153,0.4)]',
          'text-[var(--color-card-foreground)]',
        ],
        warning: [
          'bg-[var(--color-card)] border-[rgba(255,181,155,0.4)]',
          'text-[var(--color-card-foreground)]',
        ],
        error: [
          'bg-[var(--color-card)] border-[var(--color-destructive)]',
          'text-[var(--color-card-foreground)]',
        ],
        info: [
          'bg-[var(--color-card)] border-[var(--color-ring)]',
          'text-[var(--color-card-foreground)]',
        ],
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

// ---------------------------------------------------------------------------
// Icon per variant
// ---------------------------------------------------------------------------

const VARIANT_ICONS: Record<ToastVariant, React.ReactNode> = {
  default: null,
  success: (
    <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="rgba(52,211,153,1)" strokeWidth="2.5" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  warning: (
    <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="rgb(255,181,155)" strokeWidth="2.5" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  error: (
    <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="var(--color-destructive)" strokeWidth="2.5" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  info: (
    <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="var(--color-ring)" strokeWidth="2.5" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface ToastContextValue {
  toast: (opts: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

// ---------------------------------------------------------------------------
// ToastProvider
// ---------------------------------------------------------------------------

export interface ToastProviderProps {
  children: React.ReactNode;
  /** Maximum number of toasts shown at once (default: 5) */
  maxToasts?: number;
  /** Position of the toast stack */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

let counter = 0;

export function ToastProvider({ children, maxToasts = 5, position = 'bottom-right' }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastInstance[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    );
    // Remove after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  const toast = useCallback((opts: ToastOptions): string => {
    counter++;
    const id = `toast-${counter}`;
    const duration = opts.duration ?? 4000;

    setToasts((prev) => {
      const next = [...prev, { ...opts, id, exiting: false }];
      return next.slice(-maxToasts);
    });

    if (duration > 0) {
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    }
    return id;
  }, [dismiss, maxToasts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { timers.current.forEach((t) => clearTimeout(t)); };
  }, []);

  const positionClasses: Record<string, string> = {
    'top-right':    'top-4 right-4 items-end',
    'top-left':     'top-4 left-4 items-start',
    'bottom-right': 'bottom-4 right-4 items-end',
    'bottom-left':  'bottom-4 left-4 items-start',
    'top-center':   'top-4 left-1/2 -translate-x-1/2 items-center',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
  };

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}

      {/* Portal-style fixed container */}
      <div
        className={cn('fixed z-[200] flex flex-col gap-2 pointer-events-none w-full max-w-sm', positionClasses[position])}
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto w-full"
            style={{
              opacity: t.exiting ? 0 : 1,
              transform: t.exiting ? 'translateX(100%)' : 'translateX(0)',
              transition: 'opacity 0.3s, transform 0.3s',
            }}
          >
            <ToastItem toast={t} onDismiss={() => dismiss(t.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// ToastItem
// ---------------------------------------------------------------------------

function ToastItem({ toast: t, onDismiss }: { toast: ToastInstance; onDismiss: () => void }) {
  const variant = t.variant ?? 'default';
  const icon    = VARIANT_ICONS[variant];

  return (
    <div
      role="alert"
      className={cn(toastVariants({ variant }))}
    >
      {/* Icon */}
      {icon && <div className="mt-0.5">{icon}</div>}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold leading-snug">{t.title}</p>
        {t.description && (
          <p className="mt-0.5 text-[0.8rem] text-[var(--color-muted-foreground)] leading-snug">
            {t.description}
          </p>
        )}
        {t.action && (
          <button
            onClick={t.action.onClick}
            className="mt-2 text-xs font-bold underline-offset-2 hover:underline text-[var(--color-primary)]"
          >
            {t.action.label}
          </button>
        )}
      </div>

      {/* Close */}
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className={cn(
          'shrink-0 h-6 w-6 flex items-center justify-center rounded',
          'text-[var(--color-muted-foreground)]',
          'hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]',
          'transition-colors',
        )}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Convenience component (imperative API)
// ---------------------------------------------------------------------------

/**
 * Standalone toast component — use inside ToastProvider.
 * Renders nothing; just receives props and fires a toast.
 */
export interface ToastProps extends ToastOptions {
  /** Trigger a toast imperatively when this ref is called */
  ref?: never;
}

// Re-export for ergonomics
export const Toast = ToastItem as unknown as React.FC<never>;
