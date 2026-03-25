'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from '../lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  group?: string;
  /** Called when item is selected */
  onSelect?: () => void;
  /** If true, item is disabled and not selectable */
  disabled?: boolean;
  /** Keywords for fuzzy search (in addition to label) */
  keywords?: string[];
}

// ---------------------------------------------------------------------------
// Context (for controlled open state from anywhere)
// ---------------------------------------------------------------------------

interface CommandPaletteContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error('useCommandPalette must be used inside <CommandPaletteProvider>');
  return ctx;
}

// ---------------------------------------------------------------------------
// CommandPaletteProvider
// ---------------------------------------------------------------------------

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// CommandPalette
// ---------------------------------------------------------------------------

export interface CommandPaletteProps {
  items: CommandItem[];
  /** Controlled open state */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  placeholder?: string;
  /** Keyboard shortcut to open (default: Cmd/Ctrl+K) */
  hotkey?: string;
  /** Optional extra footer content */
  footer?: React.ReactNode;
  className?: string;
}

function fuzzyMatch(text: string, query: string): boolean {
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (!q) return true;
  let ti = 0;
  for (let qi = 0; qi < q.length; qi++) {
    while (ti < t.length && t[ti] !== q[qi]) ti++;
    if (ti === t.length) return false;
    ti++;
  }
  return true;
}

export function CommandPalette({
  items,
  open: controlledOpen,
  onOpenChange,
  placeholder = 'Type a command or search...',
  footer,
  className,
}: CommandPaletteProps) {
  const ctx                   = useContext(CommandPaletteContext);
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery]     = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef              = useRef<HTMLInputElement>(null);
  const listRef               = useRef<HTMLDivElement>(null);

  const isOpen = controlledOpen !== undefined ? controlledOpen : (ctx ? ctx.open : internalOpen);
  const setIsOpen = useCallback((v: boolean) => {
    if (controlledOpen !== undefined) { onOpenChange?.(v); return; }
    if (ctx) { ctx.setOpen(v); } else { setInternalOpen(v); }
    onOpenChange?.(v);
  }, [controlledOpen, onOpenChange, ctx]);

  // Global hotkey (Cmd/Ctrl+K)
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, setIsOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  // Filtered items grouped
  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (!query) return true;
      const searchable = [item.label, item.description ?? '', ...(item.keywords ?? [])].join(' ');
      return fuzzyMatch(searchable, query);
    });
  }, [items, query]);

  const groups = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of filtered) {
      const g = item.group ?? '';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(item);
    }
    return map;
  }, [filtered]);

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    const enabled = filtered.filter((i) => !i.disabled);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % enabled.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + enabled.length) % enabled.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = enabled[activeIdx];
      if (item) { item.onSelect?.(); setIsOpen(false); }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  if (!isOpen) return null;

  // Flat enabled items for index tracking
  const enabledItems = filtered.filter((i) => !i.disabled);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Palette */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className={cn(
          'fixed top-[20%] left-1/2 z-[101] -translate-x-1/2',
          'w-full max-w-lg',
          'rounded-[var(--radius-lg)] shadow-2xl',
          'bg-[var(--color-card)] border border-[var(--color-border)]',
          'overflow-hidden',
          className,
        )}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-[var(--color-border)]">
          <SearchIcon />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
            placeholder={placeholder}
            aria-autocomplete="list"
            className={cn(
              'flex-1 bg-transparent py-4 text-sm text-[var(--color-foreground)]',
              'placeholder:text-[var(--color-muted-foreground)]',
              'outline-none border-none ring-0',
            )}
          />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-[var(--color-border)] bg-[var(--color-muted)] px-1.5 text-[10px] font-mono text-[var(--color-muted-foreground)]">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-80 overflow-y-auto py-2"
          role="listbox"
        >
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">
              No commands found.
            </p>
          )}

          {Array.from(groups.entries()).map(([group, groupItems]) => (
            <div key={group} role="group" aria-label={group || undefined}>
              {group && (
                <p className="px-4 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                  {group}
                </p>
              )}
              {groupItems.map((item) => {
                const globalIdx = enabledItems.findIndex((i) => i.id === item.id);
                const isActive  = !item.disabled && globalIdx === activeIdx;
                return (
                  <div
                    key={item.id}
                    role="option"
                    aria-selected={isActive}
                    aria-disabled={item.disabled}
                    onClick={() => {
                      if (item.disabled) return;
                      item.onSelect?.();
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => {
                      if (!item.disabled) setActiveIdx(globalIdx);
                    }}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 cursor-pointer select-none',
                      'text-sm text-[var(--color-foreground)]',
                      'transition-colors',
                      isActive && 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]',
                      item.disabled && 'opacity-40 cursor-not-allowed',
                    )}
                  >
                    {item.icon && (
                      <span className="h-4 w-4 shrink-0 flex items-center justify-center text-[var(--color-muted-foreground)]">
                        {item.icon}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="truncate">{item.label}</span>
                      {item.description && (
                        <span className="ml-2 text-[0.75rem] text-[var(--color-muted-foreground)] truncate">
                          {item.description}
                        </span>
                      )}
                    </div>
                    {item.shortcut && (
                      <kbd className="ml-auto hidden sm:inline-flex h-5 shrink-0 items-center gap-1 rounded border border-[var(--color-border)] bg-[var(--color-muted)] px-1.5 text-[10px] font-mono text-[var(--color-muted-foreground)]">
                        {item.shortcut}
                      </kbd>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-[var(--color-border)] px-4 py-2 text-xs text-[var(--color-muted-foreground)]">
            {footer}
          </div>
        )}
        {!footer && (
          <div className="border-t border-[var(--color-border)] px-4 py-2 flex items-center gap-4 text-[0.7rem] text-[var(--color-muted-foreground)]">
            <span><kbd className="font-mono">↑↓</kbd> navigate</span>
            <span><kbd className="font-mono">↵</kbd> select</span>
            <span><kbd className="font-mono">Esc</kbd> close</span>
          </div>
        )}
      </div>
    </>
  );
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]"
      xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  );
}
