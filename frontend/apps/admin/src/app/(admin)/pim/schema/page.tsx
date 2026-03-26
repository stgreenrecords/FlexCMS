'use client';

import React, { useState } from 'react';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem,
  BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage,
} from '@flexcms/ui';

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

// ---------------------------------------------------------------------------
// Field type palette
// ---------------------------------------------------------------------------

const FIELD_TYPES: Array<{ type: FieldType; label: string; description: string; icon: string; color: string }> = [
  { type: 'text',     label: 'Text Input',  description: 'Standard string field',          icon: 'text_fields',    color: 'var(--color-primary)' },
  { type: 'numeric',  label: 'Numeric',     description: 'Integer or decimal values',       icon: '123',            color: 'var(--color-secondary)' },
  { type: 'select',   label: 'Select',      description: 'Dropdown or radio list',          icon: 'list',           color: 'var(--color-tertiary)' },
  { type: 'assets',   label: 'Assets',      description: 'DAM media links',                 icon: 'image',          color: 'var(--color-primary)' },
  { type: 'datetime', label: 'Date & Time', description: 'ISO formatted temporal data',     icon: 'calendar_today', color: 'var(--color-secondary)' },
  { type: 'relation', label: 'Relation',    description: 'Link to other schemas',           icon: 'database',       color: 'var(--color-tertiary)' },
];

// ---------------------------------------------------------------------------
// Initial mock schema
// ---------------------------------------------------------------------------

const INITIAL_GROUPS: AttributeGroup[] = [
  {
    id: 'g1',
    name: 'General Information',
    required: true,
    fields: [
      { id: 'f1', label: 'SKU Identifier',  internalId: 'sku_id',         type: 'text',    required: true,  validationRegex: '/^[A-Z]{3}-\\d{4}-[A-Z0-9]{2}$/i', inherited: true,  localized: false },
      { id: 'f2', label: 'Product Title',   internalId: 'title_localized', type: 'text',   required: true,  validationRegex: '',                                  inherited: false, localized: true  },
    ],
  },
  {
    id: 'g2',
    name: 'Technical Specs',
    required: false,
    fields: [],
  },
];

// ---------------------------------------------------------------------------
// Schema Visual Editor
// ---------------------------------------------------------------------------

