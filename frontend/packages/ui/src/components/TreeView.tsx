'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '../lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TreeNode {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  children?: TreeNode[];
  /** Arbitrary data attached to this node */
  data?: unknown;
}

interface TreeViewContextValue {
  selectedId: string | null;
  expandedIds: Set<string>;
  onSelect: (id: string, node: TreeNode) => void;
  onToggle: (id: string) => void;
  multiSelect: boolean;
}

const TreeViewContext = createContext<TreeViewContextValue | null>(null);

function useTreeView() {
  const ctx = useContext(TreeViewContext);
  if (!ctx) throw new Error('TreeView children must be used inside <TreeView>');
  return ctx;
}

// ---------------------------------------------------------------------------
// TreeView root
// ---------------------------------------------------------------------------

export interface TreeViewProps {
  nodes: TreeNode[];
  /** Initially expanded node IDs */
  defaultExpanded?: string[];
  /** Controlled selected node ID */
  selectedId?: string | null;
  /** Called when a node is clicked */
  onSelect?: (id: string, node: TreeNode) => void;
  className?: string;
  /** Indent in pixels per level (default: 16) */
  indent?: number;
}

export function TreeView({
  nodes,
  defaultExpanded = [],
  selectedId: controlledSelectedId,
  onSelect,
  className,
  indent = 16,
}: TreeViewProps) {
  const [internalSelected, setInternalSelected] = useState<string | null>(null);
  const [expandedIds, setExpandedIds]           = useState<Set<string>>(new Set(defaultExpanded));

  const selectedId = controlledSelectedId !== undefined ? controlledSelectedId : internalSelected;

  const handleSelect = useCallback((id: string, node: TreeNode) => {
    setInternalSelected(id);
    onSelect?.(id, node);
  }, [onSelect]);

  const handleToggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  return (
    <TreeViewContext.Provider value={{
      selectedId: selectedId ?? null,
      expandedIds,
      onSelect: handleSelect,
      onToggle: handleToggle,
      multiSelect: false,
    }}>
      <ul
        role="tree"
        aria-label="Tree view"
        className={cn('space-y-0.5 text-sm', className)}
      >
        {nodes.map((node) => (
          <TreeViewItem key={node.id} node={node} depth={0} indent={indent} />
        ))}
      </ul>
    </TreeViewContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// TreeViewItem (recursive)
// ---------------------------------------------------------------------------

interface TreeViewItemProps {
  node: TreeNode;
  depth: number;
  indent: number;
}

function TreeViewItem({ node, depth, indent }: TreeViewItemProps) {
  const { selectedId, expandedIds, onSelect, onToggle } = useTreeView();
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded  = expandedIds.has(node.id);
  const isSelected  = selectedId === node.id;

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (hasChildren) onToggle(node.id);
    onSelect(node.id, node);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e as unknown as React.MouseEvent);
    }
    if (e.key === 'ArrowRight' && hasChildren && !isExpanded) onToggle(node.id);
    if (e.key === 'ArrowLeft' && hasChildren && isExpanded)   onToggle(node.id);
  }

  return (
    <li role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined} aria-selected={isSelected}>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        style={{ paddingLeft: `${depth * indent + 8}px` }}
        className={cn(
          'flex items-center gap-2 h-8 pr-2 rounded-[var(--radius-sm)] cursor-pointer select-none',
          'text-[var(--color-foreground)] transition-colors',
          'hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]',
          isSelected && 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)] font-medium',
        )}
      >
        {/* Expand/collapse chevron */}
        <span className="h-4 w-4 shrink-0 flex items-center justify-center">
          {hasChildren ? (
            <ChevronIcon className={cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-90')} />
          ) : (
            <span className="h-3.5 w-3.5" />
          )}
        </span>

        {/* Optional icon */}
        {node.icon && (
          <span className="h-4 w-4 shrink-0 flex items-center justify-center text-[var(--color-muted-foreground)]">
            {node.icon}
          </span>
        )}

        {/* Label */}
        <span className="flex-1 truncate text-sm">{node.label}</span>

        {/* Optional badge */}
        {node.badge && <span>{node.badge}</span>}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <ul role="group">
          {node.children!.map((child) => (
            <TreeViewItem key={child.id} node={child} depth={depth + 1} indent={indent} />
          ))}
        </ul>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Icon
// ---------------------------------------------------------------------------

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
