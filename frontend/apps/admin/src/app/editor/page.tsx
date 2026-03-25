'use client';

import React, { useState, useCallback, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Viewport = 'desktop' | 'tablet' | 'mobile';

interface ComponentDef {
  id: string;
  type: string;
  label: string;
  icon: React.ReactNode;
  props: Record<string, unknown>;
}

interface PageComponent extends ComponentDef {
  instanceId: string;
}

// ---------------------------------------------------------------------------
// Component palette definitions
// ---------------------------------------------------------------------------

const PALETTE_ITEMS: ComponentDef[] = [
  { id: 'text',     type: 'text',     label: 'Text',    icon: <TitleIcon />,    props: { content: 'Enter text here...' } },
  { id: 'image',    type: 'image',    label: 'Image',   icon: <ImageIconSm />,  props: { src: '', alt: '' } },
  { id: 'hero',     type: 'hero',     label: 'Hero',    icon: <HeroIcon />,     props: { title: 'REDEFINING THE WORKSPACE', subtitle: 'Experience precision.', cta: 'Explore Now', fullHeight: true } },
  { id: 'grid',     type: 'grid',     label: 'Grid',    icon: <GridIconSm />,   props: { columns: 3, gap: 4 } },
  { id: 'richtext', type: 'richtext', label: 'Rich Text', icon: <RichTextIcon />, props: { content: 'Enter rich text here...' } },
  { id: 'cta',      type: 'cta',      label: 'CTA',     icon: <CtaIcon />,      props: { text: 'Get Started', href: '#' } },
];

// ---------------------------------------------------------------------------
// Property schema per component type
// ---------------------------------------------------------------------------

type PropField = { key: string; label: string; type: 'text' | 'number' | 'toggle' | 'select'; options?: string[] };

const PROP_SCHEMAS: Record<string, PropField[]> = {
  hero: [
    { key: 'title',      label: 'Headline Title', type: 'text' },
    { key: 'subtitle',   label: 'Subtitle',       type: 'text' },
    { key: 'cta',        label: 'CTA Label',      type: 'text' },
    { key: 'theme',      label: 'Color Theme',    type: 'select', options: ['Architectural Dark', 'Minimalist Light', 'Enterprise Blue', 'High Contrast'] },
    { key: 'fullHeight', label: 'Full Height',    type: 'toggle' },
    { key: 'paddingTop', label: 'Padding Top',    type: 'number' },
    { key: 'paddingBottom', label: 'Padding Bottom', type: 'number' },
  ],
  text: [
    { key: 'content',    label: 'Content',        type: 'text' },
    { key: 'align',      label: 'Alignment',      type: 'select', options: ['left', 'center', 'right'] },
  ],
  richtext: [
    { key: 'content',    label: 'Content',        type: 'text' },
  ],
  image: [
    { key: 'src',        label: 'Image URL',      type: 'text' },
    { key: 'alt',        label: 'Alt Text',       type: 'text' },
  ],
  grid: [
    { key: 'columns',    label: 'Columns',        type: 'number' },
    { key: 'gap',        label: 'Gap',            type: 'number' },
  ],
  cta: [
    { key: 'text',       label: 'Button Text',    type: 'text' },
    { key: 'href',       label: 'URL',            type: 'text' },
  ],
};

// ---------------------------------------------------------------------------
// Initial page components
// ---------------------------------------------------------------------------

const INITIAL_COMPONENTS: PageComponent[] = [
  {
    ...PALETTE_ITEMS[2],
    instanceId: 'inst-1',
    props: { title: 'REDEFINING THE WORKSPACE', subtitle: 'Experience the architectural precision of a curated digital environment where content meets form.', cta: 'Explore Now', fullHeight: true, theme: 'Architectural Dark', paddingTop: 120, paddingBottom: 120 },
  },
  {
    ...PALETTE_ITEMS[0],
    instanceId: 'inst-2',
    props: { content: 'Built for Curators\n\nOur philosophy is rooted in the belief that digital tools should be as elegant as the content they manage.', align: 'left' },
  },
];

let instanceCounter = 10;

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function VisualPageEditorPage() {
  const [viewport, setViewport]           = useState<Viewport>('desktop');
  const [components, setComponents]       = useState<PageComponent[]>(INITIAL_COMPONENTS);
  const [selectedId, setSelectedId]       = useState<string | null>('inst-1');
  const [leftTab, setLeftTab]             = useState<'components' | 'layers' | 'assets'>('components');
  const [savedAt, setSavedAt]             = useState<string>('2 min ago');
  const [isDraft, setIsDraft]             = useState(true);
  const [dragOverIdx, setDragOverIdx]     = useState<number | null>(null);
  const dragSrc                           = useRef<string | null>(null); // palette id or instanceId

  const selectedComponent = components.find((c) => c.instanceId === selectedId);
  const selectedSchema    = selectedComponent ? (PROP_SCHEMAS[selectedComponent.type] ?? []) : [];

  // Add component from palette
  function addComponent(def: ComponentDef) {
    instanceCounter++;
    const newComp: PageComponent = {
      ...def,
      instanceId: `inst-${instanceCounter}`,
      props: { ...def.props },
    };
    setComponents((prev) => [...prev, newComp]);
    setSelectedId(newComp.instanceId);
  }

  // Delete component
  function deleteComponent(instanceId: string) {
    setComponents((prev) => prev.filter((c) => c.instanceId !== instanceId));
    if (selectedId === instanceId) setSelectedId(null);
  }

  // Duplicate component
  function duplicateComponent(instanceId: string) {
    const src = components.find((c) => c.instanceId === instanceId);
    if (!src) return;
    instanceCounter++;
    const dup: PageComponent = { ...src, instanceId: `inst-${instanceCounter}`, props: { ...src.props } };
    const idx = components.findIndex((c) => c.instanceId === instanceId);
    setComponents((prev) => [...prev.slice(0, idx + 1), dup, ...prev.slice(idx + 1)]);
    setSelectedId(dup.instanceId);
  }

  // Update prop on selected component
  function updateProp(key: string, value: unknown) {
    if (!selectedId) return;
    setComponents((prev) =>
      prev.map((c) =>
        c.instanceId === selectedId ? { ...c, props: { ...c.props, [key]: value } } : c,
      ),
    );
  }

  // Drop zone: insert dragged palette item at index
  function handleDropAtIndex(idx: number) {
    const palId = dragSrc.current;
    if (!palId) return;
    const def = PALETTE_ITEMS.find((p) => p.id === palId);
    if (!def) return;
    instanceCounter++;
    const newComp: PageComponent = { ...def, instanceId: `inst-${instanceCounter}`, props: { ...def.props } };
    setComponents((prev) => [...prev.slice(0, idx), newComp, ...prev.slice(idx)]);
    setSelectedId(newComp.instanceId);
    setDragOverIdx(null);
    dragSrc.current = null;
  }

  // Save (mock)
  function handleSave() {
    const now = new Date();
    setSavedAt(`${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`);
  }

  // Publish (mock)
  function handlePublish() {
    setIsDraft(false);
    handleSave();
  }

  const canvasWidth = viewport === 'desktop' ? '100%' : viewport === 'tablet' ? '768px' : '390px';

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: '#131313', color: '#e5e2e1', fontFamily: 'Inter, sans-serif' }}
    >
      {/* ----------------------------------------------------------------
          Top navigation bar
      ---------------------------------------------------------------- */}
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
          <a
            href="/content"
            className="text-xl font-black tracking-tighter"
            style={{ color: '#b0c6ff' }}
          >
            FlexCMS
          </a>
          <nav className="flex items-center gap-1">
            {(['desktop', 'tablet', 'mobile'] as Viewport[]).map((v) => (
              <button
                key={v}
                onClick={() => setViewport(v)}
                className="px-3 py-1 rounded text-sm font-medium transition-colors"
                style={{
                  color: viewport === v ? '#b0c6ff' : '#c3c6d6',
                  borderBottom: viewport === v ? '2px solid #b0c6ff' : '2px solid transparent',
                }}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-4">
          {/* Undo/redo/preview/settings */}
          <div
            className="flex items-center gap-1 px-3 py-1 rounded-lg"
            style={{ background: '#2a2a2a', border: '1px solid rgba(66,70,84,0.15)' }}
          >
            <IconButton title="Undo"><UndoIcon /></IconButton>
            <IconButton title="Redo"><RedoIcon /></IconButton>
            <div style={{ width: 1, height: 16, background: 'rgba(66,70,84,0.4)', margin: '0 4px' }} />
            <IconButton title="Preview"><EyeIcon /></IconButton>
            <IconButton title="Settings"><GearIcon /></IconButton>
          </div>

          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg text-sm font-bold transition-all"
            style={{ color: '#e5e2e1', background: 'transparent' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            Save
          </button>
          <button
            onClick={handlePublish}
            className="px-5 py-1.5 rounded-lg text-sm font-bold transition-all"
            style={{
              background: 'linear-gradient(135deg, #b0c6ff 0%, #0058cc 100%)',
              color: '#002d6f',
            }}
          >
            Publish
          </button>
        </div>
      </header>

      {/* ----------------------------------------------------------------
          Main editor area: left panel + canvas + right panel
      ---------------------------------------------------------------- */}
      <div className="flex flex-1 overflow-hidden">

        {/* ---- Left panel: Component palette ---- */}
        <aside
          className="flex flex-col shrink-0"
          style={{
            width: 256,
            background: '#1c1b1b',
            borderRight: '1px solid rgba(66,70,84,0.15)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            className="p-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(66,70,84,0.1)' }}
          >
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
                  style={
                    leftTab === id
                      ? { background: '#324575', color: '#b0c6ff' }
                      : { color: '#c3c6d6' }
                  }
                  onMouseEnter={(e) => { if (leftTab !== id) (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a'; }}
                  onMouseLeave={(e) => { if (leftTab !== id) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  <span className="shrink-0">{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            {/* Panel content */}
            {leftTab === 'components' && (
              <>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-3 px-3" style={{ color: '#8d90a0' }}>
                    Basics
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {PALETTE_ITEMS.map((item) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={() => { dragSrc.current = item.id; }}
                        onClick={() => addComponent(item)}
                        className="flex flex-col items-center justify-center p-3 rounded-lg border transition-all cursor-grab select-none group"
                        style={{
                          background: item.id === 'hero' ? '#2a3a5e' : '#201f1f',
                          border: item.id === 'hero' ? '1px solid rgba(176,198,255,0.4)' : '1px solid rgba(66,70,84,0.2)',
                        }}
                        title={`Drag or click to add ${item.label}`}
                      >
                        <span className="mb-2" style={{ color: item.id === 'hero' ? '#b0c6ff' : '#8d90a0' }}>
                          {item.icon}
                        </span>
                        <span
                          className="text-[11px]"
                          style={{ color: item.id === 'hero' ? '#b0c6ff' : '#c3c6d6' }}
                        >
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => addComponent(PALETTE_ITEMS[2])}
                  className="w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all"
                  style={{ background: '#324575', color: '#b3c5fd' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)'; }}
                >
                  <PlusIcon />
                  Add Component
                </button>
              </>
            )}

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
                    style={
                      selectedId === c.instanceId
                        ? { background: '#2a3a5e', color: '#b0c6ff' }
                        : { color: '#c3c6d6' }
                    }
                  >
                    <span style={{ color: '#8d90a0', fontSize: 11 }}>{idx + 1}</span>
                    <span className="shrink-0">{c.icon}</span>
                    {c.label}
                  </button>
                ))}
                {components.length === 0 && (
                  <p className="text-xs px-3" style={{ color: '#8d90a0' }}>No layers yet.</p>
                )}
              </div>
            )}

            {leftTab === 'assets' && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider mb-3 px-3" style={{ color: '#8d90a0' }}>
                  Recent Assets
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {['banner-01', 'hero-bg', 'logo-dark', 'team-photo'].map((name) => (
                    <div
                      key={name}
                      className="aspect-video rounded-lg flex items-center justify-center text-[10px]"
                      style={{ background: '#2a2a2a', color: '#8d90a0', border: '1px solid rgba(66,70,84,0.2)' }}
                    >
                      {name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ---- Center: Canvas ---- */}
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
            {/* Drop zone at top */}
            <DropZone
              isActive={dragOverIdx === 0}
              onDragOver={() => setDragOverIdx(0)}
              onDragLeave={() => setDragOverIdx(null)}
              onDrop={() => handleDropAtIndex(0)}
            />

            {components.map((comp, idx) => (
              <React.Fragment key={comp.instanceId}>
                <CanvasComponent
                  component={comp}
                  isSelected={selectedId === comp.instanceId}
                  onClick={(e) => { e.stopPropagation(); setSelectedId(comp.instanceId); }}
                  onDelete={() => deleteComponent(comp.instanceId)}
                  onDuplicate={() => duplicateComponent(comp.instanceId)}
                  onMoveUp={() => {
                    if (idx === 0) return;
                    setComponents((prev) => {
                      const arr = [...prev];
                      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                      return arr;
                    });
                  }}
                  onMoveDown={() => {
                    if (idx === components.length - 1) return;
                    setComponents((prev) => {
                      const arr = [...prev];
                      [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                      return arr;
                    });
                  }}
                />
                <DropZone
                  isActive={dragOverIdx === idx + 1}
                  onDragOver={() => setDragOverIdx(idx + 1)}
                  onDragLeave={() => setDragOverIdx(null)}
                  onDrop={() => handleDropAtIndex(idx + 1)}
                />
              </React.Fragment>
            ))}

            {components.length === 0 && (
              <div
                className="flex flex-col items-center justify-center gap-4 py-32"
                style={{ color: '#8d90a0' }}
              >
                <PlusIcon />
                <p className="text-sm">Drag components here to start building</p>
              </div>
            )}
          </div>
        </section>

        {/* ---- Right panel: Properties ---- */}
        <aside
          className="flex flex-col shrink-0"
          style={{
            width: 320,
            background: '#1c1b1b',
            borderLeft: '1px solid rgba(66,70,84,0.15)',
          }}
        >
          {/* Header */}
          <div
            className="p-4"
            style={{ borderBottom: '1px solid rgba(66,70,84,0.1)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <TuneIcon />
              <h3 className="text-sm font-bold" style={{ color: '#fff' }}>Properties</h3>
            </div>
            <p className="text-[11px]" style={{ color: '#8d90a0' }}>
              {selectedComponent ? `${selectedComponent.label} Component` : 'Select a component to edit'}
            </p>
          </div>

          {selectedComponent ? (
            <>
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {selectedSchema.map((field) => (
                  <PropertyField
                    key={field.key}
                    field={field}
                    value={selectedComponent.props[field.key]}
                    onChange={(val) => updateProp(field.key, val)}
                  />
                ))}

                {/* Background image upload (for hero) */}
                {selectedComponent.type === 'hero' && (
                  <div style={{ borderTop: '1px solid rgba(66,70,84,0.1)', paddingTop: 16 }}>
                    <span className="text-[11px] font-bold uppercase tracking-wider block mb-4" style={{ color: '#8d90a0' }}>
                      Background Image
                    </span>
                    <div
                      className="rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer"
                      style={{
                        aspectRatio: '16/9',
                        background: '#2a2a2a',
                        border: '2px dashed rgba(66,70,84,0.5)',
                      }}
                    >
                      <UploadIcon />
                      <span className="text-[10px]" style={{ color: '#8d90a0' }}>Change Image</span>
                    </div>
                  </div>
                )}
              </div>

              <div
                className="p-4"
                style={{ borderTop: '1px solid rgba(66,70,84,0.1)' }}
              >
                <button
                  className="w-full py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all"
                  style={{ background: '#2a2a2a', color: '#8d90a0' }}
                  onClick={() => {
                    const def = PALETTE_ITEMS.find((p) => p.type === selectedComponent.type);
                    if (def) updateProp('__reset', Math.random());
                    setComponents((prev) =>
                      prev.map((c) =>
                        c.instanceId === selectedId
                          ? { ...c, props: { ...(PALETTE_ITEMS.find((p) => p.type === c.type)?.props ?? c.props) } }
                          : c,
                      ),
                    );
                  }}
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

      {/* ----------------------------------------------------------------
          Footer status bar
      ---------------------------------------------------------------- */}
      <footer
        className="flex items-center justify-between px-4 shrink-0"
        style={{
          height: 32,
          background: '#131313',
          borderTop: '1px solid rgba(66,70,84,0.15)',
          flexShrink: 0,
        }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: isDraft ? '#10b981' : '#b0c6ff',
                boxShadow: isDraft ? '0 0 8px rgba(16,185,129,0.5)' : '0 0 8px rgba(176,198,255,0.5)',
              }}
            />
            <span className="text-[11px] uppercase tracking-widest" style={{ color: '#c3c6d6' }}>
              Last saved {savedAt}
            </span>
          </div>
          <div style={{ width: 1, height: 12, background: 'rgba(66,70,84,0.3)' }} />
          <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: '#b0c6ff' }}>
            {isDraft ? 'Draft Mode' : 'Published'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[11px] uppercase tracking-widest" style={{ color: '#c3c6d6' }}>
            Region: US-East-1
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
// DropZone
// ---------------------------------------------------------------------------

function DropZone({ isActive, onDragOver, onDragLeave, onDrop }: {
  isActive: boolean;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: () => void;
}) {
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
      onDragLeave={onDragLeave}
      onDrop={(e) => { e.preventDefault(); onDrop(); }}
      className="flex items-center justify-center transition-all"
      style={{
        height: isActive ? 80 : 24,
        margin: '0 24px',
        border: isActive
          ? '2px dashed rgba(176,198,255,0.6)'
          : '2px dashed rgba(66,70,84,0.2)',
        borderRadius: 12,
        background: isActive ? 'rgba(176,198,255,0.05)' : 'transparent',
      }}
    >
      {isActive && (
        <p className="text-xs font-medium flex items-center gap-2" style={{ color: '#b0c6ff' }}>
          <PlusIcon /> Drop component here
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CanvasComponent — renders a component preview with selection overlay
// ---------------------------------------------------------------------------

function CanvasComponent({
  component,
  isSelected,
  onClick,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: {
  component: PageComponent;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="relative group cursor-pointer transition-all"
      style={{
        border: isSelected
          ? '2px solid #b0c6ff'
          : '2px solid transparent',
        outline: isSelected ? '4px solid rgba(176,198,255,0.08)' : 'none',
      }}
    >
      {/* Component toolbar (visible when selected) */}
      {isSelected && (
        <div
          className="absolute flex items-center gap-3 px-3 py-1 rounded-t-lg text-[11px] font-bold"
          style={{
            top: -36,
            left: -2,
            background: '#b0c6ff',
            color: '#002d6f',
            zIndex: 10,
          }}
        >
          <span>{component.label}</span>
          <div className="flex gap-2">
            <button title="Move up"    onClick={(e) => { e.stopPropagation(); onMoveUp(); }}    style={{ color: '#002d6f' }}><ArrowUpIcon /></button>
            <button title="Move down"  onClick={(e) => { e.stopPropagation(); onMoveDown(); }}  style={{ color: '#002d6f' }}><ArrowDownIcon /></button>
            <button title="Duplicate"  onClick={(e) => { e.stopPropagation(); onDuplicate(); }} style={{ color: '#002d6f' }}><CopyIcon /></button>
            <button title="Delete"     onClick={(e) => { e.stopPropagation(); onDelete(); }}    style={{ color: '#002d6f' }}><TrashIcon /></button>
          </div>
        </div>
      )}

      {/* Hover outline */}
      {!isSelected && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ border: '1px solid rgba(176,198,255,0.3)' }}
        />
      )}

      {/* Component preview */}
      <ComponentPreview component={component} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// ComponentPreview — renders a visual preview of each component type
// ---------------------------------------------------------------------------

function ComponentPreview({ component }: { component: PageComponent }) {
  const { type, props } = component;

  if (type === 'hero') {
    return (
      <div
        className="relative overflow-hidden flex items-center"
        style={{
          minHeight: props['fullHeight'] ? 480 : 300,
          padding: `${props['paddingTop'] ?? 80}px 48px ${props['paddingBottom'] ?? 80}px`,
          background: 'linear-gradient(135deg, #131313 0%, #1c1b1b 100%)',
        }}
      >
        {/* Decorative gradient blob */}
        <div
          className="absolute top-0 right-0"
          style={{
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, rgba(176,198,255,0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            transform: 'translate(30%, -30%)',
          }}
        />
        <div className="relative z-10 max-w-2xl space-y-6">
          <div
            className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
            style={{ background: 'rgba(176,198,255,0.1)', border: '1px solid rgba(176,198,255,0.2)', color: '#b0c6ff' }}
          >
            Innovation Hub
          </div>
          <h1
            className="font-black tracking-tighter leading-none"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: '#fff' }}
          >
            {String(props['title'] ?? 'REDEFINING THE WORKSPACE')}
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: '#c3c6d6' }}>
            {String(props['subtitle'] ?? 'Experience architectural precision.')}
          </p>
          <button
            className="px-8 py-3 font-bold text-sm uppercase tracking-tighter"
            style={{ background: '#fff', color: '#131313' }}
          >
            {String(props['cta'] ?? 'Explore Now')}
          </button>
        </div>
      </div>
    );
  }

  if (type === 'text' || type === 'richtext') {
    return (
      <div className="px-12 py-16" style={{ background: '#131313' }}>
        <div className="max-w-2xl">
          {String(props['content'] ?? '').split('\n').map((line, i) =>
            line.trim() === '' ? (
              <br key={i} />
            ) : i === 0 ? (
              <h2 key={i} className="text-2xl font-bold mb-6" style={{ color: '#fff' }}>{line}</h2>
            ) : (
              <p key={i} className="leading-loose mb-4" style={{ color: '#c3c6d6' }}>{line}</p>
            ),
          )}
        </div>
      </div>
    );
  }

  if (type === 'image') {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height: 200, background: '#2a2a2a', color: '#8d90a0' }}
      >
        {props['src'] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={String(props['src'])} alt={String(props['alt'] ?? '')} className="max-h-full object-cover w-full" />
        ) : (
          <div className="text-center">
            <ImageIconSm />
            <p className="text-xs mt-2">Image placeholder</p>
          </div>
        )}
      </div>
    );
  }

  if (type === 'grid') {
    const cols = Number(props['columns'] ?? 3);
    return (
      <div className="p-8" style={{ background: '#131313' }}>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg flex items-center justify-center text-xs"
              style={{ height: 120, background: '#1c1b1b', color: '#8d90a0', border: '1px dashed rgba(66,70,84,0.4)' }}
            >
              Column {i + 1}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'cta') {
    return (
      <div className="flex items-center justify-center py-12" style={{ background: '#131313' }}>
        <button
          className="px-8 py-4 font-bold text-sm rounded-lg"
          style={{
            background: 'linear-gradient(135deg, #b0c6ff 0%, #0058cc 100%)',
            color: '#002d6f',
          }}
        >
          {String(props['text'] ?? 'Get Started')}
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 text-center" style={{ color: '#8d90a0' }}>
      <p className="text-sm">{component.label}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PropertyField
// ---------------------------------------------------------------------------

function PropertyField({ field, value, onChange }: {
  field: PropField;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#2a2a2a',
    border: 'none',
    borderBottom: '2px solid rgba(66,70,84,0.5)',
    color: '#fff',
    padding: '6px 0',
    fontSize: 13,
    outline: 'none',
  };

  if (field.type === 'toggle') {
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#8d90a0' }}>
          {field.label}
        </span>
        <button
          onClick={() => onChange(!value)}
          className="rounded-full relative transition-all"
          style={{
            width: 40,
            height: 20,
            background: value ? '#b0c6ff' : '#424654',
          }}
        >
          <div
            className="absolute rounded-full transition-all"
            style={{
              width: 12,
              height: 12,
              top: 4,
              left: value ? 24 : 4,
              background: value ? '#002d6f' : '#c3c6d6',
            }}
          />
        </button>
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <label className="block">
        <span className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: '#8d90a0' }}>
          {field.label}
        </span>
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
          }}
        >
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === 'number') {
    return (
      <label className="block">
        <span className="text-[10px] block mb-1" style={{ color: '#8d90a0' }}>
          {field.label}
        </span>
        <input
          type="number"
          value={Number(value ?? 0)}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ ...inputStyle, borderRadius: 4, padding: '6px 8px' }}
        />
      </label>
    );
  }

  // text
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: '#8d90a0' }}>
        {field.label}
      </span>
      <input
        type="text"
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
        onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderBottomColor = '#b0c6ff'; }}
        onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderBottomColor = 'rgba(66,70,84,0.5)'; }}
      />
    </label>
  );
}

// ---------------------------------------------------------------------------
// Icon button helper
// ---------------------------------------------------------------------------

function IconButton({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <button
      title={title}
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
function TitleIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 4v3h5.5v12h3V7H19V4z"/></svg>; }
function ImageIconSm() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>; }
function HeroIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14l-4-4 1.41-1.41L11 13.17l6.59-6.59L19 8l-8 8z"/></svg>; }
function GridIconSm() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z"/></svg>; }
function RichTextIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 17H4v2h10v-2zm6-8H4v2h16V9zM4 15h16v-2H4v2zM4 5v2h16V5H4z"/></svg>; }
function CtaIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 3H5c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 4l-5-3h10l-5 3zm7 12H5c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2z"/></svg>; }
function ComponentsIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b0c6ff" strokeWidth="1.5" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>; }
function LayersIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>; }
function TuneIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b0c6ff" strokeWidth="2" aria-hidden="true"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>; }
function PlusIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function CopyIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>; }
function TrashIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>; }
function ArrowUpIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>; }
function ArrowDownIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>; }
function UploadIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }
