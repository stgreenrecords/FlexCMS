'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem,
  BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage,
  Skeleton,
} from '@flexcms/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WizardStep = 1 | 2 | 3 | 4 | 5;

interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

type FileFormat = 'csv' | 'json' | 'excel';
type Delimiter = ',' | ';' | '\t' | '|';

interface ColumnMapping {
  sourceColumn: string;
  sampleValue: string;
  destination: string;
  status: 'mapped' | 'unmapped' | 'error';
}

interface ValidationIssue {
  type: 'error' | 'warning';
  field: string;
  message: string;
}

interface PreviewRow {
  sku: string;
  name: string;
  price: string;
  inventory: string;
  [key: string]: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEP_LABELS: Record<WizardStep, string> = {
  1: 'Upload',
  2: 'Format',
  3: 'Mapping',
  4: 'Preview',
  5: 'Execute',
};

const DESTINATION_OPTIONS = [
  'Unique Identifier (SKU)',
  'Display Title (Localized)',
  'Long Description',
  'MSRP (Price)',
  'Discount Price',
  'Wholesale Cost',
  'Warehouse Quantity',
  'Reserved Stock',
  'Buffer Stock',
  'Manufacturer',
  'Category',
  'Tags',
  'Weight (kg)',
  'Dimensions',
  'Color',
  'Material',
  '— Skip this column —',
];

const INITIAL_MAPPINGS: ColumnMapping[] = [
  { sourceColumn: 'SKU_ID',           sampleValue: 'PRD-99201-X',            destination: 'Unique Identifier (SKU)',    status: 'mapped' },
  { sourceColumn: 'Product_Name_EN',  sampleValue: 'Ergonomic Office Chair',  destination: 'Display Title (Localized)', status: 'mapped' },
  { sourceColumn: 'Price_USD',        sampleValue: '299.00',                  destination: 'MSRP (Price)',              status: 'mapped' },
  { sourceColumn: 'Inventory_Count',  sampleValue: '142',                     destination: '',                          status: 'unmapped' },
  { sourceColumn: 'Description_Long', sampleValue: 'A premium ergonomic...',  destination: 'Long Description',         status: 'mapped' },
  { sourceColumn: 'Brand',            sampleValue: 'ErgoTech',                destination: 'Manufacturer',             status: 'mapped' },
  { sourceColumn: 'Category_Path',    sampleValue: 'Furniture/Office',        destination: 'Category',                 status: 'mapped' },
  { sourceColumn: 'Weight_KG',        sampleValue: '18.5',                    destination: 'Weight (kg)',              status: 'mapped' },
];

const VALIDATION_ISSUES: ValidationIssue[] = [
  { type: 'error',   field: 'Price_USD',       message: "3 rows contain non-numeric characters." },
  { type: 'warning', field: 'Product_Name_EN', message: "12 records are missing this value." },
];

const PREVIEW_ROWS: PreviewRow[] = [
  { sku: 'PRD-99201-X', name: 'Ergonomic Office Chair Pro',  price: '299.00', inventory: '142' },
  { sku: 'PRD-99202-Y', name: 'Standing Desk Frame XL',       price: '449.00', inventory: '87'  },
  { sku: 'PRD-99203-Z', name: 'Monitor Arm Dual',             price: '129.00', inventory: '0'   },
  { sku: 'PRD-99204-A', name: 'Mesh Lumbar Support Cushion',  price: '59.99',  inventory: '320' },
  { sku: 'PRD-99205-B', name: 'Cable Management Kit',         price: '24.99',  inventory: '512' },
];

// ---------------------------------------------------------------------------
// Step 1 — Upload
// ---------------------------------------------------------------------------

interface Step1Props {
  onFileSelected: (file: UploadedFile) => void;
  onCatalogSelected: (catalogId: string) => void;
  file: UploadedFile | null;
  catalogId: string;
}

function Step1Upload({ onFileSelected, onCatalogSelected, file, catalogId }: Step1Props) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      onFileSelected({ name: dropped.name, size: dropped.size, type: dropped.type });
    }
  }, [onFileSelected]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      onFileSelected({ name: selected.name, size: selected.size, type: selected.type });
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Target catalog */}
      <div className="p-6 rounded-xl" style={{ background: '#1c1b1b', border: '1px solid rgba(66,70,84,0.1)' }}>
        <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#c3c6d6' }}>
          Target Catalog
        </label>
        <select
          value={catalogId}
          onChange={(e) => onCatalogSelected(e.target.value)}
          className="w-full text-sm rounded-lg px-4 py-3 appearance-none"
          style={{ background: '#353534', border: 'none', color: '#e5e2e1', outline: 'none' }}
        >
          <option value="">Select a catalog...</option>
          <option value="CAT-2026-S1">Summer 2026 Main Collection</option>
          <option value="CAT-ESS-25">Essentials Core Line</option>
          <option value="CAT-LTD-F1">Limited Footwear Drops</option>
          <option value="CAT-2026-SP2">Spring 2026 Accessories</option>
        </select>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className="rounded-xl flex flex-col items-center justify-center py-16 cursor-pointer transition-all"
        style={{
          background: isDragging ? 'rgba(176,198,255,0.05)' : '#1c1b1b',
          border: `2px dashed ${isDragging ? '#b0c6ff' : 'rgba(66,70,84,0.4)'}`,
        }}
      >
        {file ? (
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 rounded-xl" style={{ background: 'rgba(176,198,255,0.1)' }}>
              <span className="material-symbols-outlined text-4xl" style={{ color: '#b0c6ff' }}>description</span>
            </div>
            <div className="text-center">
              <p className="font-bold text-sm mb-1" style={{ color: '#e5e2e1' }}>{file.name}</p>
              <p className="text-xs" style={{ color: '#8d90a0' }}>{formatSize(file.size)}</p>
            </div>
            <button
              className="text-xs font-bold mt-2 px-4 py-2 rounded-lg transition-colors"
              style={{ background: 'rgba(66,70,84,0.3)', color: '#c3c6d6' }}
              onClick={(e) => { e.stopPropagation(); onFileSelected({ name: '', size: 0, type: '' }); }}
            >
              Replace file
            </button>
          </div>
        ) : (
          <>
            <div className="p-4 rounded-xl mb-4" style={{ background: 'rgba(66,70,84,0.2)' }}>
              <span className="material-symbols-outlined text-4xl" style={{ color: '#8d90a0' }}>upload_file</span>
            </div>
            <p className="text-sm font-bold mb-1" style={{ color: '#e5e2e1' }}>
              Drop your file here, or{' '}
              <label className="cursor-pointer" style={{ color: '#b0c6ff' }}>
                browse
                <input type="file" accept=".csv,.json,.xlsx,.xls" className="hidden" onChange={handleFileInput} />
              </label>
            </p>
            <p className="text-xs" style={{ color: '#8d90a0' }}>Supports CSV, JSON, Excel (.xlsx)</p>
            <p className="text-xs mt-1" style={{ color: '#8d90a0' }}>Max file size: 50 MB</p>
          </>
        )}
      </div>

      {/* Supported formats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { ext: 'CSV', icon: 'table_chart', desc: 'Comma-separated values' },
          { ext: 'JSON', icon: 'data_object', desc: 'Structured JSON array' },
          { ext: 'XLSX', icon: 'grid_on', desc: 'Excel spreadsheet' },
        ].map(({ ext, icon, desc }) => (
          <div
            key={ext}
            className="p-4 rounded-xl flex items-center gap-3"
            style={{ background: '#1c1b1b', border: '1px solid rgba(66,70,84,0.1)' }}
          >
            <span className="material-symbols-outlined" style={{ color: '#8d90a0' }}>{icon}</span>
            <div>
              <p className="text-xs font-bold" style={{ color: '#e5e2e1' }}>{ext}</p>
              <p className="text-[10px]" style={{ color: '#8d90a0' }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Format
// ---------------------------------------------------------------------------

interface Step2Props {
  format: FileFormat;
  delimiter: Delimiter;
  hasHeader: boolean;
  encoding: string;
  onChange: (key: string, value: unknown) => void;
}

function Step2Format({ format, delimiter, hasHeader, encoding, onChange }: Step2Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-5">
        {/* File format */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#c3c6d6' }}>
            File Format
          </label>
          <div className="flex gap-3">
            {(['csv', 'json', 'excel'] as FileFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => onChange('format', f)}
                className="flex-1 py-2.5 rounded-lg text-xs font-bold uppercase transition-all"
                style={
                  format === f
                    ? { background: 'rgba(176,198,255,0.15)', color: '#b0c6ff', border: '1px solid rgba(176,198,255,0.4)' }
                    : { background: '#353534', color: '#8d90a0', border: '1px solid rgba(66,70,84,0.2)' }
                }
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Delimiter (CSV only) */}
        {format === 'csv' && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#c3c6d6' }}>
              Column Delimiter
            </label>
            <div className="flex gap-3">
              {([',', ';', '\t', '|'] as Delimiter[]).map((d) => (
                <button
                  key={d}
                  onClick={() => onChange('delimiter', d)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-mono transition-all"
                  style={
                    delimiter === d
                      ? { background: 'rgba(176,198,255,0.15)', color: '#b0c6ff', border: '1px solid rgba(176,198,255,0.4)' }
                      : { background: '#353534', color: '#8d90a0', border: '1px solid rgba(66,70,84,0.2)' }
                  }
                >
                  {d === '\t' ? 'TAB' : d}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Header row */}
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: '#1c1b1b', border: '1px solid rgba(66,70,84,0.1)' }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#e5e2e1' }}>First row is header</p>
            <p className="text-xs" style={{ color: '#8d90a0' }}>Use first row as column names</p>
          </div>
          <button
            onClick={() => onChange('hasHeader', !hasHeader)}
            className="w-11 h-6 rounded-full relative transition-all"
            style={{ background: hasHeader ? '#0058cc' : '#353534' }}
          >
            <span
              className="w-4 h-4 rounded-full absolute top-1 transition-all"
              style={{
                background: '#e5e2e1',
                left: hasHeader ? 'calc(100% - 20px)' : '4px',
              }}
            />
          </button>
        </div>

        {/* Encoding */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#c3c6d6' }}>
            Character Encoding
          </label>
          <select
            value={encoding}
            onChange={(e) => onChange('encoding', e.target.value)}
            className="w-full text-sm rounded-lg px-4 py-3 appearance-none"
            style={{ background: '#353534', border: 'none', color: '#e5e2e1', outline: 'none' }}
          >
            <option value="UTF-8">UTF-8 (Recommended)</option>
            <option value="UTF-16">UTF-16</option>
            <option value="ISO-8859-1">ISO-8859-1 (Latin-1)</option>
            <option value="Windows-1252">Windows-1252</option>
          </select>
        </div>
      </div>

      {/* Preview panel */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#1c1b1b', border: '1px solid rgba(66,70,84,0.1)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(66,70,84,0.1)' }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#8d90a0' }}>Raw Preview (first 3 rows)</p>
        </div>
        <div className="p-5 overflow-x-auto">
          <pre className="text-[11px] font-mono leading-relaxed" style={{ color: '#b0c6ff' }}>
{format === 'csv' ? `SKU_ID${delimiter}Product_Name_EN${delimiter}Price_USD
PRD-99201-X${delimiter}Ergonomic Office Chair${delimiter}299.00
PRD-99202-Y${delimiter}Standing Desk Frame XL${delimiter}449.00`
: format === 'json' ? `[
  {"sku":"PRD-99201-X","name":"Ergonomic Chair","price":299.0},
  {"sku":"PRD-99202-Y","name":"Standing Desk","price":449.0}
]`
: `(Excel binary format detected — 1,240 rows, 8 columns)`}
          </pre>
        </div>
        <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(66,70,84,0.1)', background: 'rgba(66,70,84,0.1)' }}>
          <p className="text-[10px]" style={{ color: '#8d90a0' }}>Detected: 1,240 data rows • 8 columns • {encoding}</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Mapping
// ---------------------------------------------------------------------------

interface Step3Props {
  mappings: ColumnMapping[];
  onMappingChange: (index: number, destination: string) => void;
}

function Step3Mapping({ mappings, onMappingChange }: Step3Props) {
  const mappedCount = mappings.filter((m) => m.status === 'mapped').length;
  const totalCount = mappings.length;
  const schemaMatch = Math.round((mappedCount / totalCount) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main mapping table — 3 cols */}
      <div className="lg:col-span-3 space-y-4">
        <div className="rounded-xl overflow-hidden" style={{ background: '#1c1b1b', border: '1px solid rgba(66,70,84,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
          {/* Section header */}
          <div className="px-8 py-5 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(66,70,84,0.1)' }}>
            <div>
              <h2 className="text-base font-bold" style={{ color: '#e5e2e1' }}>Attribute Mapping</h2>
              <p className="text-xs mt-0.5" style={{ color: '#8d90a0' }}>Map source columns to PIM destination properties</p>
            </div>
            <button
              className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-all"
              style={{ color: '#b0c6ff', border: '1px solid rgba(176,198,255,0.3)', background: 'rgba(176,198,255,0.05)' }}
            >
              <span className="material-symbols-outlined text-sm">auto_fix_high</span>
              Re-run Auto-Match
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ background: 'rgba(42,42,42,0.3)' }}>
                  <th className="px-8 py-4 text-[10px] uppercase tracking-widest font-black" style={{ color: '#8d90a0', width: '35%' }}>Source Column</th>
                  <th className="px-2 py-4 text-center" style={{ width: 48 }}></th>
                  <th className="px-8 py-4 text-[10px] uppercase tracking-widest font-black" style={{ color: '#8d90a0', width: '35%' }}>PIM Destination</th>
                  <th className="px-8 py-4 text-[10px] uppercase tracking-widest font-black" style={{ color: '#8d90a0' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((mapping, i) => {
                  const isUnmapped = mapping.status === 'unmapped';
                  return (
                    <tr
                      key={mapping.sourceColumn}
                      className="group transition-colors"
                      style={{
                        borderTop: '1px solid rgba(66,70,84,0.05)',
                        background: isUnmapped ? 'rgba(255,181,155,0.03)' : 'transparent',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = isUnmapped ? 'rgba(255,181,155,0.06)' : 'rgba(53,53,52,0.2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = isUnmapped ? 'rgba(255,181,155,0.03)' : 'transparent')}
                    >
                      {/* Source column */}
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2 rounded-lg transition-colors"
                            style={{ background: isUnmapped ? 'rgba(255,181,155,0.1)' : 'rgba(176,198,255,0.1)' }}
                          >
                            <span
                              className="material-symbols-outlined text-sm"
                              style={{ color: isUnmapped ? '#ffb59b' : '#b0c6ff' }}
                            >
                              {isUnmapped ? 'warning' : 'table_chart'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-bold" style={{ color: '#e5e2e1' }}>{mapping.sourceColumn}</p>
                            <p className="text-[10px] font-mono mt-0.5" style={{ color: '#8d90a0' }}>e.g. {mapping.sampleValue}</p>
                          </div>
                        </div>
                      </td>

                      {/* Arrow */}
                      <td className="px-0 py-5 text-center">
                        <div className="h-px w-full" style={{ background: 'repeating-linear-gradient(90deg, #424654 0, #424654 4px, transparent 4px, transparent 8px)', opacity: 0.4 }} />
                      </td>

                      {/* Destination select */}
                      <td className="px-8 py-5">
                        <div className="relative">
                          <select
                            value={mapping.destination}
                            onChange={(e) => onMappingChange(i, e.target.value)}
                            className="appearance-none w-full text-sm rounded-lg px-4 py-2.5 cursor-pointer transition-all"
                            style={{
                              background: '#353534',
                              border: `1px solid ${isUnmapped ? 'rgba(255,181,155,0.3)' : 'rgba(66,70,84,0.2)'}`,
                              color: isUnmapped ? '#ffb59b' : (mapping.destination ? '#b0c6ff' : '#8d90a0'),
                              fontWeight: 700,
                              outline: 'none',
                            }}
                          >
                            {isUnmapped && !mapping.destination && (
                              <option value="" disabled>Unmapped Field</option>
                            )}
                            {DESTINATION_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                          <span
                            className="material-symbols-outlined absolute text-sm pointer-events-none"
                            style={{ right: 12, top: '50%', transform: 'translateY(-50%)', color: isUnmapped ? '#ffb59b' : '#8d90a0' }}
                          >
                            expand_more
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-8 py-5">
                        {isUnmapped ? (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: '#ffb59b' }} />
                            <span className="text-[10px] font-bold uppercase" style={{ color: '#ffb59b' }}>Action Required</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: '#b0c6ff', boxShadow: '0 0 8px rgba(176,198,255,0.6)' }} />
                            <span className="text-[10px] font-bold uppercase" style={{ color: '#b0c6ff' }}>Mapped</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mapping Insights */}
        <div className="p-6 rounded-xl" style={{ background: 'rgba(53,53,52,0.8)', border: '1px solid rgba(66,70,84,0.1)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(176,198,255,0.1)' }}>
              <span className="material-symbols-outlined" style={{ color: '#b0c6ff' }}>lightbulb</span>
            </div>
            <h3 className="font-bold text-sm" style={{ color: '#e5e2e1' }}>Mapping Insights</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg" style={{ background: 'rgba(14,14,14,0.5)', border: '1px solid rgba(66,70,84,0.05)' }}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#b0c6ff' }}>Auto-Match Logic</span>
                <span className="text-[10px] font-mono" style={{ color: '#8d90a0' }}>Conf: 98%</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#8d90a0' }}>
                <span style={{ color: '#e5e2e1', fontWeight: 700 }}>SKU_ID</span> was matched to{' '}
                <span style={{ color: '#e5e2e1', fontWeight: 700 }}>Unique Identifier</span> because the column
                contains unique alphanumeric patterns found in 1,240 existing records.
              </p>
            </div>
            <div className="p-4 rounded-lg" style={{ background: 'rgba(14,14,14,0.5)', border: '1px solid rgba(66,70,84,0.05)' }}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#ffb59b' }}>Uncertainty Alert</span>
                <span className="text-[10px] font-mono" style={{ color: '#8d90a0' }}>Conf: 42%</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#8d90a0' }}>
                <span style={{ color: '#e5e2e1', fontWeight: 700 }}>Inventory_Count</span> remains unmapped as it
                shares naming patterns with both{' '}
                <span style={{ color: '#b0c6ff', cursor: 'pointer' }}>Warehouse Qty</span> and{' '}
                <span style={{ color: '#b0c6ff', cursor: 'pointer' }}>Reserved Stock</span>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Validation sidebar — 1 col */}
      <aside className="space-y-4">
        <div className="rounded-xl overflow-hidden sticky top-24" style={{ background: '#1c1b1b', border: '1px solid rgba(66,70,84,0.1)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(66,70,84,0.1)', background: 'rgba(42,42,42,0.5)' }}>
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#e5e2e1' }}>Validation Summary</p>
          </div>
          <div className="p-5 space-y-5">
            {/* Schema match */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium" style={{ color: '#8d90a0' }}>Schema Match</span>
                <span className="text-sm font-bold" style={{ color: '#b0c6ff' }}>{schemaMatch}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#353534' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${schemaMatch}%`, background: '#b0c6ff' }} />
              </div>
            </div>

            {/* Potential issues */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#8d90a0' }}>
                Potential Issues
              </p>
              <div className="space-y-2">
                {VALIDATION_ISSUES.map((issue) => (
                  <div
                    key={issue.field}
                    className="flex gap-3 p-3 rounded-lg"
                    style={{
                      background: issue.type === 'error' ? 'rgba(147,0,10,0.1)' : 'rgba(169,56,2,0.1)',
                      border: `1px solid ${issue.type === 'error' ? 'rgba(255,180,171,0.1)' : 'rgba(255,181,155,0.1)'}`,
                    }}
                  >
                    <span
                      className="material-symbols-outlined text-sm flex-shrink-0"
                      style={{ color: issue.type === 'error' ? '#ffb4ab' : '#ffb59b' }}
                    >
                      {issue.type === 'error' ? 'error' : 'priority_high'}
                    </span>
                    <div>
                      <p className="text-[11px] font-bold" style={{ color: '#e5e2e1' }}>
                        {issue.type === 'error' ? 'Data Type Mismatch' : 'Missing Values'}
                      </p>
                      <p className="text-[10px] leading-tight mt-0.5" style={{ color: '#8d90a0' }}>
                        {issue.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              className="w-full py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
              style={{ background: '#353534', border: '1px solid rgba(66,70,84,0.2)', color: '#8d90a0' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#e5e2e1')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#8d90a0')}
            >
              Download Full Report
            </button>
          </div>
        </div>

        {/* Help card */}
        <div className="p-5 rounded-xl" style={{ background: 'rgba(176,198,255,0.05)', border: '1px solid rgba(176,198,255,0.1)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-sm" style={{ color: '#b0c6ff' }}>help</span>
            <span className="text-xs font-bold" style={{ color: '#e5e2e1' }}>Need help mapping?</span>
          </div>
          <p className="text-[11px] leading-relaxed mb-3" style={{ color: '#8d90a0' }}>
            Export your current mapping as a reusable template for future imports.
          </p>
          <button className="text-[11px] font-bold" style={{ color: '#b0c6ff' }}>
            View Mapping Guide →
          </button>
        </div>
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Preview
// ---------------------------------------------------------------------------

function Step4Preview() {
  const [showErrors, setShowErrors] = useState(false);

  return (
    <div className="space-y-6">
      {/* Summary chips */}
      <div className="flex flex-wrap gap-3">
        {[
          { icon: 'table_rows', label: '1,240 total rows', color: '#e5e2e1', bg: 'rgba(66,70,84,0.3)' },
          { icon: 'check_circle', label: '1,225 valid records', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
          { icon: 'error', label: '15 rows with issues', color: '#ffb4ab', bg: 'rgba(255,180,171,0.1)' },
        ].map(({ icon, label, color, bg }) => (
          <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: bg }}>
            <span className="material-symbols-outlined text-sm" style={{ color }}>{icon}</span>
            <span className="text-xs font-bold" style={{ color }}>{label}</span>
          </div>
        ))}
        <button
          onClick={() => setShowErrors(!showErrors)}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all"
          style={{ background: showErrors ? 'rgba(176,198,255,0.15)' : 'rgba(66,70,84,0.2)', color: showErrors ? '#b0c6ff' : '#8d90a0' }}
        >
          {showErrors ? 'Show all rows' : 'Show errors only'}
        </button>
      </div>

      {/* Preview table */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#1c1b1b', border: '1px solid rgba(66,70,84,0.1)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ background: 'rgba(42,42,42,0.3)' }}>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: '#8d90a0', width: 40 }}>#</th>
                {['SKU', 'Product Name', 'Price (USD)', 'Inventory'].map((col) => (
                  <th key={col} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: '#8d90a0' }}>{col}</th>
                ))}
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: '#8d90a0' }}>Validation</th>
              </tr>
            </thead>
            <tbody>
              {PREVIEW_ROWS.map((row, i) => {
                const hasIssue = i === 2; // simulate one row with issue
                return (
                  <tr
                    key={row.sku}
                    className="transition-colors"
                    style={{
                      borderTop: '1px solid rgba(66,70,84,0.05)',
                      background: hasIssue ? 'rgba(255,180,171,0.03)' : 'transparent',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = hasIssue ? 'rgba(255,180,171,0.06)' : 'rgba(53,53,52,0.2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = hasIssue ? 'rgba(255,180,171,0.03)' : 'transparent')}
                  >
                    <td className="px-6 py-4 text-xs" style={{ color: '#8d90a0' }}>{i + 1}</td>
                    <td className="px-6 py-4 text-xs font-mono" style={{ color: '#b0c6ff' }}>{row.sku}</td>
                    <td className="px-6 py-4 text-sm font-medium" style={{ color: '#e5e2e1' }}>{row.name}</td>
                    <td className="px-6 py-4 text-sm font-bold" style={{ color: '#e5e2e1' }}>${row.price}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: parseInt(row.inventory) === 0 ? '#ffb4ab' : '#c3c6d6' }}>
                      {parseInt(row.inventory) === 0 ? 'Out of Stock' : row.inventory}
                    </td>
                    <td className="px-6 py-4">
                      {hasIssue ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: '#ffb4ab' }}>
                          <span className="material-symbols-outlined text-sm">warning</span>
                          Missing name
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: '#4ade80' }}>
                          <span className="material-symbols-outlined text-sm">check</span>
                          Valid
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 text-xs" style={{ borderTop: '1px solid rgba(66,70,84,0.05)', color: '#8d90a0', background: 'rgba(42,42,42,0.2)' }}>
          Showing 5 of 1,240 rows — <button className="font-bold" style={{ color: '#b0c6ff' }}>Download full preview CSV</button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5 — Execute
// ---------------------------------------------------------------------------

interface Step5Props {
  isRunning: boolean;
  progress: number;
  isDone: boolean;
  onStart: () => void;
}

function Step5Execute({ isRunning, progress, isDone, onStart }: Step5Props) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {isDone ? (
        /* Success state */
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(74,222,128,0.1)', border: '2px solid rgba(74,222,128,0.3)' }}>
            <span className="material-symbols-outlined text-4xl" style={{ color: '#4ade80' }}>check</span>
          </div>
          <h2 className="text-2xl font-black mb-2" style={{ color: '#e5e2e1' }}>Import Complete!</h2>
          <p className="text-sm mb-8" style={{ color: '#8d90a0' }}>Your products have been imported successfully.</p>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Created', value: '1,210', color: '#4ade80' },
              { label: 'Updated', value: '15', color: '#b0c6ff' },
              { label: 'Skipped', value: '15', color: '#8d90a0' },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-4 rounded-xl text-center" style={{ background: '#1c1b1b', border: '1px solid rgba(66,70,84,0.1)' }}>
                <p className="text-2xl font-black mb-1" style={{ color }}>{value}</p>
                <p className="text-xs" style={{ color: '#8d90a0' }}>{label}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3 justify-center">
            <Link href="/pim" className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold" style={{ background: '#353534', color: '#e5e2e1' }}>
              <span className="material-symbols-outlined text-lg">inventory_2</span>
              View Catalog
            </Link>
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold" style={{ background: 'linear-gradient(135deg, #b0c6ff, #0058cc)', color: '#002d6f' }}>
              <span className="material-symbols-outlined text-lg">download</span>
              Download Report
            </button>
          </div>
        </div>
      ) : isRunning ? (
        /* Progress state */
        <div className="text-center py-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative" style={{ background: 'rgba(176,198,255,0.1)' }}>
            <span className="material-symbols-outlined text-3xl" style={{ color: '#b0c6ff' }}>sync</span>
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(66,70,84,0.3)" strokeWidth="4" />
              <circle
                cx="40" cy="40" r="36" fill="none" stroke="#b0c6ff" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 36 * progress / 100} ${2 * Math.PI * 36}`}
                style={{ transition: 'stroke-dasharray 0.3s' }}
              />
            </svg>
          </div>
          <h2 className="text-xl font-black mb-2" style={{ color: '#e5e2e1' }}>Importing Products…</h2>
          <p className="text-sm mb-2" style={{ color: '#8d90a0' }}>Processing {Math.round(progress * 12.4)} of 1,240 records</p>
          <p className="text-2xl font-black" style={{ color: '#b0c6ff' }}>{progress}%</p>
          <div className="w-full h-2 rounded-full mt-4 overflow-hidden" style={{ background: '#353534' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #b0c6ff, #0058cc)' }} />
          </div>
        </div>
      ) : (
        /* Pre-execute summary */
        <>
          <div className="p-6 rounded-xl" style={{ background: '#1c1b1b', border: '1px solid rgba(66,70,84,0.1)' }}>
            <h3 className="font-bold mb-4" style={{ color: '#e5e2e1' }}>Import Summary</h3>
            <div className="space-y-3">
              {[
                { label: 'Target Catalog', value: 'Summer 2026 Main Collection' },
                { label: 'File', value: 'products_summer2026.csv' },
                { label: 'Total Records', value: '1,240' },
                { label: 'Fields Mapped', value: `${INITIAL_MAPPINGS.filter((m) => m.status === 'mapped').length}/${INITIAL_MAPPINGS.length}` },
                { label: 'Validation Issues', value: '15 rows (will be skipped)' },
                { label: 'Duplicates', value: 'Update existing (by SKU)' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span style={{ color: '#8d90a0' }}>{label}</span>
                  <span style={{ color: '#e5e2e1', fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(176,198,255,0.05)', border: '1px solid rgba(176,198,255,0.1)' }}>
            <span className="material-symbols-outlined text-sm flex-shrink-0 mt-0.5" style={{ color: '#b0c6ff' }}>info</span>
            <p className="text-xs leading-relaxed" style={{ color: '#8d90a0' }}>
              This import will create or update products in the selected catalog. Products with duplicate SKUs will be updated.
              15 rows with validation errors will be skipped and logged in the import report.
            </p>
          </div>

          <button
            onClick={onStart}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl text-sm font-black transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #b0c6ff, #0058cc)', color: '#002d6f', boxShadow: '0 8px 20px rgba(176,198,255,0.15)' }}
          >
            <span className="material-symbols-outlined text-lg">play_arrow</span>
            Start Import — 1,240 Records
          </button>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main wizard page
// ---------------------------------------------------------------------------

export default function PimImportWizardPage() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [catalogId, setCatalogId] = useState('');
  const [format, setFormat] = useState<FileFormat>('csv');
  const [delimiter, setDelimiter] = useState<Delimiter>(',');
  const [hasHeader, setHasHeader] = useState(true);
  const [encoding, setEncoding] = useState('UTF-8');
  const [mappings, setMappings] = useState<ColumnMapping[]>(INITIAL_MAPPINGS);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const handleFormatChange = (key: string, value: unknown) => {
    if (key === 'format') setFormat(value as FileFormat);
    if (key === 'delimiter') setDelimiter(value as Delimiter);
    if (key === 'hasHeader') setHasHeader(value as boolean);
    if (key === 'encoding') setEncoding(value as string);
  };

  const handleMappingChange = (index: number, destination: string) => {
    setMappings((prev) =>
      prev.map((m, i) =>
        i === index
          ? { ...m, destination, status: destination && destination !== '— Skip this column —' ? 'mapped' : 'unmapped' }
          : m,
      ),
    );
  };

  const handleStartImport = () => {
    setIsRunning(true);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 8 + 2;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => setIsDone(true), 500);
      } else {
        setProgress(Math.round(p));
      }
    }, 200);
  };

  const canProceed = () => {
    if (currentStep === 1) return !!file?.name && !!catalogId;
    if (currentStep === 2) return true;
    if (currentStep === 3) return mappings.filter((m) => m.status === 'unmapped').length === 0;
    return true;
  };

  const mappedCount = mappings.filter((m) => m.status === 'mapped').length;

  return (
    <div className="min-h-screen" style={{ background: '#201f1f' }}>
      <div className="max-w-7xl mx-auto px-8 py-10">
        {/* ── Breadcrumb ── */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" style={{ color: '#8d90a0' }}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/pim" style={{ color: '#8d90a0' }}>Catalogs</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage style={{ color: '#e5e2e1' }}>Import Wizard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* ── Header ── */}
        <header className="mt-4 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: '#e5e2e1', fontFamily: 'Inter, sans-serif' }}>
              Import Wizard
            </h1>
            <p className="text-sm" style={{ color: '#8d90a0', maxWidth: 480 }}>
              Orchestrate your enterprise data ingestion with automated mapping and structural validation.
            </p>
          </div>
          {/* Step badge */}
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-full text-sm font-bold" style={{ background: 'rgba(176,198,255,0.1)', border: '1px solid rgba(176,198,255,0.2)' }}>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full" style={{ background: '#b0c6ff', opacity: 0.75 }} />
              <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: '#b0c6ff' }} />
            </span>
            <span style={{ color: '#b0c6ff' }}>
              STEP {currentStep} OF 5: {STEP_LABELS[currentStep].toUpperCase()}
            </span>
          </div>
        </header>

        {/* ── Step Stepper ── */}
        <div className="grid grid-cols-5 gap-4 mb-10">
          {([1, 2, 3, 4, 5] as WizardStep[]).map((step) => {
            const isCompleted = step < currentStep;
            const isCurrent = step === currentStep;
            const isPending = step > currentStep;
            return (
              <div key={step} className={isPending ? 'opacity-40' : ''}>
                <div
                  className="h-1.5 w-full rounded-full mb-3"
                  style={{
                    background: isCurrent ? '#b0c6ff' : isCompleted ? '#b0c6ff' : '#424654',
                    boxShadow: isCurrent ? '0 0 12px rgba(176,198,255,0.4)' : 'none',
                  }}
                />
                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <span className="material-symbols-outlined text-sm" style={{ color: '#4ade80', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  ) : (
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={isCurrent
                        ? { background: '#b0c6ff', color: '#002d6f' }
                        : { border: '1px solid #8d90a0', color: '#8d90a0' }}
                    >
                      {step}
                    </span>
                  )}
                  <span
                    className="text-[10px] uppercase tracking-widest font-black"
                    style={{ color: isCurrent ? '#b0c6ff' : isCompleted ? 'rgba(229,226,225,0.5)' : '#8d90a0' }}
                  >
                    0{step} {STEP_LABELS[step]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Step Content ── */}
        <div className="mb-8">
          {currentStep === 1 && (
            <Step1Upload
              file={file}
              catalogId={catalogId}
              onFileSelected={(f) => setFile(f.name ? f : null)}
              onCatalogSelected={setCatalogId}
            />
          )}
          {currentStep === 2 && (
            <Step2Format
              format={format}
              delimiter={delimiter}
              hasHeader={hasHeader}
              encoding={encoding}
              onChange={handleFormatChange}
            />
          )}
          {currentStep === 3 && (
            <Step3Mapping mappings={mappings} onMappingChange={handleMappingChange} />
          )}
          {currentStep === 4 && <Step4Preview />}
          {currentStep === 5 && (
            <Step5Execute
              isRunning={isRunning}
              progress={progress}
              isDone={isDone}
              onStart={handleStartImport}
            />
          )}
        </div>

        {/* ── Bottom Action Bar ── */}
        {currentStep < 5 || (!isRunning && !isDone) ? (
          <div
            className="flex items-center justify-between p-6 rounded-xl sticky bottom-4"
            style={{ background: '#2a2a2a', border: '1px solid rgba(66,70,84,0.2)', backdropFilter: 'blur(12px)' }}
          >
            {/* Left: status */}
            <div className="flex items-center gap-6">
              {currentStep === 3 && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(176,198,255,0.2)' }}>
                    <span className="material-symbols-outlined text-base" style={{ color: '#b0c6ff', fontVariationSettings: "'FILL' 1" }}>done_all</span>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black tracking-wider leading-none mb-1" style={{ color: '#8d90a0' }}>Status</p>
                    <p className="text-sm font-bold" style={{ color: '#e5e2e1' }}>{mappedCount}/{mappings.length} Fields Mapped</p>
                  </div>
                </div>
              )}
              {currentStep !== 3 && (
                <p className="text-sm" style={{ color: '#8d90a0' }}>
                  {currentStep === 1 && (file?.name ? `Ready: ${file.name}` : 'Select a file to continue')}
                  {currentStep === 2 && 'Format detected — 1,240 rows, 8 columns'}
                  {currentStep === 4 && '1,225 records ready to import, 15 will be skipped'}
                </p>
              )}
            </div>

            {/* Right: navigation */}
            <div className="flex gap-3">
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep((s) => Math.max(1, s - 1) as WizardStep)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all border-2 active:scale-95"
                  style={{ color: '#e5e2e1', borderColor: 'rgba(66,70,84,0.2)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#353534')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  BACK
                </button>
              )}
              {currentStep < 5 && (
                <button
                  disabled={!canProceed()}
                  onClick={() => setCurrentStep((s) => Math.min(5, s + 1) as WizardStep)}
                  className="flex items-center gap-2 px-10 py-3 rounded-xl text-sm font-black transition-all active:scale-95 group disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: canProceed() ? '#fff' : '#353534', color: '#131313', boxShadow: canProceed() ? '0 8px 20px rgba(255,255,255,0.15)' : 'none' }}
                >
                  {currentStep === 4 ? 'REVIEW & EXECUTE' : 'CONTINUE TO ' + STEP_LABELS[(currentStep + 1) as WizardStep].toUpperCase()}
                  <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* ── Right contextual rail ── */}
      <div
        className="fixed right-6 top-1/2 -translate-y-1/2 xl:flex flex-col gap-3 p-1.5 rounded-full hidden"
        style={{ background: 'rgba(14,14,14,0.8)', border: '1px solid rgba(66,70,84,0.2)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
      >
        {[
          { icon: 'history', title: 'View Import History' },
          { icon: 'download', title: 'Download Template' },
          { icon: 'help', title: 'Help Center' },
        ].map(({ icon, title }) => (
          <button
            key={icon}
            title={title}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all"
            style={{ color: '#8d90a0' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#b0c6ff'; e.currentTarget.style.background = 'rgba(176,198,255,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#8d90a0'; e.currentTarget.style.background = 'transparent'; }}
          >
            <span className="material-symbols-outlined text-lg">{icon}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

