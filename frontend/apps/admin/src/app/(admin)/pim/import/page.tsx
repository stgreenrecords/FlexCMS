'use client';

import React, { useState, useCallback, useEffect } from 'react';
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

interface Catalog {
  id: string;
  name: string;
  year: number;
  season: string | null;
  status: string;
}

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errorCount: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_BASE = '/api/pim/v1';

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

// ---------------------------------------------------------------------------
// Step 1 — Upload
// ---------------------------------------------------------------------------

interface Step1Props {
  onFileSelected: (file: UploadedFile, raw: File) => void;
  onCatalogSelected: (catalogId: string) => void;
  file: UploadedFile | null;
  catalogId: string;
  catalogs: Catalog[];
  catalogsLoading: boolean;
}

function Step1Upload({ onFileSelected, onCatalogSelected, file, catalogId, catalogs, catalogsLoading }: Step1Props) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      onFileSelected({ name: dropped.name, size: dropped.size, type: dropped.type }, dropped);
    }
  }, [onFileSelected]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      onFileSelected({ name: selected.name, size: selected.size, type: selected.type }, selected);
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
        {catalogsLoading ? (
          <Skeleton className="h-11 w-full rounded-lg" />
        ) : (
          <select
            value={catalogId}
            onChange={(e) => onCatalogSelected(e.target.value)}
            className="w-full text-sm rounded-lg px-4 py-3 appearance-none"
            style={{ background: '#353534', border: 'none', color: '#e5e2e1', outline: 'none' }}
          >
            <option value="">Select a catalog...</option>
            {catalogs.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}{cat.season ? ` — ${cat.season}` : ''} ({cat.year})
              </option>
            ))}
          </select>
        )}
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
              onClick={(e) => { e.stopPropagation(); onFileSelected({ name: '', size: 0, type: '' }, new File([], '')); }}
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
  fileName: string;
  onChange: (key: string, value: unknown) => void;
}

function Step2Format({ format, delimiter, hasHeader, encoding, fileName, onChange }: Step2Props) {
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

      {/* File info panel */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#1c1b1b', border: '1px solid rgba(66,70,84,0.1)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(66,70,84,0.1)' }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#8d90a0' }}>Selected File</p>
        </div>
        <div className="p-5 flex flex-col items-center justify-center gap-4" style={{ minHeight: 160 }}>
          <div className="p-4 rounded-xl" style={{ background: 'rgba(176,198,255,0.1)' }}>
            <span className="material-symbols-outlined text-3xl" style={{ color: '#b0c6ff' }}>description</span>
          </div>
          <p className="text-sm font-bold text-center" style={{ color: '#e5e2e1' }}>{fileName}</p>
          <p className="text-xs text-center" style={{ color: '#8d90a0' }}>
            Column detection will run when you proceed to mapping.
          </p>
        </div>
        <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(66,70,84,0.1)', background: 'rgba(66,70,84,0.1)' }}>
          <p className="text-[10px]" style={{ color: '#8d90a0' }}>Encoding: {encoding}</p>
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
  inferring: boolean;
  onMappingChange: (index: number, destination: string) => void;
}

function Step3Mapping({ mappings, inferring, onMappingChange }: Step3Props) {
  const mappedCount = mappings.filter((m) => m.status === 'mapped').length;
  const totalCount = mappings.length;
  const schemaMatch = totalCount > 0 ? Math.round((mappedCount / totalCount) * 100) : 0;

  if (inferring) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (mappings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-5 rounded-2xl mb-5" style={{ background: 'rgba(66,70,84,0.2)' }}>
          <span className="material-symbols-outlined text-5xl" style={{ color: '#8d90a0' }}>table_chart</span>
        </div>
        <p className="text-base font-bold mb-2" style={{ color: '#e5e2e1' }}>No columns detected</p>
        <p className="text-sm" style={{ color: '#8d90a0' }}>Upload and configure your file to begin column mapping.</p>
      </div>
    );
  }

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
                            {mapping.sampleValue && (
                              <p className="text-[10px] font-mono mt-0.5" style={{ color: '#8d90a0' }}>e.g. {mapping.sampleValue}</p>
                            )}
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

            {mappedCount === totalCount && totalCount > 0 ? (
              <div className="flex gap-3 p-3 rounded-lg" style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.1)' }}>
                <span className="material-symbols-outlined text-sm flex-shrink-0" style={{ color: '#4ade80' }}>check_circle</span>
                <p className="text-[11px] font-bold" style={{ color: '#4ade80' }}>All columns mapped</p>
              </div>
            ) : (
              <p className="text-[11px]" style={{ color: '#8d90a0' }}>
                {totalCount - mappedCount} column{totalCount - mappedCount !== 1 ? 's' : ''} still need mapping.
              </p>
            )}
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
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="p-5 rounded-2xl mb-5" style={{ background: 'rgba(66,70,84,0.2)' }}>
        <span className="material-symbols-outlined text-5xl" style={{ color: '#8d90a0' }}>preview</span>
      </div>
      <p className="text-base font-bold mb-2" style={{ color: '#e5e2e1' }}>Preview ready after mapping</p>
      <p className="text-sm max-w-md" style={{ color: '#8d90a0' }}>
        Complete the column mapping step and proceed here to review the first rows of your import before executing.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5 — Execute
