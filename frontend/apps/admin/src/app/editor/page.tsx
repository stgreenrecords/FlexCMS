'use client';

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useDraggable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_FLEXCMS_API ?? 'http://localhost:8080';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Viewport = 'desktop' | 'tablet' | 'mobile';

interface ComponentDefinition {
  resourceType: string;
  name: string;
  title?: string;
  description?: string;
  group?: string;
  icon?: string;
  isContainer: boolean;
  dataSchema?: Record<string, unknown>;
}

interface ApiContentNode {
  id: string;
  name: string;
  path: string;
  resourceType: string;
  status: string;
  properties?: Record<string, unknown>;
  children?: ApiContentNode[];
  modifiedAt?: string;
  modifiedBy?: string;
}

interface PageComponent {
  instanceId: string;
  resourceType: string;
  nodePath?: string;    // ltree path (set when loaded from API)
  label: string;
  props: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Schema-driven form field type
// ---------------------------------------------------------------------------

interface PropField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'toggle' | 'select' | 'textarea';
  options?: string[];
  description?: string;
  required?: boolean;
}

// ---------------------------------------------------------------------------
// JSON Schema → PropField[] converter
// ---------------------------------------------------------------------------

function schemaToFields(schema: Record<string, unknown> | undefined): PropField[] {
  if (!schema) return [];
  const properties = (schema['properties'] as Record<string, Record<string, unknown>>) ?? {};
  const required = (schema['required'] as string[]) ?? [];
  return Object.entries(properties)
    .filter(([key]) => !key.startsWith('_') && key !== 'children')
    .map(([key, propDef]) => {
      const title = String(propDef['title'] ?? labelFromKey(key));
      const description = propDef['description'] as string | undefined;
      const type = propDef['type'] as string | undefined;
      const enumValues = propDef['enum'] as string[] | undefined;
      const format = propDef['format'] as string | undefined;

      let fieldType: PropField['type'] = 'text';
      if (enumValues?.length) {
        fieldType = 'select';
      } else if (type === 'boolean') {
        fieldType = 'toggle';
      } else if (type === 'number' || type === 'integer') {
        fieldType = 'number';
      } else if (type === 'string' && (format === 'textarea' || key.toLowerCase().includes('description') || key.toLowerCase().includes('content') || key.toLowerCase().includes('body'))) {
        fieldType = 'textarea';
      }

      return {
        key,
        label: title,
        type: fieldType,
        options: enumValues,
        description,
        required: required.includes(key),
      };
    });
}

/** Convert camelCase / snake_case key to readable label */
function labelFromKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

// ---------------------------------------------------------------------------
// Map API node → PageComponent
// ---------------------------------------------------------------------------

let instanceCounter = 0;

function nodeToPageComponent(node: ApiContentNode, defs: ComponentDefinition[]): PageComponent {
  instanceCounter++;
  const def = defs.find((d) => d.resourceType === node.resourceType);
  return {
    instanceId: `inst-${instanceCounter}`,
    resourceType: node.resourceType,
    nodePath: node.path,
    label: def?.title ?? node.name,
    props: node.properties ?? {},
  };
}

// ---------------------------------------------------------------------------
// Palette item (derived from registry)
// ---------------------------------------------------------------------------

interface PaletteItem {
  resourceType: string;
  label: string;
  group: string;
  defaultProps: Record<string, unknown>;
}

function registryToPalette(defs: ComponentDefinition[]): PaletteItem[] {
  return defs.map((def) => {
    const schema = def.dataSchema;
    const properties = schema ? (schema['properties'] as Record<string, Record<string, unknown>>) ?? {} : {};
    const defaults: Record<string, unknown> = {};
    for (const [key, propDef] of Object.entries(properties)) {
      if (propDef['default'] !== undefined) defaults[key] = propDef['default'];
    }
    return {
      resourceType: def.resourceType,
      label: def.title ?? def.name,
      group: def.group ?? 'General',
      defaultProps: defaults,
    };
  });
}

// ---------------------------------------------------------------------------
// Page component (entry point with Suspense boundary)
// ---------------------------------------------------------------------------

