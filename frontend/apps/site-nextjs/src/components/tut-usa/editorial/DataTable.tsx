'use client';

import { useState, useMemo } from 'react';

export interface DataTableData {
  title: string;
  columns: { label: string; key: string }[];
  rows: Record<string, string>[];
  enableSort: boolean;
  enableFilter: boolean;
}

interface Props {
  data: DataTableData;
}

export function DataTable({ data }: Props) {
  const { title, columns, rows, enableSort, enableFilter } = data;

  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filteredRows = useMemo(() => {
    let result = rows;
    if (enableFilter && filter.trim()) {
      const q = filter.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((v) => v.toLowerCase().includes(q))
      );
    }
    if (enableSort && sortKey) {
      result = [...result].sort((a, b) => {
        const va = a[sortKey] ?? '';
        const vb = b[sortKey] ?? '';
        const cmp = va.localeCompare(vb);
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [rows, filter, sortKey, sortDir, enableFilter, enableSort]);

  const handleSort = (key: string) => {
    if (!enableSort) return;
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        {title && (
          <h3 className="font-headline italic text-on-surface text-xl">{title}</h3>
        )}
        {enableFilter && (
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter…"
            className="bg-surface-container-low border border-outline-variant/20 rounded px-3 py-1.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary"
          />
        )}
      </div>
      <div className="overflow-x-auto rounded-lg border border-outline-variant/20">
        <table className="w-full text-sm text-on-surface-variant">
          <thead className="bg-surface-container-low border-b border-outline-variant/20">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  onClick={() => handleSort(col.key)}
                  className={`px-4 py-3 text-left font-label tracking-widest uppercase text-xs text-on-surface select-none ${
                    enableSort ? 'cursor-pointer hover:text-primary' : ''
                  }`}
                >
                  {col.label}
                  {enableSort && sortKey === col.key && (
                    <span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-on-surface-variant/60"
                >
                  No results found.
                </td>
              </tr>
            ) : (
              filteredRows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      {row[col.key] ?? ''}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-on-surface-variant/60">
        {filteredRows.length} of {rows.length} row{rows.length !== 1 ? 's' : ''}
      </p>
    </section>
  );
}
