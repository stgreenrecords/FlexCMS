'use client';

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Switch,
  Textarea,
} from '@flexcms/ui';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

import { getApiBase } from '@/lib/apiBase';
import { canvasComponentMap } from '@/lib/canvasRenderers';
import { normalizeAssetUrl } from '@/lib/normalizeAssetUrls';
const API_BASE = getApiBase();

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
  isLocked?: boolean;
  lockReason?: string;
}

interface TemplateComponentRef {
  title?: string;
  resourceType?: string;
}

interface PageTemplateDefinition {
  name: string;
  title?: string;
  description?: string;
  embeddedComponents?: TemplateComponentRef[];
  allowedComponents?: TemplateComponentRef[];
  embeddedComponentTypes?: string[];
  allowedComponentTypes?: string[];
}

// ---------------------------------------------------------------------------
// Schema-driven form field type
// ---------------------------------------------------------------------------

interface PropField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'toggle' | 'select' | 'textarea' | 'object' | 'list';
  options?: string[];
  description?: string;
  required?: boolean;
  /** For `object`: the nested fields, when the schema declares `properties`. */
  fields?: PropField[];
  /** For `list`: how to edit one item. */
  item?: {
    /** Primitive item editor, or `object` for a nested group / JSON item. */
    type: 'text' | 'number' | 'object';
    /** For object items with a declared shape: the nested fields. */
    fields?: PropField[];
  };
}

const TEMPLATE_DETACHED_FLAG = 'flexcmsTemplateDetached';

// ---------------------------------------------------------------------------
// JSON Schema → PropField[] converter
// ---------------------------------------------------------------------------