export default function VisualPageEditorPage() {
  return (
    <Suspense
      fallback={
        <div style={{ background: '#131313', color: '#8d90a0', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter, sans-serif' }}>
          Loading editor…
        </div>
      }
    >
      <EditorInner />
    </Suspense>
  );
}

// ---------------------------------------------------------------------------
// EditorInner — main editor shell
// ---------------------------------------------------------------------------

function EditorInner() {
  const searchParams = useSearchParams();
  // ?path=/content/mysite/en/homepage  (URL-style path passed from content tree)
  const contentPath = searchParams.get('path') ?? '';
  const pageName = contentPath ? contentPath.split('/').filter(Boolean).pop() ?? contentPath : 'Untitled Page';

  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [registry, setRegistry] = useState<ComponentDefinition[]>([]);
  const [palette, setPalette] = useState<PaletteItem[]>([]);
  const [components, setComponents] = useState<PageComponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<'components' | 'layers' | 'assets'>('components');
  const [savedAt, setSavedAt] = useState<string>('—');
  const [isDraft, setIsDraft] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // dnd-kit drag state
  const [activeDrag, setActiveDrag] = useState<{ type: 'canvas'; component: PageComponent } | { type: 'palette'; item: PaletteItem } | null>(null);
  // Insert-preview index: which canvas slot the palette item will land in
  const [insertPreviewIdx, setInsertPreviewIdx] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  // ── Fetch registry + page on mount ────────────────────────────────────────

  useEffect(() => {
    const registryUrl = `${API_BASE}/api/content/v1/component-registry`;
    const pageUrl = contentPath
      ? `${API_BASE}/api/author/content/page?path=${encodeURIComponent(contentPath)}`
      : null;

    const fetchRegistry = fetch(registryUrl)
      .then((r) => (r.ok ? r.json() : Promise.reject(`Registry ${r.status}`)))
      .catch(() => ({ components: [] }));

    const fetchPage = pageUrl
      ? fetch(pageUrl).then((r) => (r.ok ? r.json() : Promise.reject(`Page ${r.status}`))).catch(() => null)
      : Promise.resolve(null);

    Promise.all([fetchRegistry, fetchPage]).then(([reg, page]) => {
      const defs: ComponentDefinition[] = reg.components ?? [];
      setRegistry(defs);
      setPalette(registryToPalette(defs));

      if (page) {
        const pageNode = page as ApiContentNode;
        setIsDraft(pageNode.status !== 'PUBLISHED');
        const pageComps = (pageNode.children ?? []).map((child: ApiContentNode) =>
          nodeToPageComponent(child, defs),
        );
        setComponents(pageComps);
        if (pageComps.length > 0) setSelectedId(pageComps[0].instanceId);
      }
      setIsLoading(false);
    }).catch((err) => {
      setLoadError(String(err));
      setIsLoading(false);
    });
  }, [contentPath]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const selectedComponent = components.find((c) => c.instanceId === selectedId) ?? null;
  const selectedDef = selectedComponent
    ? registry.find((d) => d.resourceType === selectedComponent.resourceType)
    : null;
  const selectedSchema = schemaToFields(selectedDef?.dataSchema);

  // Group palette by group
  const paletteGroups = palette.reduce<Record<string, PaletteItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  // ── Actions ───────────────────────────────────────────────────────────────

  function addComponent(item: PaletteItem) {
    instanceCounter++;
    const newComp: PageComponent = {
      instanceId: `inst-${instanceCounter}`,
      resourceType: item.resourceType,
      label: item.label,
      props: { ...item.defaultProps },
    };
    setComponents((prev) => [...prev, newComp]);
    setSelectedId(newComp.instanceId);
  }

  function addComponentAtIndex(item: PaletteItem, idx: number) {
    instanceCounter++;
    const newComp: PageComponent = {
      instanceId: `inst-${instanceCounter}`,
      resourceType: item.resourceType,
      label: item.label,
      props: { ...item.defaultProps },
    };
    setComponents((prev) => {
      const clamped = Math.max(0, Math.min(idx, prev.length));
      return [...prev.slice(0, clamped), newComp, ...prev.slice(clamped)];
    });
    setSelectedId(newComp.instanceId);
  }

  // ── dnd-kit handlers ──────────────────────────────────────────────────────

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const id = String(active.id);
    if (id.startsWith('palette:')) {
      // Use data passed via useDraggable's data option
      const item = (active.data.current as { item?: PaletteItem } | undefined)?.item;
      if (item) setActiveDrag({ type: 'palette', item });
    } else {
      const comp = components.find((c) => c.instanceId === id);
      if (comp) setActiveDrag({ type: 'canvas', component: comp });
    }
    setInsertPreviewIdx(null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event;
    if (!over || activeDrag?.type !== 'palette') return;
    const overId = String(over.id);
    // over a canvas item → preview insert before it
    const idx = components.findIndex((c) => c.instanceId === overId);
    setInsertPreviewIdx(idx >= 0 ? idx : components.length);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const activeId = String(active.id);

    try {
      if (activeDrag?.type === 'palette') {
        // Drop from palette
        const item = activeDrag.item;
        const overIdx = over
          ? components.findIndex((c) => c.instanceId === String(over.id))
          : -1;
        addComponentAtIndex(item, overIdx >= 0 ? overIdx : components.length);
      } else if (activeDrag?.type === 'canvas') {
        // Reorder within canvas
        if (over && activeId !== String(over.id)) {
          setComponents((prev) => {
            const oldIdx = prev.findIndex((c) => c.instanceId === activeId);
            const newIdx = prev.findIndex((c) => c.instanceId === String(over.id));
            return arrayMove(prev, oldIdx, newIdx);
          });
        }
      }
    } finally {
      setActiveDrag(null);
      setInsertPreviewIdx(null);
    }
  }

  function deleteComponent(instanceId: string) {
    setComponents((prev) => prev.filter((c) => c.instanceId !== instanceId));
    if (selectedId === instanceId) setSelectedId(null);
  }

  function duplicateComponent(instanceId: string) {
    const src = components.find((c) => c.instanceId === instanceId);
    if (!src) return;
    instanceCounter++;
    const dup: PageComponent = {
      ...src,
      instanceId: `inst-${instanceCounter}`,
      nodePath: undefined, // duplicate is unsaved
      props: { ...src.props },
    };
    const idx = components.findIndex((c) => c.instanceId === instanceId);
    setComponents((prev) => [...prev.slice(0, idx + 1), dup, ...prev.slice(idx + 1)]);
    setSelectedId(dup.instanceId);
  }

  const updateProp = useCallback((key: string, value: unknown) => {
    setComponents((prev) =>
      prev.map((c) =>
        c.instanceId === selectedId ? { ...c, props: { ...c.props, [key]: value } } : c,
      ),
    );
  }, [selectedId]);

  async function handleSave() {
    if (isSaving) return;
    // Save all components that have a nodePath (i.e., loaded from API)
    const unsavedComps = components.filter((c) => c.nodePath);
    if (unsavedComps.length === 0) {
      setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      return;
    }
    setIsSaving(true);
    try {
      await Promise.all(
        unsavedComps.map((comp) =>
          fetch(`${API_BASE}/api/author/content/node/properties`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: comp.nodePath, properties: comp.props, userId: 'admin' }),
          }),
        ),
      );
      setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePublish() {
    if (isSaving || !contentPath) return;
    setIsSaving(true);
    try {
      const ltreePath = contentPath.replace(/^\//, '').replace(/\//g, '.');
      const url = `${API_BASE}/api/author/content/node/status?path=${encodeURIComponent(ltreePath)}&status=PUBLISHED&userId=admin`;
      const res = await fetch(url, { method: 'POST' });
      if (res.ok) {
        setIsDraft(false);
        setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } finally {
      setIsSaving(false);
    }
  }

  function resetToDefaults() {
    if (!selectedComponent) return;
    const item = palette.find((p) => p.resourceType === selectedComponent.resourceType);
    if (!item) return;
    setComponents((prev) =>
      prev.map((c) =>
        c.instanceId === selectedId ? { ...c, props: { ...item.defaultProps } } : c,
      ),
    );
  }

  const canvasWidth = viewport === 'desktop' ? '100%' : viewport === 'tablet' ? '768px' : '390px';

  // ── Loading / error states ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div style={{ background: '#131313', color: '#8d90a0', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter, sans-serif', flexDirection: 'column', gap: 12 }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b0c6ff" strokeWidth="2" aria-hidden="true" style={{ animation: 'spin 1s linear infinite' }}>
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        <span>Loading editor…</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ background: '#131313', color: '#ffb4ab', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter, sans-serif', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 14 }}>Failed to load editor: {loadError}</span>
        <a href="/content" style={{ color: '#b0c6ff', fontSize: 13 }}>← Back to Content</a>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: '#131313', color: '#e5e2e1', fontFamily: 'Inter, sans-serif' }}
    >
      {/* ────────────────────────────────────────────────────────────────────
          Top navigation bar
      ──────────────────────────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-6"
        style={{
          height: 56,
          flexShrink: 0,
          background: 'rgba(19,19,19,0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(66,70,84,0.15)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        {/* Left: logo + viewport toggles */}
        <div className="flex items-center gap-8">
          <a href="/content" className="text-xl font-black tracking-tighter" style={{ color: '#b0c6ff' }}>
            FlexCMS
          </a>
          <nav className="flex items-center gap-1">
            {(['desktop', 'tablet', 'mobile'] as Viewport[]).map((v) => (
              <button
                key={v}
                onClick={() => setViewport(v)}
                className="px-3 py-1 rounded text-sm font-medium transition-colors capitalize"
                style={{
                  color: viewport === v ? '#b0c6ff' : '#c3c6d6',
                  borderBottom: viewport === v ? '2px solid #b0c6ff' : '2px solid transparent',
                }}
              >
                {v}
              </button>
            ))}
          </nav>
        </div>

        {/* Center: page name */}
        {contentPath && (
          <div className="flex flex-col items-center justify-center absolute left-1/2 -translate-x-1/2">
            <span className="text-sm font-bold" style={{ color: '#e5e2e1', lineHeight: 1.2 }}>
              {pageName}
            </span>
            <span className="text-[0.65rem] font-mono mt-0.5" style={{ color: '#8d90a0' }}>
              {contentPath}
            </span>
          </div>
        )}

        {/* Right: actions */}
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-1 px-3 py-1 rounded-lg"
            style={{ background: '#2a2a2a', border: '1px solid rgba(66,70,84,0.15)' }}
          >
            <IconButton title="Undo"><UndoIcon /></IconButton>
            <IconButton title="Redo"><RedoIcon /></IconButton>
            <div style={{ width: 1, height: 16, background: 'rgba(66,70,84,0.4)', margin: '0 4px' }} />
            <IconButton title="Preview" onClick={() => contentPath && window.open(`/preview?path=${encodeURIComponent(contentPath)}&mode=draft`, '_blank')}>
              <EyeIcon />
            </IconButton>
            <IconButton title="Settings"><GearIcon /></IconButton>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 rounded-lg text-sm font-bold transition-all"
            style={{ color: '#e5e2e1', background: 'transparent', opacity: isSaving ? 0.6 : 1 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={handlePublish}
            disabled={isSaving}
            className="px-5 py-1.5 rounded-lg text-sm font-bold transition-all"
            style={{
              background: 'linear-gradient(135deg, #b0c6ff 0%, #0058cc 100%)',
              color: '#002d6f',
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            Publish
          </button>
        </div>
      </header>

      {/* ────────────────────────────────────────────────────────────────────
          Main editor: left panel + canvas + right panel
      ──────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left panel: Component palette ── */}
        <aside
          className="flex flex-col shrink-0"
          style={{ width: 256, background: '#1c1b1b', borderRight: '1px solid rgba(66,70,84,0.15)', overflow: 'hidden' }}
        >
          <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(66,70,84,0.1)' }}>
            <div>
              <h2 className="text-sm font-bold" style={{ color: '#fff' }}>Editor</h2>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: '#8d90a0' }}>v2.4.0</p>
            </div>
            <ComponentsIcon />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Tab switcher */}
            <div className="flex flex-col gap-1">
              {([
                { id: 'components', label: 'Components', icon: <ComponentsIcon /> },
                { id: 'layers',     label: 'Layers',     icon: <LayersIcon /> },
                { id: 'assets',     label: 'Assets',     icon: <ImageIconSm /> },
              ] as const).map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => setLeftTab(id)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left"
                  style={leftTab === id ? { background: '#324575', color: '#b0c6ff' } : { color: '#c3c6d6' }}
                  onMouseEnter={(e) => { if (leftTab !== id) (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a'; }}
                  onMouseLeave={(e) => { if (leftTab !== id) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  <span className="shrink-0">{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            {/* Components tab */}
            {leftTab === 'components' && (
              <>
                {palette.length === 0 ? (
                  <p className="text-xs px-3" style={{ color: '#8d90a0' }}>No components registered.</p>
                ) : (
                  Object.entries(paletteGroups).map(([group, items]) => (
                    <div key={group}>
                      <p className="text-[11px] font-bold uppercase tracking-wider mb-3 px-3" style={{ color: '#8d90a0' }}>
                        {group}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {items.map((item) => (
                          <DraggablePaletteItem
                            key={item.resourceType}
                            item={item}
                            onAdd={() => addComponent(item)}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* Layers tab */}
            {leftTab === 'layers' && (
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider mb-3 px-3" style={{ color: '#8d90a0' }}>
                  Page Layers
                </p>
                {components.map((c, idx) => (
                  <button
                    key={c.instanceId}
                    onClick={() => setSelectedId(c.instanceId)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors"
                    style={selectedId === c.instanceId ? { background: '#2a3a5e', color: '#b0c6ff' } : { color: '#c3c6d6' }}
                  >
                    <span style={{ color: '#8d90a0', fontSize: 11 }}>{idx + 1}</span>
                    <span className="shrink-0"><BlockIcon /></span>
                    <span className="truncate">{c.label}</span>
                  </button>
                ))}
                {components.length === 0 && (
                  <p className="text-xs px-3" style={{ color: '#8d90a0' }}>No layers yet.</p>
                )}
              </div>
            )}

            {/* Assets tab */}
            {leftTab === 'assets' && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider mb-3 px-3" style={{ color: '#8d90a0' }}>
                  Assets
                </p>
                <p className="text-xs px-3" style={{ color: '#8d90a0' }}>
                  Open the{' '}
                  <a href="/dam" style={{ color: '#b0c6ff' }}>DAM browser</a>{' '}
                  to manage assets.
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* ── Center: Canvas ── */}
        <section
          className="flex-1 overflow-y-auto flex flex-col items-center p-8"
          style={{ background: '#201f1f' }}
          onClick={() => setSelectedId(null)}
        >
          <div
            style={{
              width: canvasWidth,
              maxWidth: '100%',
              minHeight: 1200,
              background: '#131313',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              transition: 'width 0.3s ease',
            }}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={components.map((c) => c.instanceId)}
                strategy={verticalListSortingStrategy}
              >
                {/* Insert-preview drop hint at the top */}
                {activeDrag?.type === 'palette' && insertPreviewIdx === 0 && (
                  <InsertPreview />
                )}

                {components.map((comp, idx) => (
                  <React.Fragment key={comp.instanceId}>
                    <SortableCanvasItem
                      component={comp}
                      isSelected={selectedId === comp.instanceId}
                      isDragging={activeDrag?.type === 'canvas' && activeDrag.component.instanceId === comp.instanceId}
                      onClick={(e) => { e.stopPropagation(); setSelectedId(comp.instanceId); }}
                      onDelete={() => deleteComponent(comp.instanceId)}
                      onDuplicate={() => duplicateComponent(comp.instanceId)}
                      onMoveUp={() => {
                        if (idx === 0) return;
                        setComponents((prev) => arrayMove(prev, idx, idx - 1));
                      }}
                      onMoveDown={() => {
                        if (idx === components.length - 1) return;
                        setComponents((prev) => arrayMove(prev, idx, idx + 1));
                      }}
                    />
                    {/* Insert-preview between items when dragging from palette */}
                    {activeDrag?.type === 'palette' && insertPreviewIdx === idx + 1 && (
                      <InsertPreview />
                    )}
                  </React.Fragment>
                ))}
              </SortableContext>

              {/* Default drop hint at the bottom when no specific preview */}
              {activeDrag?.type === 'palette' && insertPreviewIdx === null && (
                <InsertPreview />
              )}

              {components.length === 0 && !activeDrag && (
                <div className="flex flex-col items-center justify-center gap-4 py-32" style={{ color: '#8d90a0' }}>
                  <PlusIcon />
                  <p className="text-sm">Select a component from the left panel to start building</p>
                </div>
              )}

              {/* Drag overlay — floating "ghost" while dragging */}
              <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
                {activeDrag?.type === 'canvas' && (
                  <div
                    style={{
                      border: '2px solid #b0c6ff',
                      borderRadius: 4,
                      boxShadow: '0 8px 32px rgba(176,198,255,0.15)',
                      opacity: 0.85,
                      pointerEvents: 'none',
                    }}
                  >
                    <ComponentPreview component={activeDrag.component} />
                  </div>
                )}
                {activeDrag?.type === 'palette' && (
                  <div
                    className="flex flex-col items-center justify-center p-3 rounded-lg"
                    style={{
                      width: 110,
                      background: '#324575',
                      border: '1px solid rgba(176,198,255,0.5)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                      opacity: 0.95,
                    }}
                  >
                    <span className="mb-2" style={{ color: '#b0c6ff' }}><BlockIcon /></span>
                    <span className="text-[11px] text-center leading-tight font-semibold" style={{ color: '#b0c6ff' }}>
                      {activeDrag.item.label}
                    </span>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          </div>
        </section>

        {/* ── Right panel: Properties ── */}
        <aside
          className="flex flex-col shrink-0"
          style={{ width: 320, background: '#1c1b1b', borderLeft: '1px solid rgba(66,70,84,0.15)' }}
        >
          <div className="p-4" style={{ borderBottom: '1px solid rgba(66,70,84,0.1)' }}>
            <div className="flex items-center gap-2 mb-1">
              <TuneIcon />
              <h3 className="text-sm font-bold" style={{ color: '#fff' }}>Properties</h3>
            </div>
            <p className="text-[11px]" style={{ color: '#8d90a0' }}>
              {selectedComponent
                ? `${selectedComponent.label} (${selectedComponent.resourceType})`
                : 'Select a component to edit'}
            </p>
          </div>

          {selectedComponent ? (
            <>
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {selectedSchema.length === 0 ? (
                  <p className="text-xs" style={{ color: '#8d90a0' }}>
                    No editable properties for this component.
                  </p>
                ) : (
                  selectedSchema.map((field) => (
                    <PropertyField
                      key={field.key}
                      field={field}
                      value={selectedComponent.props[field.key]}
                      onChange={(val) => updateProp(field.key, val)}
                    />
                  ))
                )}
              </div>

              <div className="p-4" style={{ borderTop: '1px solid rgba(66,70,84,0.1)' }}>
                <button
                  onClick={resetToDefaults}
                  className="w-full py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all"
                  style={{ background: '#2a2a2a', color: '#8d90a0' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(176,198,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#b0c6ff'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a'; (e.currentTarget as HTMLButtonElement).style.color = '#8d90a0'; }}
                >
                  Reset to Defaults
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <p className="text-sm" style={{ color: '#8d90a0' }}>
                Click a component on the canvas to edit its properties.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* ────────────────────────────────────────────────────────────────────
          Footer status bar
      ──────────────────────────────────────────────────────────────────── */}
      <footer
        className="flex items-center justify-between px-4 shrink-0"
        style={{ height: 32, background: '#131313', borderTop: '1px solid rgba(66,70,84,0.15)', flexShrink: 0 }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: isDraft ? '#10b981' : '#b0c6ff',
                boxShadow: isDraft ? '0 0 8px rgba(16,185,129,0.5)' : '0 0 8px rgba(176,198,255,0.5)',
              }}
            />
            <span className="text-[11px] uppercase tracking-widest" style={{ color: '#c3c6d6' }}>
              {savedAt === '—' ? 'Not saved' : `Last saved ${savedAt}`}
            </span>
          </div>
          <div style={{ width: 1, height: 12, background: 'rgba(66,70,84,0.3)' }} />
          <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: '#b0c6ff' }}>
            {isDraft ? 'Draft Mode' : 'Published'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[11px] uppercase tracking-widest" style={{ color: '#c3c6d6' }}>
            {registry.length} Components Registered
          </span>
          <div style={{ width: 1, height: 12, background: 'rgba(66,70,84,0.3)' }} />
          <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: '#fff' }}>
            FlexCMS v3.0.4-core
          </span>
        </div>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// InsertPreview — visual indicator of where a palette item will be dropped
// ---------------------------------------------------------------------------

function InsertPreview() {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        height: 64,
        margin: '0 24px',
        border: '2px dashed rgba(176,198,255,0.6)',
        borderRadius: 12,
        background: 'rgba(176,198,255,0.05)',
      }}
    >
      <p className="text-xs font-medium flex items-center gap-2" style={{ color: '#b0c6ff' }}>
        <PlusIcon /> Drop component here
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DraggablePaletteItem — palette card that can be dragged onto the canvas
// ---------------------------------------------------------------------------

function DraggablePaletteItem({ item, onAdd }: { item: PaletteItem; onAdd: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${item.resourceType}`,
    data: { type: 'palette', item },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onAdd}
      className="flex flex-col items-center justify-center p-3 rounded-lg border transition-all cursor-grab select-none"
      style={{
        background: isDragging ? 'rgba(176,198,255,0.1)' : '#201f1f',
        border: isDragging ? '1px solid rgba(176,198,255,0.5)' : '1px solid rgba(66,70,84,0.2)',
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none',
      }}
      title={`Drag or click to add ${item.label}`}
    >
      <span className="mb-2" style={{ color: '#8d90a0' }}><BlockIcon /></span>
      <span className="text-[11px] text-center leading-tight" style={{ color: '#c3c6d6' }}>
        {item.label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SortableCanvasItem — wraps CanvasComponent with dnd-kit sortable behaviour
// ---------------------------------------------------------------------------

function SortableCanvasItem({
  component,
  isSelected,
  isDragging,
  onClick,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: {
  component: PageComponent;
  isSelected: boolean;
  isDragging: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: component.instanceId });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging || isDragging ? 0.35 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <CanvasComponent
        component={component}
        isSelected={isSelected}
        onClick={onClick}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// CanvasComponent — renders a component with selection overlay + drag handle
// ---------------------------------------------------------------------------

function CanvasComponent({
  component,
  isSelected,
  onClick,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  dragHandleProps,
}: {
  component: PageComponent;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  dragHandleProps?: Record<string, unknown>;
}) {
  return (
    <div
      onClick={onClick}
      className="relative group cursor-pointer transition-all"
      style={{
        border: isSelected ? '2px solid #b0c6ff' : '2px solid transparent',
        outline: isSelected ? '4px solid rgba(176,198,255,0.08)' : 'none',
      }}
    >
      {isSelected && (
        <div
          className="absolute flex items-center gap-3 px-3 py-1 rounded-t-lg text-[11px] font-bold"
          style={{ top: -36, left: -2, background: '#b0c6ff', color: '#002d6f', zIndex: 10 }}
        >
          {/* Drag handle — activates dnd-kit sortable */}
          <span
            {...(dragHandleProps as React.HTMLAttributes<HTMLSpanElement>)}
            title="Drag to reorder"
            style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: '#002d6f' }}
            onClick={(e) => e.stopPropagation()}
          >
            <DragHandleIcon />
          </span>
          <span>{component.label}</span>
          <div className="flex gap-2">
            <button title="Move up"   onClick={(e) => { e.stopPropagation(); onMoveUp(); }}   style={{ color: '#002d6f' }}><ArrowUpIcon /></button>
            <button title="Move down" onClick={(e) => { e.stopPropagation(); onMoveDown(); }} style={{ color: '#002d6f' }}><ArrowDownIcon /></button>
            <button title="Duplicate" onClick={(e) => { e.stopPropagation(); onDuplicate(); }} style={{ color: '#002d6f' }}><CopyIcon /></button>
            <button title="Delete"    onClick={(e) => { e.stopPropagation(); onDelete(); }}    style={{ color: '#002d6f' }}><TrashIcon /></button>
          </div>
        </div>
      )}
      {!isSelected && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ border: '1px solid rgba(176,198,255,0.3)' }}
        />
      )}
      <ComponentPreview component={component} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// ComponentPreview — renders a visual placeholder for each component
// ---------------------------------------------------------------------------

function ComponentPreview({ component }: { component: PageComponent }) {
  const { resourceType, label, props } = component;
  const type = resourceType.split('/').pop() ?? resourceType;

  // Hero / Banner types
  if (type.includes('hero') || type.includes('banner')) {
    const title = String(props['title'] ?? props['headlineTitle'] ?? props['headline'] ?? label);
    const subtitle = String(props['subtitle'] ?? props['description'] ?? props['subheadline'] ?? '');
    const cta = String(props['ctaLabel'] ?? props['cta'] ?? props['buttonLabel'] ?? 'Explore Now');
    return (
      <div
        className="relative overflow-hidden flex items-center"
        style={{
          minHeight: props['fullHeight'] ? 480 : 300,
          padding: `${props['paddingTop'] ?? 80}px 48px ${props['paddingBottom'] ?? 80}px`,
          background: 'linear-gradient(135deg, #131313 0%, #1c1b1b 100%)',
        }}
      >
        <div className="absolute top-0 right-0" style={{ width: 400, height: 400, background: 'radial-gradient(circle, rgba(176,198,255,0.08) 0%, transparent 70%)', borderRadius: '50%', transform: 'translate(30%, -30%)' }} />
        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest" style={{ background: 'rgba(176,198,255,0.1)', border: '1px solid rgba(176,198,255,0.2)', color: '#b0c6ff' }}>
            {label}
          </div>
          <h1 className="font-black tracking-tighter leading-none" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: '#fff' }}>{title}</h1>
          {subtitle && <p className="text-lg leading-relaxed" style={{ color: '#c3c6d6' }}>{subtitle}</p>}
          <button className="px-8 py-3 font-bold text-sm uppercase tracking-tighter" style={{ background: '#fff', color: '#131313' }}>{cta}</button>
        </div>
      </div>
    );
  }

  // Text / rich-text types
  if (type.includes('text') || type.includes('richtext') || type.includes('body')) {
    const content = String(props['content'] ?? props['text'] ?? props['body'] ?? '');
    const title = String(props['title'] ?? props['heading'] ?? '');
    return (
      <div className="px-12 py-16" style={{ background: '#131313' }}>
        <div className="max-w-2xl">
          {title && <h2 className="text-2xl font-bold mb-6" style={{ color: '#fff' }}>{title}</h2>}
          {content ? (
            content.split('\n').map((line, i) =>
              line.trim() === '' ? <br key={i} /> : <p key={i} className="leading-loose mb-4" style={{ color: '#c3c6d6' }}>{line}</p>,
            )
          ) : (
            <p style={{ color: '#424654' }}>Rich text content…</p>
          )}
        </div>
      </div>
    );
  }

  // Image types
  if (type.includes('image') || type.includes('photo') || type.includes('media')) {
    const src = String(props['src'] ?? props['imagePath'] ?? props['imageUrl'] ?? '');
    const alt = String(props['alt'] ?? props['altText'] ?? '');
    return (
      <div className="flex items-center justify-center" style={{ height: 200, background: '#2a2a2a', color: '#8d90a0' }}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="max-h-full object-cover w-full" />
        ) : (
          <div className="text-center">
            <ImageIconSm />
            <p className="text-xs mt-2">Image placeholder</p>
          </div>
        )}
      </div>
    );
  }

  // Grid / card types
  if (type.includes('grid') || type.includes('card') || type.includes('list')) {
    const cols = Number(props['columns'] ?? props['cols'] ?? 3);
    return (
      <div className="p-8" style={{ background: '#131313' }}>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="rounded-lg flex items-center justify-center text-xs" style={{ height: 120, background: '#1c1b1b', color: '#8d90a0', border: '1px dashed rgba(66,70,84,0.4)' }}>
              {label} {i + 1}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Navigation / header types
  if (type.includes('nav') || type.includes('header') || type.includes('footer')) {
    return (
      <div className="flex items-center justify-between px-12 py-4" style={{ background: '#0e0e0e', borderBottom: '1px solid rgba(66,70,84,0.2)' }}>
        <span className="font-bold" style={{ color: '#b0c6ff' }}>{String(props['siteName'] ?? props['title'] ?? 'Site Name')}</span>
        <div className="flex gap-6">
          {['Home', 'About', 'Products', 'Contact'].map((link) => (
            <span key={link} className="text-sm" style={{ color: '#c3c6d6' }}>{link}</span>
          ))}
        </div>
      </div>
    );
  }

  // Default: generic placeholder
  return (
    <div
      className="flex items-center justify-center gap-3 py-10"
      style={{ background: '#131313', color: '#424654', borderTop: '1px solid rgba(66,70,84,0.1)' }}
    >
      <BlockIcon />
      <div>
        <p className="text-sm font-bold" style={{ color: '#8d90a0' }}>{label}</p>
        <p className="text-[11px]" style={{ color: '#424654' }}>{resourceType}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PropertyField — renders a single form field driven by schema type
// ---------------------------------------------------------------------------

function PropertyField({ field, value, onChange }: {
  field: PropField;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid rgba(66,70,84,0.5)',
    color: '#fff',
    padding: '6px 0',
    fontSize: 13,
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
  };

  const labelEl = (
    <span className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: '#8d90a0' }}>
      {field.label}
      {field.required && <span style={{ color: '#ffb4ab', marginLeft: 4 }}>*</span>}
    </span>
  );

  if (field.type === 'toggle') {
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#8d90a0' }}>
          {field.label}
        </span>
        <button
          onClick={() => onChange(!value)}
          className="rounded-full relative transition-all"
          style={{ width: 40, height: 20, background: value ? '#b0c6ff' : '#424654' }}
        >
          <div
            className="absolute rounded-full transition-all"
            style={{ width: 12, height: 12, top: 4, left: value ? 24 : 4, background: value ? '#002d6f' : '#c3c6d6' }}
          />
        </button>
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <label className="block">
        {labelEl}
        <select
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            background: '#2a2a2a',
            border: 'none',
            borderRadius: 8,
            color: '#e5e2e1',
            padding: '8px 12px',
            fontSize: 13,
            outline: 'none',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <option value="">— select —</option>
          {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </label>
    );
  }

  if (field.type === 'number') {
    return (
      <label className="block">
        {labelEl}
        <input
          type="number"
          value={Number(value ?? 0)}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ ...inputStyle, borderRadius: 4, padding: '6px 8px' }}
        />
      </label>
    );
  }

  if (field.type === 'textarea') {
    return (
      <label className="block">
        {labelEl}
        <textarea
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          style={{
            ...inputStyle,
            borderBottom: 'none',
            border: '1px solid rgba(66,70,84,0.5)',
            borderRadius: 8,
            padding: '8px 12px',
            resize: 'vertical',
          }}
          onFocus={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = '#b0c6ff'; }}
          onBlur={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = 'rgba(66,70,84,0.5)'; }}
        />
      </label>
    );
  }

  // text (default)
  return (
    <label className="block">
      {labelEl}
      <input
        type="text"
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
        onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderBottomColor = '#b0c6ff'; }}
        onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderBottomColor = 'rgba(66,70,84,0.5)'; }}
      />
      {field.description && (
        <span className="text-[10px] mt-1 block" style={{ color: '#424654' }}>{field.description}</span>
      )}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Icon button helper
// ---------------------------------------------------------------------------

function IconButton({ title, children, onClick }: { title: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="p-1 rounded transition-colors"
      style={{ color: '#c3c6d6' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#c3c6d6'; }}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function UndoIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>; }
function RedoIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>; }
function EyeIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
function GearIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>; }
function ImageIconSm() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>; }
function ComponentsIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b0c6ff" strokeWidth="1.5" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>; }
function LayersIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>; }
function TuneIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b0c6ff" strokeWidth="2" aria-hidden="true"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>; }
function PlusIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function CopyIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>; }
function TrashIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>; }
function ArrowUpIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>; }
function ArrowDownIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>; }
function BlockIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>; }
function DragHandleIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="7" r="1.5"/><circle cx="15" cy="7" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="17" r="1.5"/><circle cx="15" cy="17" r="1.5"/></svg>; }