function SchemaVisualEditorPage() {
  const [groups, setGroups] = useState<AttributeGroup[]>(INITIAL_GROUPS);
  const [selectedField, setSelectedField] = useState<SchemaField | null>(INITIAL_GROUPS[0].fields[0]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>('g1');
  const [schemaName] = useState('Product Master');
  const [viewMode, setViewMode] = useState<'builder' | 'diff'>('builder');
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);

  // Properties panel state (mirrors selected field)
  const [propLabel, setPropLabel] = useState(selectedField?.label ?? '');
  const [propInternalId, setPropInternalId] = useState(selectedField?.internalId ?? '');
  const [propRequired, setPropRequired] = useState(selectedField?.required ?? false);
  const [propRegex, setPropRegex] = useState(selectedField?.validationRegex ?? '');

  const totalFields = groups.reduce((sum, g) => sum + g.fields.length, 0);

  function selectField(field: SchemaField, groupId: string) {
    setSelectedField(field);
    setSelectedGroupId(groupId);
    setPropLabel(field.label);
    setPropInternalId(field.internalId);
    setPropRequired(field.required);
    setPropRegex(field.validationRegex);
  }

  function updateFieldProperties() {
    if (!selectedField || !selectedGroupId) return;
    setGroups(prev => prev.map(g => {
      if (g.id !== selectedGroupId) return g;
      return {
        ...g,
        fields: g.fields.map(f => f.id !== selectedField.id ? f : {
          ...f,
          label: propLabel,
          internalId: propInternalId,
          required: propRequired,
          validationRegex: propRegex,
        }),
      };
    }));
    setSelectedField(prev => prev ? { ...prev, label: propLabel, internalId: propInternalId, required: propRequired, validationRegex: propRegex } : prev);
  }

  function addGroup() {
    const id = `g${Date.now()}`;
    setGroups(prev => [...prev, { id, name: 'New Group', required: false, fields: [] }]);
  }

  function deleteField(groupId: string, fieldId: string) {
    setGroups(prev => prev.map(g => g.id !== groupId ? g : { ...g, fields: g.fields.filter(f => f.id !== fieldId) }));
    if (selectedField?.id === fieldId) setSelectedField(null);
  }

  function dropFieldType(groupId: string, fieldType: FieldType) {
    const typeInfo = FIELD_TYPES.find(t => t.type === fieldType)!;
    const newField: SchemaField = {
      id: `f${Date.now()}`,
      label: typeInfo.label,
      internalId: typeInfo.type + '_' + Date.now(),
      type: fieldType,
      required: false,
      validationRegex: '',
      inherited: false,
      localized: false,
    };
    setGroups(prev => prev.map(g => g.id !== groupId ? g : { ...g, fields: [...g.fields, newField] }));
    selectField(newField, groupId);
    setDragOverGroup(null);
  }

  function onDragStart(e: React.DragEvent, fieldType: FieldType) {
    e.dataTransfer.setData('fieldType', fieldType);
  }

  function onDrop(e: React.DragEvent, groupId: string) {
    e.preventDefault();
    const fieldType = e.dataTransfer.getData('fieldType') as FieldType;
    if (fieldType) dropFieldType(groupId, fieldType);
  }

  function onDragOver(e: React.DragEvent, groupId: string) {
    e.preventDefault();
    setDragOverGroup(groupId);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Breadcrumb */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-outline-variant, #424654)', flexShrink: 0 }}>
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

      {/* 3-column layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Column 1: Field Type Picker ──────────────────────────────── */}
        <aside style={{
          width: 272,
          background: 'var(--color-surface-container-low, #1c1b1b)',
          borderRight: '1px solid var(--color-outline-variant, #424654)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}>
          <div style={{ padding: '24px', flex: 1 }}>
            <h2 style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-outline)', marginBottom: 20 }}>
              Field Type Picker
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FIELD_TYPES.map(ft => (
                <div
                  key={ft.type}
                  draggable
                  onDragStart={e => onDragStart(e, ft.type)}
                  style={{
                    padding: '12px',
                    background: 'var(--color-surface-container)',
                    borderRadius: 8,
                    border: '1px solid transparent',
                    cursor: 'grab',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-container-high)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'color-mix(in srgb, var(--color-primary) 20%, transparent)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-container)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent'; }}
                >
                  <span className="material-symbols-outlined" style={{ color: ft.color, fontSize: 20 }}>{ft.icon}</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-on-surface)', margin: 0 }}>{ft.label}</p>
                    <p style={{ fontSize: 10, color: 'var(--color-on-surface-variant)', margin: 0 }}>{ft.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: '16px 24px', background: 'rgba(0,0,0,0.2)' }}>
            <button style={{
              width: '100%',
              padding: '10px 0',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-container))',
              color: 'var(--color-on-primary)',
              border: 'none',
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
              Create New Product
            </button>
          </div>
        </aside>

        {/* ── Column 2: Visual Attribute Group Builder ─────────────────── */}
        <main style={{
          flex: 1,
          background: 'var(--color-surface-container)',
          padding: '32px',
          overflowY: 'auto',
        }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--color-on-surface)', margin: '0 0 4px 0' }}>{schemaName}</h1>
                <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', margin: 0 }}>Define global product attribute inheritance and grouping.</p>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'var(--color-surface-container-high)',
                padding: 4,
                borderRadius: 10,
              }}>
                <button
                  onClick={() => setViewMode('builder')}
                  style={{
                    padding: '6px 14px',
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    background: viewMode === 'builder' ? 'var(--color-surface-container)' : 'transparent',
                    color: viewMode === 'builder' ? 'var(--color-primary-fixed)' : 'var(--color-outline)',
                  }}
                >Builder</button>
                <button
                  onClick={() => setViewMode('diff')}
                  style={{
                    padding: '6px 14px',
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    background: viewMode === 'diff' ? 'var(--color-surface-container)' : 'transparent',
                    color: viewMode === 'diff' ? 'var(--color-primary-fixed)' : 'var(--color-outline)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>difference</span>
                  Diff View
                </button>
              </div>
            </div>

            {/* Attribute Groups */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {groups.map(group => (
                <div key={group.id}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '0 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--color-outline)', fontSize: 18 }}>drag_indicator</span>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }}>{group.name}</h3>
                      {group.required && (
                        <span style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          background: 'var(--color-secondary-container)',
                          color: 'var(--color-on-secondary-container)',
                          padding: '2px 8px',
                          borderRadius: 999,
                        }}>Required</span>
                      )}
                    </div>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-outline)' }}>
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  </div>

                  {/* Drop zone */}
                  <div
                    onDrop={e => onDrop(e, group.id)}
                    onDragOver={e => onDragOver(e, group.id)}
                    onDragLeave={() => setDragOverGroup(null)}
                    style={{
                      background: 'var(--color-surface-container-lowest)',
                      borderRadius: 12,
                      border: `${group.fields.length === 0 ? '2px dashed' : '1px solid'} ${dragOverGroup === group.id ? 'var(--color-primary)' : 'rgba(66,70,84,0.3)'}`,
                      overflow: 'hidden',
                      minHeight: group.fields.length === 0 ? 100 : undefined,
                      transition: 'border-color 0.15s',
                    }}
                  >
                    {group.fields.length === 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 100, opacity: 0.4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 36, marginBottom: 8 }}>add_circle</span>
                        <p style={{ fontSize: 12, margin: 0 }}>Drag attributes here to add to group</p>
                      </div>
                    ) : (
                      group.fields.map((field, idx) => (
                        <FieldRow
                          key={field.id}
                          field={field}
                          isSelected={selectedField?.id === field.id}
                          isEven={idx % 2 === 1}
                          onClick={() => selectField(field, group.id)}
                          onDelete={() => deleteField(group.id, field.id)}
                        />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Attribute Group */}
            <div style={{ marginTop: 48, display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={addGroup}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 32px',
                  background: 'var(--color-surface-container-highest)',
                  borderRadius: 999,
                  border: '1px solid rgba(66,70,84,0.3)',
                  cursor: 'pointer',
                  color: 'var(--color-on-surface)',
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(66,70,84,0.3)'; }}
              >
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>add</span>
                Add New Attribute Group
              </button>
            </div>
          </div>
        </main>

        {/* ── Column 3: Field Properties ────────────────────────────────── */}
        <aside style={{
          width: 300,
          background: 'var(--color-surface-container-low)',
          borderLeft: '1px solid var(--color-outline-variant, #424654)',
          padding: '24px',
          overflowY: 'auto',
          flexShrink: 0,
        }}>
          <h2 style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-outline)', marginBottom: 24 }}>
            Field Properties
          </h2>

          {selectedField ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Label */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-on-surface-variant)', display: 'block', marginBottom: 6 }}>Label</label>
                <input
                  type="text"
                  value={propLabel}
                  onChange={e => setPropLabel(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--color-surface-container-highest)',
                    border: 'none',
                    borderBottom: '1px solid rgba(66,70,84,0.5)',
                    borderRadius: '4px 4px 0 0',
                    padding: '8px 12px',
                    fontSize: 13,
                    color: 'var(--color-on-surface)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Internal ID */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-on-surface-variant)', display: 'block', marginBottom: 6 }}>Internal ID</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)', fontSize: 12, fontFamily: 'monospace' }}>#</span>
                  <input
                    type="text"
                    value={propInternalId}
                    onChange={e => setPropInternalId(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--color-surface-container-highest)',
                      border: 'none',
                      borderBottom: '1px solid rgba(66,70,84,0.5)',
                      borderRadius: '4px 4px 0 0',
                      padding: '8px 12px 8px 22px',
                      fontSize: 12,
                      fontFamily: 'monospace',
                      color: 'var(--color-on-surface)',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Required toggle */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                background: 'var(--color-surface-container-high)',
                borderRadius: 8,
              }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, margin: '0 0 2px 0', color: 'var(--color-on-surface)' }}>Required Field</p>
                  <p style={{ fontSize: 10, color: 'var(--color-outline)', margin: 0 }}>Mandatory in catalog</p>
                </div>
                <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={propRequired}
                    onChange={e => setPropRequired(e.target.checked)}
                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                  />
                  <div style={{
                    width: 36,
                    height: 20,
                    background: propRequired ? 'var(--color-primary)' : 'var(--color-surface-container-highest)',
                    borderRadius: 999,
                    position: 'relative',
                    transition: 'background 0.2s',
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 2,
                      left: propRequired ? 18 : 2,
                      width: 16,
                      height: 16,
                      background: 'white',
                      borderRadius: '50%',
                      transition: 'left 0.2s',
                    }} />
                  </div>
                </label>
              </div>

              {/* Validation Regex */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-on-surface-variant)', display: 'block', marginBottom: 6 }}>Validation Regex</label>
                <textarea
                  value={propRegex}
                  onChange={e => setPropRegex(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%',
                    background: 'var(--color-surface-container-highest)',
                    border: 'none',
                    borderBottom: '1px solid rgba(66,70,84,0.5)',
                    borderRadius: '4px 4px 0 0',
                    padding: '8px 12px',
                    fontSize: 11,
                    fontFamily: 'monospace',
                    color: 'var(--color-on-surface)',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <p style={{ fontSize: 9, color: 'var(--color-outline)', margin: '4px 0 0 4px', fontStyle: 'italic' }}>Pattern for validation</p>
              </div>

              {/* Actions */}
              <div style={{ paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  style={{
                    width: '100%',
                    padding: '10px 0',
                    background: 'var(--color-surface-variant)',
                    border: '1px solid rgba(66,70,84,0.3)',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--color-on-surface)',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setPropLabel(selectedField.label);
                    setPropInternalId(selectedField.internalId);
                    setPropRequired(selectedField.required);
                    setPropRegex(selectedField.validationRegex);
                  }}
                >
                  Reset Defaults
                </button>
                <button
                  style={{
                    width: '100%',
                    padding: '10px 0',
                    background: 'var(--color-primary)',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--color-on-primary)',
                    cursor: 'pointer',
                  }}
                  onClick={updateFieldProperties}
                >
                  Update Field Attributes
                </button>
              </div>

              {/* Schema Summary */}
              <div style={{ marginTop: 16, paddingTop: 24, borderTop: '1px solid rgba(66,70,84,0.2)' }}>
                <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-on-surface-variant)', display: 'block', marginBottom: 12 }}>Schema Summary</label>
                <div style={{
                  padding: 16,
                  background: 'var(--color-surface-container-lowest)',
                  borderRadius: 12,
                  border: '1px solid rgba(66,70,84,0.2)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{
                      width: 40, height: 40,
                      borderRadius: 6,
                      background: 'var(--color-primary-container)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: 20 }}>inventory</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, margin: 0, color: 'var(--color-on-surface)' }}>{schemaName}</p>
                      <p style={{ fontSize: 10, color: 'var(--color-outline)', margin: 0 }}>{totalFields} Attributes / {groups.length} Groups</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: 'var(--color-outline)' }}>Inheritance</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)' }}>Active (v2.4)</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 999, background: 'var(--color-surface-container-highest)', overflow: 'hidden' }}>
                    <div style={{ width: '85%', height: '100%', background: 'var(--color-primary)' }} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-outline)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 8, opacity: 0.5 }}>touch_app</span>
              <p style={{ fontSize: 12, margin: 0 }}>Select a field to edit its properties</p>
            </div>
          )}
        </aside>
      </div>

      {/* Floating action buttons */}
      <div style={{ position: 'fixed', right: 24, bottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button style={{
          width: 48, height: 48,
          borderRadius: '50%',
          background: 'var(--color-surface-container-highest)',
          border: '1px solid rgba(66,70,84,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-outline)', fontSize: 20 }}>history</span>
        </button>
        <button style={{
          width: 48, height: 48,
          borderRadius: '50%',
          background: 'var(--color-primary)',
          border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-on-primary)', fontSize: 20 }}>save</span>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field Row sub-component
// ---------------------------------------------------------------------------

interface FieldRowProps {
  field: SchemaField;
  isSelected: boolean;
  isEven: boolean;
  onClick: () => void;
  onDelete: () => void;
}

function FieldRow({ field, isSelected, isEven, onClick, onDelete }: FieldRowProps) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '14px 16px',
        cursor: 'pointer',
        borderBottom: '1px solid rgba(66,70,84,0.07)',
        background: isSelected
          ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)'
          : isEven
          ? 'rgba(28,27,27,0.3)'
          : undefined,
        transition: 'background 0.1s',
      }}
    >
      {/* Drag handle */}
      <span className="material-symbols-outlined" style={{ color: 'rgba(141,144,160,0.3)', fontSize: 18, marginRight: 8 }}>drag_pan</span>

      {/* Field info grid */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px', alignItems: 'center', gap: 8 }}>
        {/* Name & ID */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-on-surface)', margin: '0 0 2px 0' }}>{field.label}</p>
          <p style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--color-outline)', margin: 0 }}>#{field.internalId}</p>
        </div>

        {/* Flags */}
        <div>
          {field.localized && (
            <span style={{
              fontSize: 10,
              display: 'inline-flex', alignItems: 'center', gap: 4,
              color: 'var(--color-on-surface-variant)',
              background: 'var(--color-surface-container)',
              padding: '3px 8px', borderRadius: 4,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>translate</span>
              Localized
            </span>
          )}
          {field.validationRegex && (
            <span style={{
              fontSize: 10,
              display: 'inline-flex', alignItems: 'center', gap: 4,
              color: 'var(--color-on-surface-variant)',
              background: 'var(--color-surface-container)',
              padding: '3px 8px', borderRadius: 4,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>verified</span>
              Regex
            </span>
          )}
        </div>

        {/* Inherited / Local */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {field.inherited ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '3px 12px',
              background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)',
              borderRadius: 999,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)' }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>Inherited</span>
            </div>
          ) : (
            <span style={{ fontSize: 10, color: 'var(--color-outline)', fontStyle: 'italic' }}>Local Only</span>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
          <button
            onClick={e => { e.stopPropagation(); onClick(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-outline)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-outline)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SchemaVisualEditorPage;
