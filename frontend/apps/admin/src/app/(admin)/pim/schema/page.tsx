'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem,
  BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage,
} from '@flexcms/ui';
import {
  DndContext,
  DragEndEvent,
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

type FieldType = 'text' | 'numeric' | 'select' | 'assets' | 'datetime' | 'relation';

interface SchemaField {
  id: string;
  label: string;
  internalId: string;
  type: FieldType;
  required: boolean;
  validationRegex: string;
  inherited: boolean;
  localized: boolean;
}

interface AttributeGroup {
  id: string;
  name: string;
  required: boolean;
  fields: SchemaField[];
}

interface ApiSchema {
  id: string;
  name: string;
  version: string;
  description?: string;
  schemaDef?: Record<string, unknown>;
  attributeGroups?: { groups?: AttributeGroup[] } | null;
  active: boolean;
}

// ---------------------------------------------------------------------------
// Field type palette definitions
// ---------------------------------------------------------------------------

const FIELD_TYPES: Array<{ type: FieldType; label: string; description: string; icon: string; color: string }> = [
  { type: 'text',     label: 'Text Input',  description: 'Standard string field',      icon: 'text_fields',    color: 'var(--color-primary)'   },
  { type: 'numeric',  label: 'Numeric',     description: 'Integer or decimal values',   icon: '123',            color: 'var(--color-secondary)' },
  { type: 'select',   label: 'Select',      description: 'Dropdown or radio list',      icon: 'list',           color: 'var(--color-tertiary)'  },
  { type: 'assets',   label: 'Assets',      description: 'DAM media links',             icon: 'image',          color: 'var(--color-primary)'   },
  { type: 'datetime', label: 'Date & Time', description: 'ISO formatted temporal data', icon: 'calendar_today', color: 'var(--color-secondary)' },
  { type: 'relation', label: 'Relation',    description: 'Link to other schemas',       icon: 'database',       color: 'var(--color-tertiary)'  },
];

// ---------------------------------------------------------------------------
// Serialise groups → API payload
// ---------------------------------------------------------------------------

function groupsToApiPayload(groups: AttributeGroup[], name: string, version: string, description: string) {
  const attributeGroups = { groups };
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  for (const group of groups) {
    for (const field of group.fields) {
      const prop: Record<string, unknown> = { title: field.label };
      if (field.type === 'numeric')  { prop.type = 'number'; }
      else if (field.type === 'datetime') { prop.type = 'string'; prop.format = 'date-time'; }
      else if (field.type === 'assets')   { prop.type = 'string'; prop.format = 'uri'; }
      else { prop.type = 'string'; }
      if (field.validationRegex) {
        prop.pattern = field.validationRegex.replace(/^\/(.*)\/[gimsuy]*$/, '$1');
      }
      if (field.localized)  prop['x-localized'] = true;
      if (field.inherited)  prop['x-inherited']  = true;
      properties[field.internalId] = prop;
      if (field.required) required.push(field.internalId);
    }
  }
  const schemaDef: Record<string, unknown> = { type: 'object', properties };
  if (required.length) schemaDef.required = required;
  return { name, version, description, schemaDef, attributeGroups };
}

// ---------------------------------------------------------------------------
// Deserialise API schema → groups
// ---------------------------------------------------------------------------

function apiToGroups(schema: ApiSchema): AttributeGroup[] {
  if (schema.attributeGroups?.groups?.length) return schema.attributeGroups.groups;
  if (!schema.schemaDef) return [];
  const props = (schema.schemaDef['properties'] as Record<string, Record<string, unknown>>) ?? {};
  const reqList = (schema.schemaDef['required'] as string[]) ?? [];
  const fields: SchemaField[] = Object.entries(props).map(([key, def]) => ({
    id: `f-${key}`, label: String(def['title'] ?? key), internalId: key,
    type: def['type'] === 'number' ? 'numeric' : 'text',
    required: reqList.includes(key), validationRegex: String(def['pattern'] ?? ''),
    inherited: Boolean(def['x-inherited']), localized: Boolean(def['x-localized']),
  }));
  return [{ id: 'g-default', name: 'General Information', required: false, fields }];
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function SchemaVisualEditorPage() {
  // Schema list
  const [schemas, setSchemas]               = useState<ApiSchema[]>([]);
  const [schemasLoading, setSchemasLoading] = useState(true);
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null);

  // Editor state
  const [groups, setGroups]         = useState<AttributeGroup[]>([]);
  const [schemaName, setSchemaName] = useState('');
  const [schemaVersion, setSchemaVersion] = useState('');
  const [schemaDesc, setSchemaDesc] = useState('');
  const [selectedField, setSelectedField]     = useState<SchemaField | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [viewMode, setViewMode]     = useState<'builder' | 'json'>('builder');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  // Properties panel
  const [propLabel, setPropLabel]           = useState('');
  const [propInternalId, setPropInternalId] = useState('');
  const [propRequired, setPropRequired]     = useState(false);
  const [propRegex, setPropRegex]           = useState('');
  const [propLocalized, setPropLocalized]   = useState(false);

  // Save/create
  const [isSaving, setIsSaving]             = useState(false);
  const [saveMsg, setSaveMsg]               = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog]   = useState(false);
  const [newName, setNewName]               = useState('');
  const [newVersion, setNewVersion]         = useState('v1');

  // dnd-kit
  const [activeDrag, setActiveDrag] = useState<
    | { kind: 'fieldType'; ft: typeof FIELD_TYPES[0] }
    | { kind: 'field'; field: SchemaField }
    | null
  >(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const totalFields = groups.reduce((sum, g) => sum + g.fields.length, 0);

  // ── Fetch schemas ─────────────────────────────────────────────────────────
  useEffect(() => {
    setSchemasLoading(true);
    fetch(`${API_BASE}/api/pim/v1/schemas?size=50`)
      .then(r => r.ok ? r.json() : { items: [] })
      .then(data => {
        const list: ApiSchema[] = Array.isArray(data.items) ? data.items : [];
        setSchemas(list);
        if (list.length > 0) loadSchema(list[0]);
      })
      .catch(() => setSchemas([]))
      .finally(() => setSchemasLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadSchema(schema: ApiSchema) {
    setSelectedSchemaId(schema.id);
    setSchemaName(schema.name);
    setSchemaVersion(schema.version);
    setSchemaDesc(schema.description ?? '');
    setGroups(apiToGroups(schema));
    setSelectedField(null);
    setSelectedGroupId(null);
    setSaveMsg(null);
  }

  function selectField(field: SchemaField, groupId: string) {
    setSelectedField(field);
    setSelectedGroupId(groupId);
    setPropLabel(field.label);
    setPropInternalId(field.internalId);
    setPropRequired(field.required);
    setPropRegex(field.validationRegex);
    setPropLocalized(field.localized);
  }

  function applyFieldProperties() {
    if (!selectedField || !selectedGroupId) return;
    const updated: SchemaField = { ...selectedField, label: propLabel, internalId: propInternalId, required: propRequired, validationRegex: propRegex, localized: propLocalized };
    setGroups(prev => prev.map(g =>
      g.id !== selectedGroupId ? g : { ...g, fields: g.fields.map(f => f.id !== selectedField.id ? f : updated) }
    ));
    setSelectedField(updated);
  }

  function addGroup() {
    const id = `g${Date.now()}`;
    setGroups(prev => [...prev, { id, name: 'New Group', required: false, fields: [] }]);
    setEditingGroupId(id);
  }

  function deleteField(groupId: string, fieldId: string) {
    setGroups(prev => prev.map(g => g.id !== groupId ? g : { ...g, fields: g.fields.filter(f => f.id !== fieldId) }));
    if (selectedField?.id === fieldId) { setSelectedField(null); setSelectedGroupId(null); }
  }

  function deleteGroup(groupId: string) {
    setGroups(prev => prev.filter(g => g.id !== groupId));
    if (selectedGroupId === groupId) { setSelectedField(null); setSelectedGroupId(null); }
  }

  const addFieldToGroup = useCallback((groupId: string, fieldType: FieldType) => {
    const typeInfo = FIELD_TYPES.find(t => t.type === fieldType)!;
    const newField: SchemaField = {
      id: `f${Date.now()}`, label: typeInfo.label,
      internalId: `${typeInfo.type}_${Date.now()}`,
      type: fieldType, required: false, validationRegex: '',
      inherited: false, localized: false,
    };
    setGroups(prev => prev.map(g => g.id !== groupId ? g : { ...g, fields: [...g.fields, newField] }));
    // We need groups up-to-date to selectField correctly, so use a timeout to let state flush
    setTimeout(() => selectField(newField, groupId), 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── dnd-kit ──────────────────────────────────────────────────────────────
  function findGroupForField(fieldId: string) {
    return groups.find(g => g.fields.some(f => f.id === fieldId))?.id ?? null;
  }

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    if (id.startsWith('fieldtype:')) {
      const ft = FIELD_TYPES.find(f => f.type === id.slice('fieldtype:'.length));
      if (ft) setActiveDrag({ kind: 'fieldType', ft });
    } else {
      const gid = findGroupForField(id);
      if (gid) {
        const field = groups.find(g => g.id === gid)?.fields.find(f => f.id === id);
        if (field) setActiveDrag({ kind: 'field', field });
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    try {
      if (!over || !activeDrag) return;
      const activeId = String(active.id);
      const overId   = String(over.id);

      if (activeDrag.kind === 'fieldType') {
        // Drop onto a group or a field within a group
        const targetGroupId =
          groups.find(g => g.id === overId)?.id ??
          findGroupForField(overId);
        if (targetGroupId) addFieldToGroup(targetGroupId, activeDrag.ft.type);
        return;
      }

      if (activeDrag.kind === 'field' && activeId !== overId) {
        // Reorder within same group
        setGroups(prev => prev.map(g => {
          const oi = g.fields.findIndex(f => f.id === activeId);
          const ni = g.fields.findIndex(f => f.id === overId);
          if (oi < 0 || ni < 0) return g;
          return { ...g, fields: arrayMove(g.fields, oi, ni) };
        }));
      }
    } finally {
      setActiveDrag(null);
    }
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!selectedSchemaId || isSaving) return;
    setIsSaving(true); setSaveMsg(null);
    try {
      const { schemaDef, attributeGroups, description } = groupsToApiPayload(groups, schemaName, schemaVersion, schemaDesc);
      const res = await fetch(`${API_BASE}/api/pim/v1/schemas/${selectedSchemaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, schemaDef, attributeGroups }),
      });
      setSaveMsg(res.ok ? 'Saved' : 'Failed');
      if (res.ok) {
        const updated: ApiSchema = await res.json();
        setSchemas(prev => prev.map(s => s.id === updated.id ? updated : s));
      }
    } catch { setSaveMsg('Failed'); }
    finally { setIsSaving(false); }
  }

  // ── Create ────────────────────────────────────────────────────────────────
  async function handleCreate() {
    if (!newName.trim() || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/pim/v1/schemas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(), version: newVersion.trim(), description: '',
          schemaDef: { type: 'object', properties: {}, required: [] },
          attributeGroups: { groups: [] }, userId: 'admin',
        }),
      });
      if (res.ok) {
        const created: ApiSchema = await res.json();
        setSchemas(prev => [...prev, created]);
        loadSchema(created);
        setShowNewDialog(false); setNewName(''); setNewVersion('v1');
      }
    } finally { setIsSaving(false); }
  }

  const jsonPreview = JSON.stringify(
    groupsToApiPayload(groups, schemaName, schemaVersion, schemaDesc).schemaDef,
    null, 2
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Breadcrumb */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(66,70,84,0.2)', flexShrink: 0 }}>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink href="/pim">PIM</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Schema Editor</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* ── Column 1: Field Type Picker ────────────────────────────── */}
          <aside style={{ width: 272, flexShrink: 0, background: '#1c1b1b', borderRight: '1px solid rgba(66,70,84,0.15)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8d90a0', marginBottom: 8 }}>Active Schema</p>
              {schemasLoading ? (
                <div style={{ height: 36, background: '#2a2a2a', borderRadius: 8, marginBottom: 20 }} />
              ) : (
                <select
                  value={selectedSchemaId ?? ''}
                  onChange={e => { const s = schemas.find(s => s.id === e.target.value); if (s) loadSchema(s); }}
                  style={{ width: '100%', marginBottom: 20, background: '#2a2a2a', color: '#e5e2e1', border: '1px solid rgba(66,70,84,0.3)', borderRadius: 8, padding: '8px 10px', fontSize: 12, outline: 'none', cursor: 'pointer' }}
                >
                  {schemas.length === 0 && <option value="">No schemas yet</option>}
                  {schemas.map(s => <option key={s.id} value={s.id}>{s.name} ({s.version})</option>)}
                </select>
              )}

              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8d90a0', marginBottom: 14 }}>Field Type Picker</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {FIELD_TYPES.map(ft => <DraggableFieldType key={ft.type} ft={ft} />)}
              </div>
            </div>
            <div style={{ padding: 16, borderTop: '1px solid rgba(66,70,84,0.1)' }}>
              <button
                onClick={() => setShowNewDialog(true)}
                style={{ width: '100%', padding: '10px 0', background: 'linear-gradient(135deg, #b0c6ff, #0058cc)', color: '#002d6f', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                New Schema
              </button>
            </div>
          </aside>

          {/* ── Column 2: Visual Builder ──────────────────────────────────── */}
          <main style={{ flex: 1, background: '#201f1f', padding: 32, overflowY: 'auto' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                <div style={{ flex: 1, marginRight: 16 }}>
                  <input
                    value={schemaName} onChange={e => setSchemaName(e.target.value)} placeholder="Schema name…"
                    style={{ fontSize: 26, fontWeight: 900, color: '#e5e2e1', background: 'transparent', border: 'none', outline: 'none', borderBottom: '2px solid transparent', padding: '4px 0', width: '100%', transition: 'border-color 0.15s' }}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderBottomColor = '#b0c6ff'; }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderBottomColor = 'transparent'; }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: '#8d90a0' }}>Version</span>
                    <input value={schemaVersion} onChange={e => setSchemaVersion(e.target.value)} style={{ width: 60, fontSize: 12, fontFamily: 'monospace', color: '#b0c6ff', background: 'transparent', border: 'none', outline: 'none', borderBottom: '1px solid rgba(66,70,84,0.4)', padding: '2px 4px' }} />
                    <input value={schemaDesc} onChange={e => setSchemaDesc(e.target.value)} placeholder="Description…" style={{ flex: 1, fontSize: 12, color: '#c3c6d6', background: 'transparent', border: 'none', outline: 'none', borderBottom: '1px solid rgba(66,70,84,0.2)', padding: '2px 4px' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, background: '#2a2a2a', padding: 4, borderRadius: 10, flexShrink: 0 }}>
                  {(['builder', 'json'] as const).map(mode => (
                    <button key={mode} onClick={() => setViewMode(mode)} style={{ padding: '6px 14px', fontSize: 11, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer', background: viewMode === mode ? '#131313' : 'transparent', color: viewMode === mode ? '#b0c6ff' : '#8d90a0', textTransform: 'capitalize' }}>
                      {mode === 'json' ? 'JSON' : 'Builder'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loading skeleton */}
              {schemasLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {[1, 2].map(i => <div key={i} style={{ background: '#1c1b1b', borderRadius: 12, height: 140 }} />)}
                </div>
              )}

              {/* Empty state */}
              {!schemasLoading && schemas.length === 0 && (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#8d90a0' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.4 }}>schema</span>
                  <p style={{ fontSize: 14, margin: 0 }}>No schemas yet. Click &quot;New Schema&quot; to get started.</p>
                </div>
              )}

              {/* Builder */}
              {!schemasLoading && viewMode === 'builder' && groups.length > 0 && (
                <SortableContext items={groups.map(g => g.id)} strategy={verticalListSortingStrategy}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                    {groups.map(group => (
                      <SortableGroup
                        key={group.id} group={group}
                        selectedFieldId={selectedField?.id ?? null}
                        isEditingName={editingGroupId === group.id}
                        onStartEditName={() => setEditingGroupId(group.id)}
                        onFinishEditName={name => { setGroups(prev => prev.map(g => g.id !== group.id ? g : { ...g, name })); setEditingGroupId(null); }}
                        onToggleRequired={() => setGroups(prev => prev.map(g => g.id !== group.id ? g : { ...g, required: !g.required }))}
                        onDeleteGroup={() => deleteGroup(group.id)}
                        onSelectField={field => selectField(field, group.id)}
                        onDeleteField={fieldId => deleteField(group.id, fieldId)}
                      />
                    ))}
                  </div>
                </SortableContext>
              )}

              {/* Add group button */}
              {!schemasLoading && schemas.length > 0 && viewMode === 'builder' && (
                <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center' }}>
                  <button
                    onClick={addGroup}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 28px', background: '#353534', borderRadius: 999, border: '1px solid rgba(66,70,84,0.3)', cursor: 'pointer', color: '#e5e2e1', fontWeight: 700, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(176,198,255,0.4)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(66,70,84,0.3)'; }}
                  >
                    <span className="material-symbols-outlined" style={{ color: '#b0c6ff', fontSize: 18 }}>add</span>
                    Add Attribute Group
                  </button>
                </div>
              )}

              {/* JSON preview */}
              {viewMode === 'json' && (
                <pre style={{ background: '#0e0e0e', borderRadius: 12, padding: 24, overflowX: 'auto', fontSize: 12, fontFamily: 'monospace', color: '#b0c6ff', border: '1px solid rgba(66,70,84,0.2)', lineHeight: 1.6 }}>
                  {jsonPreview}
                </pre>
              )}
            </div>
          </main>

          {/* ── Column 3: Field Properties ────────────────────────────────── */}
          <aside style={{ width: 300, flexShrink: 0, background: '#1c1b1b', borderLeft: '1px solid rgba(66,70,84,0.15)', padding: 24, overflowY: 'auto' }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8d90a0', marginBottom: 24 }}>Field Properties</p>

            {selectedField ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Field type badge */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: 'rgba(176,198,255,0.1)', alignSelf: 'flex-start' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#b0c6ff' }}>{FIELD_TYPES.find(f => f.type === selectedField.type)?.icon ?? 'text_fields'}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#b0c6ff', textTransform: 'capitalize' }}>{FIELD_TYPES.find(f => f.type === selectedField.type)?.label ?? selectedField.type}</span>
                </div>

                <PropInput label="Label" value={propLabel} onChange={setPropLabel} />
                <PropInput label="Internal ID" value={propInternalId} onChange={setPropInternalId} mono prefix="#" />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#2a2a2a', borderRadius: 8 }}>
                  <div><p style={{ fontSize: 12, fontWeight: 700, margin: '0 0 2px 0', color: '#e5e2e1' }}>Required</p><p style={{ fontSize: 10, color: '#8d90a0', margin: 0 }}>Mandatory in catalog</p></div>
                  <ToggleSwitch checked={propRequired} onChange={setPropRequired} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#2a2a2a', borderRadius: 8 }}>
                  <div><p style={{ fontSize: 12, fontWeight: 700, margin: '0 0 2px 0', color: '#e5e2e1' }}>Localized</p><p style={{ fontSize: 10, color: '#8d90a0', margin: 0 }}>Translated per locale</p></div>
                  <ToggleSwitch checked={propLocalized} onChange={setPropLocalized} />
                </div>

                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#8d90a0', margin: '0 0 6px 4px' }}>Validation Regex</p>
                  <textarea value={propRegex} onChange={e => setPropRegex(e.target.value)} rows={2} placeholder="/^pattern$/i" style={{ width: '100%', background: '#353534', border: 'none', borderBottom: '1px solid rgba(66,70,84,0.5)', borderRadius: '4px 4px 0 0', padding: '8px 12px', fontSize: 11, fontFamily: 'monospace', color: '#e5e2e1', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                  <p style={{ fontSize: 9, color: '#8d90a0', margin: '4px 0 0 4px', fontStyle: 'italic' }}>Optional pattern for validation</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
                  <button onClick={() => { setPropLabel(selectedField.label); setPropInternalId(selectedField.internalId); setPropRequired(selectedField.required); setPropRegex(selectedField.validationRegex); setPropLocalized(selectedField.localized); }} style={{ width: '100%', padding: '10px 0', background: '#353534', border: '1px solid rgba(66,70,84,0.3)', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#c3c6d6', cursor: 'pointer' }}>Reset</button>
                  <button onClick={applyFieldProperties} style={{ width: '100%', padding: '10px 0', background: '#b0c6ff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#002d6f', cursor: 'pointer' }}>Apply Changes</button>
                </div>

                {/* Schema summary */}
                <div style={{ marginTop: 12, paddingTop: 20, borderTop: '1px solid rgba(66,70,84,0.15)' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#8d90a0', marginBottom: 12 }}>Schema Summary</p>
                  <div style={{ padding: 14, background: '#131313', borderRadius: 10, border: '1px solid rgba(66,70,84,0.15)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 6, background: '#0058cc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ color: '#b0c6ff', fontSize: 18 }}>inventory</span>
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, margin: 0, color: '#e5e2e1' }}>{schemaName || '—'}</p>
                        <p style={{ fontSize: 10, color: '#8d90a0', margin: 0 }}>{totalFields} Fields / {groups.length} Groups</p>
                      </div>
                    </div>
                    <div style={{ height: 3, borderRadius: 999, background: '#2a2a2a', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, totalFields * 6)}%`, height: '100%', background: '#b0c6ff', transition: 'width 0.3s' }} />
                    </div>
                    <p style={{ fontSize: 10, color: '#8d90a0', margin: '6px 0 0 0' }}>Version {schemaVersion || '—'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#8d90a0' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 8, opacity: 0.4 }}>touch_app</span>
                <p style={{ fontSize: 12, margin: 0 }}>Click a field or drag a type to add one</p>
              </div>
            )}
          </aside>
        </div>

        {/* DragOverlay */}
        <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
          {activeDrag?.kind === 'fieldType' && (
            <div style={{ padding: '10px 14px', background: '#324575', border: '1px solid rgba(176,198,255,0.4)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', opacity: 0.9 }}>
              <span className="material-symbols-outlined" style={{ color: activeDrag.ft.color, fontSize: 18 }}>{activeDrag.ft.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#e5e2e1' }}>{activeDrag.ft.label}</span>
            </div>
          )}
          {activeDrag?.kind === 'field' && (
            <div style={{ padding: '12px 16px', background: '#2a2a2a', border: '1px solid rgba(176,198,255,0.3)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', opacity: 0.9 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#e5e2e1', margin: '0 0 2px 0' }}>{activeDrag.field.label}</p>
              <p style={{ fontSize: 10, fontFamily: 'monospace', color: '#8d90a0', margin: 0 }}>#{activeDrag.field.internalId}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Save FAB */}
      <div style={{ position: 'fixed', right: 24, bottom: 24, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 50 }}>
        {saveMsg && (
          <div style={{ background: saveMsg === 'Saved' ? '#b0c6ff' : '#ffb4ab', color: saveMsg === 'Saved' ? '#002d6f' : '#690005', fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 999, textAlign: 'center' }}>
            {saveMsg}
          </div>
        )}
        <button onClick={handleSave} disabled={isSaving || !selectedSchemaId} title="Save schema" style={{ width: 48, height: 48, borderRadius: '50%', background: isSaving ? '#424654' : '#b0c6ff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: selectedSchemaId ? 'pointer' : 'not-allowed', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', transition: 'background 0.2s' }}>
          <span className="material-symbols-outlined" style={{ color: '#002d6f', fontSize: 20 }}>
            {isSaving ? 'hourglass_empty' : saveMsg === 'Saved' ? 'check' : 'save'}
          </span>
        </button>
      </div>

      {/* New schema dialog */}
      {showNewDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1c1b1b', borderRadius: 16, padding: 32, width: 360, border: '1px solid rgba(66,70,84,0.3)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#e5e2e1', margin: '0 0 8px 0' }}>New Schema</h2>
            <p style={{ fontSize: 12, color: '#8d90a0', margin: '0 0 24px 0' }}>Create a new product attribute schema.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
              <PropInput label="Schema Name" value={newName} onChange={setNewName} placeholder="e.g. Vehicle" />
              <PropInput label="Version" value={newVersion} onChange={setNewVersion} placeholder="e.g. v1" mono />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowNewDialog(false)} style={{ flex: 1, padding: '10px 0', borderRadius: 8, background: '#353534', border: '1px solid rgba(66,70,84,0.3)', color: '#c3c6d6', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreate} disabled={isSaving || !newName.trim()} style={{ flex: 2, padding: '10px 0', borderRadius: 8, background: '#b0c6ff', border: 'none', color: '#002d6f', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: !newName.trim() ? 0.5 : 1 }}>
                {isSaving ? 'Creating…' : 'Create Schema'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SortableGroup
// ---------------------------------------------------------------------------

function SortableGroup({ group, selectedFieldId, isEditingName, onStartEditName, onFinishEditName, onToggleRequired, onDeleteGroup, onSelectField, onDeleteField }: {
  group: AttributeGroup; selectedFieldId: string | null;
  isEditingName: boolean; onStartEditName: () => void;
  onFinishEditName: (name: string) => void; onToggleRequired: () => void;
  onDeleteGroup: () => void;
  onSelectField: (f: SchemaField) => void; onDeleteField: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: group.id });
  const [editName, setEditName] = useState(group.name);

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}>
      {/* Group header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span {...attributes} {...listeners} className="material-symbols-outlined" style={{ color: '#424654', fontSize: 18, cursor: 'grab', touchAction: 'none' }}>drag_indicator</span>
          {isEditingName ? (
            <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} onBlur={() => onFinishEditName(editName)} onKeyDown={e => e.key === 'Enter' && onFinishEditName(editName)}
              style={{ fontSize: 16, fontWeight: 700, color: '#e5e2e1', background: 'transparent', border: 'none', borderBottom: '2px solid #b0c6ff', outline: 'none', padding: '2px 0' }} />
          ) : (
            <h3 onDoubleClick={onStartEditName} title="Double-click to rename" style={{ fontSize: 16, fontWeight: 700, color: '#e5e2e1', margin: 0, cursor: 'text' }}>{group.name}</h3>
          )}
          {group.required && (
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: '#324575', color: '#a1b4eb', padding: '2px 8px', borderRadius: 999 }}>Required</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          <IconBtn title="Rename" onClick={onStartEditName} icon="edit" />
          <IconBtn title="Toggle required" onClick={onToggleRequired} icon="star" color={group.required ? '#b0c6ff' : undefined} />
          <IconBtn title="Delete group" onClick={onDeleteGroup} icon="delete" danger />
        </div>
      </div>

      {/* Field rows */}
      <SortableContext items={group.fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
        <div style={{
          background: '#131313', borderRadius: 12,
          border: `${group.fields.length === 0 ? '2px dashed' : '1px solid'} rgba(66,70,84,0.25)`,
          overflow: 'hidden', minHeight: group.fields.length === 0 ? 90 : undefined,
        }}>
          {group.fields.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 90, opacity: 0.4, gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 28 }}>add_circle</span>
              <p style={{ fontSize: 11, margin: 0 }}>Drag a field type here to add</p>
            </div>
          ) : (
            group.fields.map((field, idx) => (
              <SortableFieldRow key={field.id} field={field} isSelected={selectedFieldId === field.id} isEven={idx % 2 === 1} onClick={() => onSelectField(field)} onDelete={() => onDeleteField(field.id)} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SortableFieldRow
// ---------------------------------------------------------------------------

function SortableFieldRow({ field, isSelected, isEven, onClick, onDelete }: { field: SchemaField; isSelected: boolean; isEven: boolean; onClick: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const ft = FIELD_TYPES.find(f => f.type === field.type);
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }} onClick={onClick}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(66,70,84,0.07)', background: isSelected ? 'rgba(176,198,255,0.08)' : isEven ? 'rgba(28,27,27,0.3)' : undefined }}>
        <span {...attributes} {...listeners} className="material-symbols-outlined" style={{ color: 'rgba(141,144,160,0.3)', fontSize: 16, marginRight: 8, cursor: 'grab', touchAction: 'none', flexShrink: 0 }} onClick={e => e.stopPropagation()}>drag_pan</span>
        <span className="material-symbols-outlined" style={{ color: ft?.color ?? '#8d90a0', fontSize: 16, marginRight: 10, flexShrink: 0 }}>{ft?.icon ?? 'text_fields'}</span>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 72px', alignItems: 'center', gap: 8 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#e5e2e1', margin: '0 0 2px 0' }}>{field.label}</p>
            <p style={{ fontSize: 10, fontFamily: 'monospace', color: '#8d90a0', margin: 0 }}>#{field.internalId}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {field.localized && <FieldChip icon="translate" label="Localized" />}
            {field.validationRegex && <FieldChip icon="verified" label="Regex" />}
            {field.required && <FieldChip icon="priority_high" label="Required" />}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {field.inherited ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: 'rgba(176,198,255,0.08)', border: '1px solid rgba(176,198,255,0.2)', borderRadius: 999 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#b0c6ff' }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: '#b0c6ff', textTransform: 'uppercase' }}>Inherited</span>
              </div>
            ) : (
              <span style={{ fontSize: 10, color: '#8d90a0', fontStyle: 'italic' }}>Local</span>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <IconBtn title="Edit" onClick={e => { e.stopPropagation(); onClick(); }} icon="edit" />
            <IconBtn title="Delete" onClick={e => { e.stopPropagation(); onDelete(); }} icon="delete" danger />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DraggableFieldType
// ---------------------------------------------------------------------------

function DraggableFieldType({ ft }: { ft: typeof FIELD_TYPES[0] }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `fieldtype:${ft.type}`, data: { kind: 'fieldType', ft } });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={{ padding: 12, background: isDragging ? '#2a3a5e' : '#201f1f', borderRadius: 8, border: isDragging ? '1px solid rgba(176,198,255,0.4)' : '1px solid rgba(66,70,84,0.2)', cursor: 'grab', display: 'flex', alignItems: 'center', gap: 10, opacity: isDragging ? 0.5 : 1, touchAction: 'none', transition: 'all 0.15s' }}
      onMouseEnter={e => { if (!isDragging) { const el = e.currentTarget as HTMLDivElement; el.style.background = '#2a2a2a'; el.style.borderColor = 'rgba(176,198,255,0.2)'; } }}
      onMouseLeave={e => { if (!isDragging) { const el = e.currentTarget as HTMLDivElement; el.style.background = '#201f1f'; el.style.borderColor = 'rgba(66,70,84,0.2)'; } }}
    >
      <span className="material-symbols-outlined" style={{ color: ft.color, fontSize: 20 }}>{ft.icon}</span>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#e5e2e1', margin: 0 }}>{ft.label}</p>
        <p style={{ fontSize: 10, color: '#8d90a0', margin: 0 }}>{ft.description}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Micro helpers
// ---------------------------------------------------------------------------

function FieldChip({ icon, label }: { icon: string; label: string }) {
  return (
    <span style={{ fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 3, color: '#c3c6d6', background: '#201f1f', padding: '2px 6px', borderRadius: 4 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 11 }}>{icon}</span>
      {label}
    </span>
  );
}

function PropInput({ label, value, onChange, mono, prefix, placeholder }: { label: string; value: string; onChange: (v: string) => void; mono?: boolean; prefix?: string; placeholder?: string }) {
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#8d90a0', margin: '0 0 6px 4px' }}>{label}</p>
      <div style={{ position: 'relative' }}>
        {prefix && <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#b0c6ff', fontSize: 12, fontFamily: 'monospace' }}>{prefix}</span>}
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%', background: '#353534', border: 'none', borderBottom: '1px solid rgba(66,70,84,0.5)', borderRadius: '4px 4px 0 0', padding: '8px 12px 8px ${prefix ? 22 : 12}px', fontSize: mono ? 12 : 13, fontFamily: mono ? 'monospace' : 'Inter, sans-serif', color: '#e5e2e1', outline: 'none', boxSizing: 'border-box' }} onFocus={e => { (e.target as HTMLInputElement).style.borderBottomColor = '#b0c6ff'; }} onBlur={e => { (e.target as HTMLInputElement).style.borderBottomColor = 'rgba(66,70,84,0.5)'; }} />
      </div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!checked)} style={{ width: 36, height: 20, background: checked ? '#b0c6ff' : '#353534', borderRadius: 999, position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 2, left: checked ? 18 : 2, width: 16, height: 16, background: 'white', borderRadius: '50%', transition: 'left 0.2s' }} />
    </div>
  );
}

function IconBtn({ icon, title, onClick, color, danger }: { icon: string; title: string; onClick: (e: React.MouseEvent) => void; color?: string; danger?: boolean }) {
  return (
    <button onClick={onClick} title={title} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: color ?? '#8d90a0' }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = danger ? '#ffb4ab' : (color ?? '#e5e2e1'); }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = color ?? '#8d90a0'; }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{icon}</span>
    </button>
  );
}