// ---------------------------------------------------------------------------

interface Step5Props {
  isRunning: boolean;
  progress: number;
  importResult: ImportResult | null;
  importError: string | null;
  catalogName: string;
  fileName: string;
  mappings: ColumnMapping[];
  onStart: () => void;
}

function Step5Execute({ isRunning, progress, importResult, importError, catalogName, fileName, mappings, onStart }: Step5Props) {
  const mappedCount = mappings.filter((m) => m.status === 'mapped').length;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {importResult ? (
        /* Success state */
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(74,222,128,0.1)', border: '2px solid rgba(74,222,128,0.3)' }}>
            <span className="material-symbols-outlined text-4xl" style={{ color: '#4ade80' }}>check</span>
          </div>
          <h2 className="text-2xl font-black mb-2" style={{ color: '#e5e2e1' }}>Import Complete!</h2>
          <p className="text-sm mb-8" style={{ color: '#8d90a0' }}>Your products have been processed.</p>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Created', value: importResult.created, color: '#4ade80' },
              { label: 'Updated', value: importResult.updated, color: '#b0c6ff' },
              { label: 'Skipped', value: importResult.skipped, color: '#8d90a0' },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-4 rounded-xl text-center" style={{ background: '#1c1b1b', border: '1px solid rgba(66,70,84,0.1)' }}>
                <p className="text-2xl font-black mb-1" style={{ color }}>{value.toLocaleString()}</p>
                <p className="text-xs" style={{ color: '#8d90a0' }}>{label}</p>
              </div>
            ))}
          </div>
          {importResult.errorCount > 0 && (
            <p className="text-xs mb-6" style={{ color: '#ffb4ab' }}>
              {importResult.errorCount} row{importResult.errorCount !== 1 ? 's' : ''} had errors and were skipped.
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <Link href="/pim" className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold" style={{ background: '#353534', color: '#e5e2e1' }}>
              <span className="material-symbols-outlined text-lg">inventory_2</span>
              View Catalog
            </Link>
          </div>
        </div>
      ) : importError ? (
        /* Error state */
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(255,180,171,0.1)', border: '2px solid rgba(255,180,171,0.3)' }}>
            <span className="material-symbols-outlined text-4xl" style={{ color: '#ffb4ab' }}>error</span>
          </div>
          <h2 className="text-2xl font-black mb-2" style={{ color: '#e5e2e1' }}>Import Failed</h2>
          <p className="text-sm mb-4" style={{ color: '#ffb4ab' }}>{importError}</p>
          <button
            onClick={onStart}
            className="px-6 py-2.5 rounded-lg text-sm font-bold"
            style={{ background: '#353534', color: '#e5e2e1' }}
          >
            Retry
          </button>
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
                { label: 'Target Catalog', value: catalogName || '—' },
                { label: 'File', value: fileName || '—' },
                { label: 'Fields Mapped', value: `${mappedCount} / ${mappings.length}` },
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
              Rows with validation errors will be skipped and logged.
            </p>
          </div>

          <button
            onClick={onStart}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl text-sm font-black transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #b0c6ff, #0058cc)', color: '#002d6f', boxShadow: '0 8px 20px rgba(176,198,255,0.15)' }}
          >
            <span className="material-symbols-outlined text-lg">play_arrow</span>
            Start Import
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
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [catalogId, setCatalogId] = useState('');
  const [format, setFormat] = useState<FileFormat>('csv');
  const [delimiter, setDelimiter] = useState<Delimiter>(',');
  const [hasHeader, setHasHeader] = useState(true);
  const [encoding, setEncoding] = useState('UTF-8');
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [inferring, setInferring] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [catalogsLoading, setCatalogsLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/catalogs?size=100`)
      .then((r) => r.json())
      .then((data) => setCatalogs(data.items ?? []))
      .catch(() => setCatalogs([]))
      .finally(() => setCatalogsLoading(false));
  }, []);

  const selectedCatalog = catalogs.find((c) => c.id === catalogId);

  const handleFileSelected = (meta: UploadedFile, raw: File) => {
    setFile(meta.name ? meta : null);
    setRawFile(meta.name ? raw : null);
    setMappings([]);
  };

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

  const inferSchema = async () => {
    if (!rawFile) return;
    setInferring(true);
    try {
      const fd = new FormData();
      fd.append('file', rawFile);
      const sourceType = format === 'excel' ? 'EXCEL' : format.toUpperCase();
      const res = await fetch(`${API_BASE}/imports/infer-schema?sourceType=${sourceType}`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) throw new Error('Schema inference failed');
      const schema: Record<string, unknown> = await res.json();
      const properties = (schema.properties as Record<string, { examples?: string[] }>) ?? {};
      const inferred: ColumnMapping[] = Object.entries(properties).map(([col, meta]) => ({
        sourceColumn: col,
        sampleValue: meta.examples?.[0] ?? '',
        destination: '',
        status: 'unmapped',
      }));
      setMappings(inferred);
    } catch {
      setMappings([]);
    } finally {
      setInferring(false);
    }
  };

  const handleStartImport = async () => {
    if (!rawFile || !catalogId) return;
    setIsRunning(true);
    setProgress(10);
    setImportError(null);

    // Find which field maps to SKU and name
    const skuMapping = mappings.find((m) => m.destination === 'Unique Identifier (SKU)');
    const nameMapping = mappings.find((m) => m.destination === 'Display Title (Localized)');

    try {
      const fd = new FormData();
      fd.append('file', rawFile);
      setProgress(30);

      const params = new URLSearchParams({
        catalogId,
        sourceType: format === 'excel' ? 'EXCEL' : format.toUpperCase(),
        userId: 'admin',
        ...(skuMapping ? { skuField: skuMapping.sourceColumn } : {}),
        ...(nameMapping ? { nameField: nameMapping.sourceColumn } : {}),
      });

      setProgress(50);
      const res = await fetch(`${API_BASE}/imports?${params.toString()}`, {
        method: 'POST',
        body: fd,
      });
      setProgress(90);

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || 'Import failed');
      }

      const result: ImportResult = await res.json();
      setProgress(100);
      setTimeout(() => setImportResult(result), 300);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
      setIsRunning(false);
      setProgress(0);
    }
  };

  const handleNext = async () => {
    if (currentStep === 2) {
      // Transition to mapping: call infer-schema first
      setCurrentStep(3);
      await inferSchema();
    } else {
      setCurrentStep((s) => Math.min(5, s + 1) as WizardStep);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) return !!file?.name && !!catalogId;
    if (currentStep === 2) return true;
    if (currentStep === 3) return mappings.length > 0 && mappings.filter((m) => m.status === 'unmapped').length === 0;
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
                  <span className="text-xs font-bold" style={{ color: isCurrent ? '#e5e2e1' : '#8d90a0' }}>
                    {STEP_LABELS[step]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Step Content ── */}
        <div className="mb-10">
          {currentStep === 1 && (
            <Step1Upload
              onFileSelected={handleFileSelected}
              onCatalogSelected={setCatalogId}
              file={file}
              catalogId={catalogId}
              catalogs={catalogs}
              catalogsLoading={catalogsLoading}
            />
          )}
          {currentStep === 2 && (
            <Step2Format
              format={format}
              delimiter={delimiter}
              hasHeader={hasHeader}
              encoding={encoding}
              fileName={file?.name ?? ''}
              onChange={handleFormatChange}
            />
          )}
          {currentStep === 3 && (
            <Step3Mapping
              mappings={mappings}
              inferring={inferring}
              onMappingChange={handleMappingChange}
            />
          )}
          {currentStep === 4 && <Step4Preview />}
          {currentStep === 5 && (
            <Step5Execute
              isRunning={isRunning}
              progress={progress}
              importResult={importResult}
              importError={importError}
              catalogName={selectedCatalog?.name ?? catalogId}
              fileName={file?.name ?? ''}
              mappings={mappings}
              onStart={handleStartImport}
            />
          )}
        </div>

        {/* ── Navigation ── */}
        {!importResult && !isRunning && (
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentStep((s) => Math.max(1, s - 1) as WizardStep)}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all"
              style={currentStep === 1
                ? { background: '#353534', color: '#8d90a0', opacity: 0.5, cursor: 'not-allowed' }
                : { background: '#353534', color: '#e5e2e1' }}
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Back
            </button>

            {/* Mapping progress */}
            {currentStep === 3 && mappings.length > 0 && (
              <span className="text-xs font-bold" style={{ color: '#8d90a0' }}>
                {mappedCount} / {mappings.length} fields mapped
              </span>
            )}

            {currentStep < 5 && (
              <button
                onClick={handleNext}
                disabled={!canProceed() || inferring}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all active:scale-95"
                style={
                  !canProceed() || inferring
                    ? { background: '#353534', color: '#8d90a0', cursor: 'not-allowed' }
                    : { background: 'linear-gradient(135deg, #b0c6ff, #0058cc)', color: '#002d6f', boxShadow: '0 4px 12px rgba(176,198,255,0.2)' }
                }
              >
                {inferring ? 'Detecting columns…' : 'Next Step'}
                {!inferring && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