function schemaToFields(schema: Record<string, unknown> | undefined): PropField[] {
  if (!schema) return [];
  const properties = (schema['properties'] as Record<string, Record<string, unknown>>) ?? {};
  const required = (schema['required'] as string[]) ?? [];
  return Object.entries(properties)
    .filter(([key]) => !key.startsWith('_') && key !== 'children' && key !== TEMPLATE_DETACHED_FLAG)
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
      } else if (type === 'object') {
        // Structured value: never fall through to the text branch, which used to
        // render `[object Object]` and replace the object with that string on edit.
        fieldType = 'object';
      } else if (type === 'array') {
        fieldType = 'list';
      } else if (type === 'string' && (format === 'textarea' || key.toLowerCase().includes('description') || key.toLowerCase().includes('content') || key.toLowerCase().includes('body'))) {
        fieldType = 'textarea';
      }

      // Nested shape, where the registry declares one. `schemaToFields` recurses so
      // an object's own properties get the same treatment as a top-level field.
      let nestedFields: PropField[] | undefined;
      if (fieldType === 'object' && propDef['properties']) {
        nestedFields = schemaToFields(propDef);
      }

      let item: PropField['item'] | undefined;
      if (fieldType === 'list') {
        const items = (propDef['items'] as Record<string, unknown> | undefined) ?? {};
        const itemType = items['type'] as string | undefined;
        if (itemType === 'number' || itemType === 'integer') {
          item = { type: 'number' };
        } else if (itemType === 'object') {
          item = {
            type: 'object',
            fields: items['properties'] ? schemaToFields(items) : undefined,
          };
        } else {
          item = { type: 'text' };
        }
      }

      return {
        key,
        label: title,
        type: fieldType,
        options: enumValues,
        description,
        required: required.includes(key),
        fields: nestedFields,
        item,
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

/**
 * Node name for a component the author added in the editor.
 *
 * Derived from the resource type plus a short unique suffix, so a page can hold
 * several instances of the same component and the name still says what it is when
 * someone reads the content tree.
 */
function componentNodeName(comp: PageComponent): string {
  const leaf = comp.resourceType.split('/').pop() ?? 'component';
  const slug = leaf.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const suffix = comp.instanceId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toLowerCase();
  return `${slug}-${suffix}`;
}

function toTestId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
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

const XF_LOCKED_COMPONENT_TYPES = new Set([
  'tut-usa/navigation-search-discovery/navigation',
  'tut-usa/navigation-search-discovery/footer',
]);

function buildEmbeddedTemplateComponents(
  template: PageTemplateDefinition | null,
  defs: ComponentDefinition[],
  pageComponents: PageComponent[],
): PageComponent[] {
  if (!template) {
    return pageComponents;
  }

  const embeddedRefs = (template.embeddedComponents ?? []).filter(
    (ref) => ref.resourceType && !XF_LOCKED_COMPONENT_TYPES.has(ref.resourceType),
  );

  if (embeddedRefs.length === 0) {
    return pageComponents;
  }

  const remaining = [...pageComponents];
  const merged: PageComponent[] = [];

  for (const ref of embeddedRefs) {
    const index = remaining.findIndex((component) => component.resourceType === ref.resourceType);
    const definition = defs.find((item) => item.resourceType === ref.resourceType);

    if (index >= 0) {
      const existing = remaining.splice(index, 1)[0];
      const isDetached = existing.props?.[TEMPLATE_DETACHED_FLAG] === true;
      merged.push({
        ...existing,
        isLocked: !isDetached,
        lockReason: isDetached
          ? undefined
          : `Embedded by template ${template.title ?? template.name}`,
      });
      continue;
    }

    instanceCounter++;
    merged.push({
      instanceId: `tpl-${instanceCounter}`,
      resourceType: ref.resourceType!,
      label: ref.title ?? definition?.title ?? definition?.name ?? 'Template Component',
      props: {},
      isLocked: true,
      lockReason: `Embedded by template ${template.title ?? template.name}`,
    });
  }

  return [...merged, ...remaining];
}

// ---------------------------------------------------------------------------
// Page component (entry point with Suspense boundary)
// ---------------------------------------------------------------------------

export default function VisualPageEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col justify-center gap-4 px-8" style={{ background: '#131313' }}>
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-12 w-full max-w-xl" />
          <Skeleton className="h-[60vh] w-full" />
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
  /**
   * Node paths the page loaded with, so Save can tell a deletion from a component
   * that never existed. Held in a ref because it is bookkeeping, not render state.
   */
  const loadedNodePathsRef = React.useRef<string[]>([]);

  /**
   * Undo/redo history of component states.
   *
   * Snapshots rather than inverse operations: every mutation already goes through
   * `setComponents`, so recording the resulting state covers add, delete, duplicate,
   * reorder, and property edits uniformly, with no per-operation inverse to get
   * wrong. `applyingHistoryRef` suppresses recording while a snapshot is being
   * applied, so stepping through history does not append to it.
   */
  const historyRef = React.useRef<PageComponent[][]>([]);
  const historyIndexRef = React.useRef<number>(-1);
  const applyingHistoryRef = React.useRef<boolean>(false);

  // Record every component state the author reaches, capped so a long session
  // cannot grow without bound.
  //
  // This effect deliberately writes only to refs and never calls setState. An
  // earlier version also tracked `canUndo`/`canRedo` as state to grey the buttons
  // out, and that produced React error #185 ("Maximum update depth exceeded"): a
  // setState in an effect keyed on `components` re-entered the same effect, and the
  // resulting render storm also stopped property inputs from accepting typed text.
  // Enabled-state styling is not worth a render loop — `stepHistory` simply no-ops
  // at either end of the history.
  useEffect(() => {
    if (applyingHistoryRef.current) {
      applyingHistoryRef.current = false;
      return;
    }

    // Drop any redo branch: editing after an undo starts a new future.
    const truncated = historyRef.current.slice(0, historyIndexRef.current + 1);
    truncated.push(components);
    const MAX_HISTORY = 50;
    const trimmed = truncated.length > MAX_HISTORY ? truncated.slice(truncated.length - MAX_HISTORY) : truncated;
    historyRef.current = trimmed;
    historyIndexRef.current = trimmed.length - 1;
  }, [components]);

  function stepHistory(delta: number) {
    const target = historyIndexRef.current + delta;
    if (target < 0 || target >= historyRef.current.length) return;
    historyIndexRef.current = target;
    applyingHistoryRef.current = true;
    setComponents(historyRef.current[target]);
    // Selection may point at a component the snapshot does not contain.
    setSelectedId(null);
  }
  const [pageTemplate, setPageTemplate] = useState<PageTemplateDefinition | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<'components' | 'layers' | 'assets'>('components');
  const [savedAt, setSavedAt] = useState<string>('—');
  const [isDraft, setIsDraft] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDetachingInheritance, setIsDetachingInheritance] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [detachError, setDetachError] = useState<string | null>(null);
  const [detachInfo, setDetachInfo] = useState<string | null>(null);
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

    Promise.all([fetchRegistry, fetchPage]).then(async ([reg, page]) => {
      const defs: ComponentDefinition[] = reg.components ?? [];
      setRegistry(defs);

      let template: PageTemplateDefinition | null = null;
      if (page) {
        const pageNode = page as ApiContentNode;
        const templateName = typeof pageNode.properties?.['template'] === 'string'
          ? String(pageNode.properties?.['template'])
          : '';

        if (templateName) {
          const templateResponse = await fetch(`${API_BASE}/api/author/content/templates/${encodeURIComponent(templateName)}`);
          if (templateResponse.ok) {
            template = await templateResponse.json() as PageTemplateDefinition;
          }
        }

        setPageTemplate(template);
        setIsDraft(pageNode.status !== 'PUBLISHED');

        const pageComps = (pageNode.children ?? []).map((child: ApiContentNode) =>
          nodeToPageComponent(child, defs),
        );
        const mergedComponents = buildEmbeddedTemplateComponents(template, defs, pageComps);
        setComponents(mergedComponents);
        loadedNodePathsRef.current = mergedComponents
          .map((comp) => comp.nodePath)
          .filter((path): path is string => Boolean(path));
        setPalette(
          template?.allowedComponentTypes?.length
            ? registryToPalette(defs).filter((item) => template?.allowedComponentTypes?.includes(item.resourceType))
            : registryToPalette(defs),
        );
        if (mergedComponents.length > 0) setSelectedId(mergedComponents[0].instanceId);
      } else {
        setPageTemplate(null);
        setPalette(registryToPalette(defs));
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
      const requestedIdx = Math.max(0, Math.min(idx, prev.length));
      const clamped = prev[requestedIdx]?.isLocked ? prev.length : requestedIdx;
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
      if (comp && !comp.isLocked) setActiveDrag({ type: 'canvas', component: comp });
    }
    setInsertPreviewIdx(null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event;
    if (!over || activeDrag?.type !== 'palette') return;
    const overId = String(over.id);
    // over a canvas item → preview insert before it
    const idx = components.findIndex((c) => c.instanceId === overId);
    if (idx >= 0 && components[idx]?.isLocked) {
      setInsertPreviewIdx(null);
      return;
    }
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
            if (oldIdx < 0 || newIdx < 0 || prev[oldIdx]?.isLocked || prev[newIdx]?.isLocked) {
              return prev;
            }
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
    if (components.find((c) => c.instanceId === instanceId)?.isLocked) return;
    setComponents((prev) => prev.filter((c) => c.instanceId !== instanceId));
    if (selectedId === instanceId) setSelectedId(null);
  }

  function duplicateComponent(instanceId: string) {
    const src = components.find((c) => c.instanceId === instanceId);
    if (!src || src.isLocked) return;
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
    if (!contentPath) return;

    const pageLtreePath = contentPath.replace(/^\//, '').replace(/\//g, '.');
    setIsSaving(true);

    try {
      // 1. Properties of components that already exist as nodes.
      const existing = components.filter((c) => c.nodePath);
      await Promise.all(
        existing.map((comp) =>
          fetch(`${API_BASE}/api/author/content/node/properties`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: comp.nodePath, properties: comp.props, userId: 'admin' }),
          }),
        ),
      );

      // 2. Components the author added or duplicated in this session.
      //
      // A component with no nodePath that is *locked* is a template-embedded
      // placeholder: `buildEmbeddedTemplateComponents()` synthesises those from the
      // template's `embeddedComponents` with `isLocked: true` and no path of their
      // own. Creating page nodes for them would detach them from template
      // inheritance as a side effect of pressing Save, so they are skipped. An
      // embedded component the author *has* detached already has a nodePath and is
      // handled by step 1.
      const created = new Map<string, string>();
      for (const comp of components) {
        if (comp.nodePath || comp.isLocked) continue;
        const name = componentNodeName(comp);
        const response = await fetch(`${API_BASE}/api/author/content/node`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parentPath: pageLtreePath,
            name,
            resourceType: comp.resourceType,
            properties: comp.props,
            userId: 'admin',
          }),
        });
        if (response.ok) {
          const node = (await response.json()) as ApiContentNode;
          created.set(comp.instanceId, node.path);
        }
      }

      // 3. Components the author removed, diffed against what the page loaded with.
      const surviving = new Set(components.map((c) => c.nodePath).filter(Boolean) as string[]);
      const removed = loadedNodePathsRef.current.filter((path) => !surviving.has(path));
      for (const path of removed) {
        await fetch(
          `${API_BASE}/api/author/content/node?path=${encodeURIComponent(path)}&userId=admin`,
          { method: 'DELETE' },
        );
      }

      // 4. The order the author left them in. Only real page nodes participate:
      //    the reorder endpoint requires exactly the parent's children.
      const orderedPaths = components
        .map((comp) => comp.nodePath ?? created.get(comp.instanceId))
        .filter((path): path is string => Boolean(path));
      if (orderedPaths.length > 0) {
        await fetch(`${API_BASE}/api/author/content/node/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parentPath: pageLtreePath, orderedPaths, userId: 'admin' }),
        });
      }

      // Adopt the new paths so a second Save updates rather than duplicates.
      if (created.size > 0) {
        setComponents((prev) =>
          prev.map((comp) =>
            created.has(comp.instanceId) ? { ...comp, nodePath: created.get(comp.instanceId) } : comp,
          ),
        );
      }
      loadedNodePathsRef.current = orderedPaths;

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
    if (!selectedComponent || selectedComponent.isLocked) return;
    const item = palette.find((p) => p.resourceType === selectedComponent.resourceType);
    if (!item) return;
    setComponents((prev) =>
      prev.map((c) =>
        c.instanceId === selectedId ? { ...c, props: { ...item.defaultProps } } : c,
      ),
    );
  }

  async function handleCancelInheritance() {
    if (!selectedComponent || !selectedComponent.isLocked) return;
    if (!selectedComponent.nodePath) {
      setDetachError('This template-embedded slot has no page node to detach. Add a local component instead.');
      return;
    }

    setIsDetachingInheritance(true);
    setDetachError(null);
    setDetachInfo(null);

    try {
      const detachResponse = await fetch(
        `${API_BASE}/api/author/livecopy?targetPath=${encodeURIComponent(selectedComponent.nodePath)}&deep=true`,
        { method: 'DELETE' },
      );

      let detachWarning: string | null = null;
      if (!detachResponse.ok) {
        detachWarning = `Live copy detach returned ${detachResponse.status}. Local page override was still applied.`;
      }

      const updatedProps = {
        ...selectedComponent.props,
        [TEMPLATE_DETACHED_FLAG]: true,
      };

      const persistResponse = await fetch(`${API_BASE}/api/author/content/node/properties`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: selectedComponent.nodePath,
          properties: updatedProps,
          userId: 'admin',
        }),
      });

      if (!persistResponse.ok) {
        throw new Error(`Could not persist editable override (${persistResponse.status}).`);
      }

      setComponents((prev) =>
        prev.map((component) =>
          component.instanceId === selectedComponent.instanceId
            ? {
                ...component,
                props: updatedProps,
                isLocked: false,
                lockReason: undefined,
              }
            : component,
        ),
      );

      setDetachInfo(detachWarning ?? 'Inheritance canceled. This component is now editable on this page.');
    } catch (error) {
      setDetachError(error instanceof Error ? error.message : 'Failed to cancel inheritance.');
    } finally {
      setIsDetachingInheritance(false);
    }
  }

  async function handleCancelInheritanceForAll() {
    if (isDetachingInheritance || isSaving) return;

    const lockedComponents = components.filter((component) => component.isLocked);
    if (lockedComponents.length === 0) {
      setDetachInfo('No locked components found on this page.');
      setDetachError(null);
      return;
    }

    setIsDetachingInheritance(true);
    setDetachError(null);
    setDetachInfo(null);

    let succeeded = 0;
    const warnings: string[] = [];
    const failed: string[] = [];
    const unlockedInstanceIds = new Set<string>();
    const updatedPropsById = new Map<string, Record<string, unknown>>();

    for (const component of lockedComponents) {
      if (!component.nodePath) {
        warnings.push(`${component.label}: no page node to detach.`);
        continue;
      }

      try {
        const detachResponse = await fetch(
          `${API_BASE}/api/author/livecopy?targetPath=${encodeURIComponent(component.nodePath)}&deep=true`,
          { method: 'DELETE' },
        );
        if (!detachResponse.ok) {
          warnings.push(`${component.label}: live copy detach returned ${detachResponse.status}.`);
        }

        const updatedProps: Record<string, unknown> = {
          ...component.props,
          [TEMPLATE_DETACHED_FLAG]: true,
        };

        const persistResponse = await fetch(`${API_BASE}/api/author/content/node/properties`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: component.nodePath,
            properties: updatedProps,
            userId: 'admin',
          }),
        });

        if (!persistResponse.ok) {
          throw new Error(`persist returned ${persistResponse.status}`);
        }

        succeeded += 1;
        unlockedInstanceIds.add(component.instanceId);
        updatedPropsById.set(component.instanceId, updatedProps);
      } catch (error) {
        const detail = error instanceof Error ? error.message : 'unknown error';
        failed.push(`${component.label}: ${detail}`);
      }
    }

    if (unlockedInstanceIds.size > 0) {
      setComponents((prev) =>
        prev.map((component) =>
          unlockedInstanceIds.has(component.instanceId)
            ? {
                ...component,
                props: updatedPropsById.get(component.instanceId) ?? component.props,
                isLocked: false,
                lockReason: undefined,
              }
            : component,
        ),
      );
    }

    const infoParts = [`Inheritance canceled for ${succeeded}/${lockedComponents.length} locked components.`];
    if (warnings.length > 0) {
      infoParts.push(`Warnings: ${warnings.slice(0, 3).join(' | ')}`);
    }
    setDetachInfo(infoParts.join(' '));

    if (failed.length > 0) {
      setDetachError(`Failed: ${failed.slice(0, 3).join(' | ')}`);
    }

    setIsDetachingInheritance(false);
  }

  const canvasWidth = viewport === 'desktop' ? '100%' : viewport === 'tablet' ? '768px' : '390px';

  // ── Loading / error states ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col gap-4 px-8 py-10" style={{ background: '#131313' }}>
        <Skeleton className="h-5 w-56" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-72" />
        </div>
        <Skeleton className="h-[72vh] w-full" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#131313' }}>
        <div className="w-full max-w-xl rounded-xl border p-6" style={{ borderColor: 'rgba(147,0,10,0.35)', background: 'rgba(147,0,10,0.12)' }}>
          <p className="text-sm font-semibold" style={{ color: '#ffb4ab' }}>Failed to load editor</p>
          <p className="mt-2 text-xs" style={{ color: '#f7dad5' }}>{loadError}</p>
          <Button asChild variant="outline" className="mt-4" data-testid="editor-back-to-content-button">
            <a href="/content">Back to Content</a>
          </Button>
        </div>
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
                data-testid={`editor-viewport-${v}`}
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
            <Breadcrumb className="mb-1" data-testid="editor-breadcrumb">
              <BreadcrumbList className="text-[0.65rem] uppercase tracking-[0.2em]" style={{ color: '#8d90a0' }}>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/content">Content</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{pageName}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <span className="text-sm font-bold" style={{ color: '#e5e2e1', lineHeight: 1.2 }}>
              {pageName}
            </span>
            <span className="text-[0.65rem] font-mono mt-0.5" style={{ color: '#8d90a0' }}>
              {contentPath}
            </span>
            {pageTemplate && (
              <span className="text-[0.6rem] uppercase tracking-[0.2em] mt-1" style={{ color: '#c9a84c' }}>
                {pageTemplate.title ?? pageTemplate.name}
              </span>
            )}
          </div>
        )}

        {/* Right: actions */}
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-1 px-3 py-1 rounded-lg"
            style={{ background: '#2a2a2a', border: '1px solid rgba(66,70,84,0.15)' }}
          >
            <IconButton title="Undo" dataTestId="editor-undo-button" onClick={() => stepHistory(-1)}>
              <UndoIcon />
            </IconButton>
            <IconButton title="Redo" dataTestId="editor-redo-button" onClick={() => stepHistory(1)}>
              <RedoIcon />
            </IconButton>
            <div style={{ width: 1, height: 16, background: 'rgba(66,70,84,0.4)', margin: '0 4px' }} />
            <IconButton
              title="Preview"
              dataTestId="editor-preview-button"
              onClick={() => contentPath && window.open(`/preview?path=${encodeURIComponent(contentPath)}&mode=draft`, '_blank')}
            >
              <EyeIcon />
            </IconButton>
            <IconButton title="Settings" dataTestId="editor-settings-button"><GearIcon /></IconButton>
          </div>

          <Button
            onClick={handleCancelInheritanceForAll}
            disabled={isSaving || isDetachingInheritance || !components.some((component) => component.isLocked)}
            variant="ghost"
            size="sm"
            className="px-4 py-1.5 text-sm font-bold"
            data-testid="cancel-inheritance-all-button"
            style={{
              color: '#b0c6ff',
              background: 'transparent',
              opacity: isSaving || isDetachingInheritance || !components.some((component) => component.isLocked) ? 0.45 : 1,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            {isDetachingInheritance ? 'Canceling…' : 'Cancel All Inheritance'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            variant="ghost"
            size="sm"
            className="px-4 py-1.5 text-sm font-bold"
            data-testid="editor-save-button"
            style={{ color: '#e5e2e1', background: 'transparent', opacity: isSaving ? 0.6 : 1 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isSaving}
            size="sm"
            className="px-5 py-1.5 text-sm font-bold"
            data-testid="editor-publish-button"
            style={{
              background: 'linear-gradient(135deg, #b0c6ff 0%, #0058cc 100%)',
              color: '#002d6f',
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            Publish
          </Button>
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
            {pageTemplate && (
              <div
                className="px-3 py-3 rounded-lg"
                style={{ background: 'rgba(48,40,20,0.45)', border: '1px solid rgba(180,140,50,0.25)' }}
              >
                <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: '#c9a84c' }}>
                  Template Rules
                </p>
                <p className="text-xs leading-relaxed" style={{ color: '#d7d1bf' }}>
                  {pageTemplate.title ?? pageTemplate.name} limits this palette to approved optional components and locks embedded structure on the canvas.
                </p>
              </div>
            )}

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
                  data-testid={`editor-left-tab-${id}`}
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
                  <div className="rounded-lg border px-3 py-4" style={{ borderColor: 'rgba(66,70,84,0.35)', background: 'rgba(19,19,19,0.4)' }}>
                    <p className="text-xs" style={{ color: '#8d90a0' }}>
                      {pageTemplate
                        ? 'This template has no optional components available in the palette.'
                        : 'No components are registered yet.'}
                    </p>
                  </div>
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
                    data-testid={`editor-layer-${toTestId(c.instanceId)}`}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors"
                    style={selectedId === c.instanceId ? { background: '#2a3a5e', color: '#b0c6ff' } : { color: '#c3c6d6' }}
                  >
                    <span style={{ color: '#8d90a0', fontSize: 11 }}>{idx + 1}</span>
                    <span className="shrink-0"><BlockIcon /></span>
                    <span className="truncate">{c.label}</span>
                    {c.isLocked && (
                      <span className="ml-auto text-[9px] uppercase tracking-widest" style={{ color: '#c9a84c' }}>
                        Locked
                      </span>
                    )}
                  </button>
                ))}
                {components.length === 0 && (
                  <div className="rounded-lg border px-3 py-4" style={{ borderColor: 'rgba(66,70,84,0.35)', background: 'rgba(19,19,19,0.4)' }}>
                    <p className="text-xs" style={{ color: '#8d90a0' }}>No layers yet. Add a component from the palette.</p>
                  </div>
                )}
              </div>
            )}

            {/* Assets tab */}
            {leftTab === 'assets' && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider mb-3 px-3" style={{ color: '#8d90a0' }}>
                  Assets
                </p>
                <div className="rounded-lg border px-3 py-4" style={{ borderColor: 'rgba(66,70,84,0.35)', background: 'rgba(19,19,19,0.4)' }}>
                  <p className="text-xs" style={{ color: '#8d90a0' }}>
                    Open the{' '}
                    <a href="/dam" style={{ color: '#b0c6ff' }}>DAM browser</a>{' '}
                    to manage assets.
                  </p>
                </div>
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
            {/* Locked XF Navigation slot — cannot be moved, edited, or deleted */}
            <LockedXfSlot
              label="Experience Fragment — Navigation"
              xfEditPath="/editor?path=/content/experience-fragments/tut-usa/global/navigation"
            />

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
                        if (idx === 0 || comp.isLocked || components[idx - 1]?.isLocked) return;
                        setComponents((prev) => arrayMove(prev, idx, idx - 1));
                      }}
                      onMoveDown={() => {
                        if (idx === components.length - 1 || comp.isLocked || components[idx + 1]?.isLocked) return;
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

            {/* Locked XF Footer slot — cannot be moved, edited, or deleted */}
            <LockedXfSlot
              label="Experience Fragment — Footer"
              xfEditPath="/editor?path=/content/experience-fragments/tut-usa/global/footer"
            />
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
            {selectedComponent?.isLocked && (
              <p className="text-[11px] mt-2" style={{ color: '#c9a84c' }}>
                {selectedComponent.lockReason ?? 'This component is locked by the assigned page template.'}
              </p>
            )}
            {detachError && (
              <p className="text-[11px] mt-2" style={{ color: '#ffb4ab' }}>
                {detachError}
              </p>
            )}
            {detachInfo && (
              <p className="text-[11px] mt-2" style={{ color: '#8ad9b4' }}>
                {detachInfo}
              </p>
            )}
          </div>

          {selectedComponent ? (
            <>
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {selectedComponent.isLocked ? (
                  <div className="space-y-4">
                    <p className="text-xs leading-relaxed" style={{ color: '#8d90a0' }}>
                      Template-embedded components are read-only until you cancel inheritance for this page.
                    </p>
                    <Button
                      onClick={handleCancelInheritance}
                      disabled={isDetachingInheritance}
                      data-testid="cancel-inheritance-button"
                      variant="secondary"
                      size="sm"
                      className="w-full py-2 text-[11px] font-bold uppercase tracking-widest"
                      style={{
                        background: 'rgba(176,198,255,0.18)',
                        color: '#b0c6ff',
                        opacity: isDetachingInheritance ? 0.65 : 1,
                      }}
                    >
                      {isDetachingInheritance ? 'Canceling Inheritance…' : 'Cancel Inheritance and Edit'}
                    </Button>
                  </div>
                ) : selectedSchema.length === 0 ? (
                  <div className="rounded-lg border px-3 py-4" style={{ borderColor: 'rgba(66,70,84,0.35)', background: 'rgba(19,19,19,0.4)' }}>
                    <p className="text-xs" style={{ color: '#8d90a0' }}>
                      No editable properties for this component.
                    </p>
                  </div>
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
                <Button
                  onClick={resetToDefaults}
                  disabled={selectedComponent.isLocked}
                  variant="outline"
                  size="sm"
                  data-testid="editor-reset-defaults-button"
                  className="w-full py-2 text-[11px] font-bold uppercase tracking-widest"
                  style={{ background: '#2a2a2a', color: '#8d90a0', opacity: selectedComponent.isLocked ? 0.45 : 1 }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(176,198,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#b0c6ff'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a'; (e.currentTarget as HTMLButtonElement).style.color = '#8d90a0'; }}
                >
                  Reset to Defaults
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div className="rounded-lg border px-4 py-6" style={{ borderColor: 'rgba(66,70,84,0.35)', background: 'rgba(19,19,19,0.4)' }}>
                <p className="text-sm" style={{ color: '#8d90a0' }}>
                  Click a component on the canvas to edit its properties.
                </p>
              </div>
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
// LockedXfSlot — read-only Experience Fragment reference (nav/footer)
// Authors cannot move, edit, or delete these slots from the canvas.
// ---------------------------------------------------------------------------

function LockedXfSlot({ label, xfEditPath }: { label: string; xfEditPath: string }) {
  return (
    <div
      className="flex items-center justify-between px-6 py-3 mx-0"
      style={{
        background: 'rgba(48,40,20,0.7)',
        borderTop: '1px solid rgba(180,140,50,0.3)',
        borderBottom: '1px solid rgba(180,140,50,0.3)',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Lock icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b0860a" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#c9a84c' }}>
          {label}
        </span>
      </div>
      <a
        href={xfEditPath}
        className="text-xs font-medium transition-colors"
        style={{ color: '#b0c6ff' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#ffffff'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#b0c6ff'; }}
        title="Open in Experience Fragments editor"
      >
        Edit in Experience Fragments →
      </a>
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
      data-testid={`editor-palette-item-${toTestId(item.resourceType)}`}
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
  } = useSortable({ id: component.instanceId, disabled: component.isLocked });

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
        dragHandleProps={component.isLocked ? undefined : { ...attributes, ...listeners }}
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
      data-testid={`editor-canvas-item-${toTestId(component.instanceId)}`}
      className="relative group cursor-pointer transition-all"
      style={{
        border: isSelected
          ? component.isLocked ? '2px solid #c9a84c' : '2px solid #b0c6ff'
          : '2px solid transparent',
        outline: isSelected
          ? component.isLocked ? '4px solid rgba(201,168,76,0.14)' : '4px solid rgba(176,198,255,0.08)'
          : 'none',
      }}
    >
      {isSelected && (
        <div
          className="absolute flex items-center gap-3 px-3 py-1 rounded-t-lg text-[11px] font-bold"
          style={{
            top: -36,
            left: -2,
            background: component.isLocked ? '#c9a84c' : '#b0c6ff',
            color: component.isLocked ? '#2e2300' : '#002d6f',
            zIndex: 10,
          }}
        >
          {/* Drag handle — activates dnd-kit sortable */}
          {component.isLocked ? (
            <span title="Locked by template" style={{ display: 'flex', alignItems: 'center' }}>
              <LockIcon />
            </span>
          ) : (
            <span
              {...(dragHandleProps as React.HTMLAttributes<HTMLSpanElement>)}
              title="Drag to reorder"
              style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: '#002d6f' }}
              onClick={(e) => e.stopPropagation()}
            >
              <DragHandleIcon />
            </span>
          )}
          <span>{component.label}</span>
          <div className="flex gap-2">
            {!component.isLocked && (
              <>
                <button title="Move up"   onClick={(e) => { e.stopPropagation(); onMoveUp(); }}   style={{ color: '#002d6f' }}><ArrowUpIcon /></button>
                <button title="Move down" onClick={(e) => { e.stopPropagation(); onMoveDown(); }} style={{ color: '#002d6f' }}><ArrowDownIcon /></button>
                <button title="Duplicate" onClick={(e) => { e.stopPropagation(); onDuplicate(); }} style={{ color: '#002d6f' }}><CopyIcon /></button>
                <button title="Delete"    onClick={(e) => { e.stopPropagation(); onDelete(); }}    style={{ color: '#002d6f' }}><TrashIcon /></button>
              </>
            )}
          </div>
        </div>
      )}
      {!isSelected && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ border: component.isLocked ? '1px solid rgba(201,168,76,0.45)' : '1px solid rgba(176,198,255,0.3)' }}
        />
      )}
      <ComponentPreview component={component} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// ComponentPreview — renders each component with the site's own renderer
// ---------------------------------------------------------------------------

/**
 * Draws a component exactly as the published site draws it.
 *
 * This used to be a hand-written switch: it matched on substrings of the resource
 * type ("hero", "banner", ...) and fell back to a grey box carrying the component's
 * name. Components the site renders as real UI — product grids, feature lists,
 * featured content — appeared here as those grey boxes, so authors were editing a
 * wireframe and only discovered the real layout after publishing.
 *
 * It now resolves against `@flexcms/site-renderers`, the registry the site itself
 * renders from, so the canvas is WYSIWYG by construction: there is no second
 * renderer set that can drift.
 *
 * The `flexcms-canvas` class re-binds the design tokens for this subtree. Admin and
 * the site both define `--color-*` properties with the same names and different
 * values, so without it the site's components would render in the admin app's light
 * palette.
 */
function ComponentPreview({ component }: { component: PageComponent }) {
  const { resourceType, label, props } = component;
  const Renderer = canvasComponentMap.resolve(resourceType);

  if (!Renderer) {
    // The registry sets a fallback, so this is unreachable in practice — but a
    // missing renderer must not blank the canvas.
    return (
      <div className="flex items-center justify-center gap-3 py-10"
        style={{ background: '#131313', color: '#424654' }}>
        <BlockIcon />
        <div>
          <p className="text-sm font-bold" style={{ color: '#8d90a0' }}>{label}</p>
          <p className="text-[11px]" style={{ color: '#424654' }}>{resourceType}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flexcms-canvas" data-canvas-resource-type={resourceType}>
      <CanvasRenderBoundary label={label} resourceType={resourceType}>
        <CollapsibleRender label={label} resourceType={resourceType}>
          <Renderer data={props} resourceType={resourceType} name={label} />
        </CollapsibleRender>
      </CanvasRenderBoundary>
    </div>
  );
}

/**
 * Gives a component a body to click when its renderer draws nothing.
 *
 * Some components have no visual output by design — page metadata is the obvious one —
 * and others collapse when their content is not authored yet. That is faithful to the
 * published page, but on the canvas it means the component cannot be selected at all,
 * because the selection chip only appears *after* selection.
 *
 * The stub renders alongside the measured element rather than inside it, so it never
 * influences the measurement it is triggered by.
 */
function CollapsibleRender({
  label,
  resourceType,
  children,
}: {
  label: string;
  resourceType: string;
  children: React.ReactNode;
}) {
  const hostRef = React.useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  React.useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host || typeof ResizeObserver === 'undefined') return;

    // A few pixels of tolerance: a renderer that emits only margins or a hairline
    // border is still nothing an author can aim at.
    const measure = () => setCollapsed(host.getBoundingClientRect().height < 8);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {collapsed && (
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ background: '#131313', color: '#8d90a0', borderTop: '1px solid rgba(66,70,84,0.4)' }}
          data-canvas-collapsed="true"
        >
          <BlockIcon />
          <div>
            <p className="text-sm font-bold">{label}</p>
            <p className="text-[11px]" style={{ color: '#424654' }}>
              Renders nothing on the page — select to edit its fields
            </p>
          </div>
        </div>
      )}
      <div ref={hostRef}>{children}</div>
    </>
  );
}

/**
 * Keeps one bad component from taking down the editor.
 *
 * Site renderers are written against published content, where a field is either
 * authored or absent. In the editor they are pointed at content mid-edit — a
 * half-typed URL, a cleared number, an array the author is still building — so a
 * renderer that would never throw in production can throw here. Losing the whole
 * canvas (and the unsaved work behind it) to one component's render error is a far
 * worse outcome than showing that component as a box.
 */
class CanvasRenderBoundary extends React.Component<
  { label: string; resourceType: string; children: React.ReactNode },
  { failed: boolean }
> {
  constructor(props: { label: string; resourceType: string; children: React.ReactNode }) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div
          className="flex items-center justify-center gap-3 py-10"
          style={{ background: '#2a1a1a', color: '#e0a0a0', border: '1px dashed #7f4a4a' }}
        >
          <div>
            <p className="text-sm font-bold">{this.props.label} could not be previewed</p>
            <p className="text-[11px]">
              {this.props.resourceType} — its editable fields still work in the panel
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// PropertyField — renders a single form field driven by schema type
// ---------------------------------------------------------------------------

/**
 * Validated JSON editor for a structured value whose shape the schema does not
 * describe.
 *
 * Used for `object` fields with no declared `properties` and for array items typed
 * only as `object` — 116 array fields across the contracts are `array of object`
 * with no item properties, so this is the common case, not an edge one.
 *
 * The draft text is local state so a half-typed document is not thrown away on
 * every keystroke, and `onChange` fires only when the text parses. That is the whole
 * point: the previous text input wrote whatever string it held straight into a field
 * the contract requires to be structured.
 */
function JsonValueEditor({
  value,
  onChange,
  testId,
  rows,
}: {
  value: unknown;
  onChange: (val: unknown) => void;
  testId: string;
  rows: number;
}) {
  const serialised = React.useMemo(() => {
    if (value === undefined || value === null) return '';
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }, [value]);

  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const shown = draft ?? serialised;

  return (
    <div className="block">
      <Textarea
        value={shown}
        onChange={(e) => {
          const raw = e.target.value;
          setDraft(raw);
          if (raw.trim() === '') {
            setError(null);
            onChange(undefined);
            return;
          }
          try {
            const parsed = JSON.parse(raw);
            setError(null);
            onChange(parsed);
          } catch (err) {
            // Keep the text so the author can finish typing; write nothing.
            setError(err instanceof Error ? err.message : 'Invalid JSON');
          }
        }}
        onBlur={() => setDraft(null)}
        rows={rows}
        spellCheck={false}
        data-testid={`${testId}-json`}
        className="min-h-[80px] resize-y font-mono text-[11px]"
      />
      {error && (
        <span className="text-[10px] mt-1 block" style={{ color: '#ffb4ab' }} data-testid={`${testId}-json-error`}>
          {error} — the value is left unchanged until the JSON is valid.
        </span>
      )}
    </div>
  );
}

function PropertyField({ field, value, onChange }: {
  field: PropField;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const fieldTestId = `editor-property-${toTestId(field.key)}`;

  /**
   * In-progress text for the number input, or null when it is not being edited.
   *
   * Declared unconditionally at the top of the component: the number branch below
   * returns early, but hooks must run on every render regardless of which branch
   * is taken.
   */
  const [numberDraft, setNumberDraft] = useState<string | null>(null);

  const labelEl = (
    <Label className="mb-2 block text-[11px] font-bold uppercase tracking-wider" style={{ color: '#8d90a0' }}>
      {field.label}
      {field.required && <span style={{ color: '#ffb4ab', marginLeft: 4 }}>*</span>}
    </Label>
  );

  if (field.type === 'toggle') {
    return (
      <div className="flex items-center justify-between py-2" data-testid={fieldTestId}>
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#8d90a0' }}>
          {field.label}
        </span>
        <Switch
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange(checked)}
          data-testid={`${fieldTestId}-input`}
        />
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div className="block" data-testid={fieldTestId}>
        {labelEl}
        <Select value={String(value ?? '')} onValueChange={(next) => onChange(next)}>
          <SelectTrigger data-testid={`${fieldTestId}-input`}>
            <SelectValue placeholder="— select —" />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (field.type === 'number') {
    // The raw string is what the input shows; the number is what we persist.
    //
    // This used to be `value={Number(value ?? 0)}` with
    // `onChange={Number(e.target.value)}`. Because `Number('')` is 0, emptying the
    // field snapped it back to "0" — there was no way to author "no value" for an
    // optional number — and the ordinary select-all/delete/retype sequence left the
    // new digits sitting next to that re-inserted zero: clearing a field holding 42
    // and typing 1004 produced 10040, silently wrong. Keeping the keystrokes in
    // local state and coercing only on change fixes both: an empty box stays empty
    // and reports undefined, and a partially typed value like "-" or "1." is not
    // mangled mid-entry.
    const persisted = value === null || value === undefined || value === '' ? '' : String(value);
    const shown = numberDraft ?? persisted;

    return (
      <div className="block" data-testid={fieldTestId}>
        {labelEl}
        <Input
          type="number"
          value={shown}
          onChange={(e) => {
            const raw = e.target.value;
            setNumberDraft(raw);
            if (raw === '') {
              onChange(undefined);
              return;
            }
            const parsed = Number(raw);
            // Ignore intermediate states the browser reports as NaN ("-", "1e").
            if (!Number.isNaN(parsed)) {
              onChange(parsed);
            }
          }}
          onBlur={() => setNumberDraft(null)}
          data-testid={`${fieldTestId}-input`}
          className="h-9"
        />
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className="block" data-testid={fieldTestId}>
        {labelEl}
        <Textarea
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          data-testid={`${fieldTestId}-input`}
          className="min-h-[88px] resize-y"
        />
      </div>
    );
  }

  if (field.type === 'object') {
    const current = (value && typeof value === 'object' && !Array.isArray(value))
      ? (value as Record<string, unknown>)
      : {};

    // Known shape: edit each declared property, preserving any key the schema does
    // not mention so an edit cannot silently drop data.
    if (field.fields?.length) {
      return (
        <div className="block" data-testid={fieldTestId}>
          {labelEl}
          <div
            className="rounded-lg border p-3 space-y-3"
            style={{ borderColor: '#2a2d3a', backgroundColor: 'rgba(255,255,255,0.02)' }}
            data-testid={`${fieldTestId}-group`}
          >
            {field.fields.map((sub) => (
              <PropertyField
                key={sub.key}
                field={sub}
                value={current[sub.key]}
                onChange={(next) => {
                  const merged = { ...current };
                  if (next === undefined || next === '') delete merged[sub.key];
                  else merged[sub.key] = next;
                  onChange(merged);
                }}
              />
            ))}
          </div>
        </div>
      );
    }

    // Unknown shape: a validated JSON editor is the honest fallback — it still shows
    // the real value and refuses to write anything unparseable.
    return (
      <div className="block" data-testid={fieldTestId}>
        {labelEl}
        <JsonValueEditor value={value} onChange={onChange} testId={fieldTestId} rows={5} />
      </div>
    );
  }

  if (field.type === 'list') {
    const items: unknown[] = Array.isArray(value) ? (value as unknown[]) : [];
    const itemType = field.item?.type ?? 'text';

    const replaceAt = (index: number, next: unknown) => {
      const copy = [...items];
      copy[index] = next;
      onChange(copy);
    };
    const removeAt = (index: number) => onChange(items.filter((_, i) => i !== index));
    const move = (index: number, delta: number) => {
      const target = index + delta;
      if (target < 0 || target >= items.length) return;
      const copy = [...items];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      onChange(copy);
    };
    const addItem = () => {
      const blank = itemType === 'number' ? 0 : itemType === 'object' ? {} : '';
      onChange([...items, blank]);
    };

    return (
      <div className="block" data-testid={fieldTestId}>
        {labelEl}
        <div className="space-y-2" data-testid={`${fieldTestId}-list`}>
          {items.length === 0 && (
            <span className="text-[10px] block" style={{ color: '#8d90a0' }}>No items yet.</span>
          )}
          {items.map((entry, index) => (
            <div
              key={index}
              className="rounded-lg border p-2"
              style={{ borderColor: '#2a2d3a', backgroundColor: 'rgba(255,255,255,0.02)' }}
              data-testid={`${fieldTestId}-item-${index}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#8d90a0' }}>
                  {index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Move item ${index + 1} up`}
                    onClick={() => move(index, -1)}
                    className="text-[11px] px-1"
                    style={{ color: '#8d90a0' }}
                  >↑</button>
                  <button
                    type="button"
                    aria-label={`Move item ${index + 1} down`}
                    onClick={() => move(index, 1)}
                    className="text-[11px] px-1"
                    style={{ color: '#8d90a0' }}
                  >↓</button>
                  <button
                    type="button"
                    aria-label={`Remove item ${index + 1}`}
                    onClick={() => removeAt(index)}
                    className="text-[11px] px-1"
                    style={{ color: '#ffb4ab' }}
                    data-testid={`${fieldTestId}-remove-${index}`}
                  >✕</button>
                </div>
              </div>

              {itemType === 'object' && field.item?.fields?.length ? (
                <div className="space-y-3">
                  {field.item.fields.map((sub) => {
                    const record = (entry && typeof entry === 'object' && !Array.isArray(entry))
                      ? (entry as Record<string, unknown>)
                      : {};
                    return (
                      <PropertyField
                        key={sub.key}
                        field={sub}
                        value={record[sub.key]}
                        onChange={(next) => {
                          const merged = { ...record };
                          if (next === undefined || next === '') delete merged[sub.key];
                          else merged[sub.key] = next;
                          replaceAt(index, merged);
                        }}
                      />
                    );
                  })}
                </div>
              ) : itemType === 'object' ? (
                <JsonValueEditor
                  value={entry}
                  onChange={(next) => replaceAt(index, next)}
                  testId={`${fieldTestId}-item-${index}`}
                  rows={4}
                />
              ) : (
                <Input
                  type={itemType === 'number' ? 'number' : 'text'}
                  value={entry === null || entry === undefined ? '' : String(entry)}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (itemType === 'number') {
                      const parsed = Number(raw);
                      replaceAt(index, raw === '' ? undefined : Number.isNaN(parsed) ? raw : parsed);
                    } else {
                      replaceAt(index, raw);
                    }
                  }}
                  data-testid={`${fieldTestId}-item-${index}-input`}
                  className="h-9"
                />
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded"
            style={{ color: '#b0c6ff', backgroundColor: 'rgba(176,198,255,0.1)' }}
            data-testid={`${fieldTestId}-add`}
          >
            + Add item
          </button>
        </div>
      </div>
    );
  }

  // text (default)
  return (
    <div className="block" data-testid={fieldTestId}>
      {labelEl}
      <Input
        type="text"
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        data-testid={`${fieldTestId}-input`}
        className="h-9"
      />
      {field.description && (
        <span className="text-[10px] mt-1 block" style={{ color: '#424654' }}>{field.description}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icon button helper
// ---------------------------------------------------------------------------

function IconButton({ title, children, onClick, dataTestId, disabled }: { title: string; children: React.ReactNode; onClick?: () => void; dataTestId?: string; disabled?: boolean }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      data-testid={dataTestId}
      className="p-1 rounded transition-colors"
      style={{ color: '#c3c6d6', opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
      onMouseEnter={(e) => {
        if (disabled) return;
        (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a';
        (e.currentTarget as HTMLButtonElement).style.color = '#fff';
      }}
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
function LockIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>; }
function DragHandleIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="7" r="1.5"/><circle cx="15" cy="7" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="17" r="1.5"/><circle cx="15" cy="17" r="1.5"/></svg>; }
