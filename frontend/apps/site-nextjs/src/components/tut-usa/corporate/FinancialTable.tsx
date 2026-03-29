export interface FinancialTableData {
  title: string;
  columns: Record<string, unknown>[];
  rows: Record<string, unknown>[];
  downloadCsv: boolean;
}

interface Props {
  data: FinancialTableData;
}

export function FinancialTable({ data }: Props) {
  const { title, columns, rows, downloadCsv } = data;

  const colKeys = columns.map((c) => String(c['key'] ?? ''));
  const colLabels = columns.map((c) => String(c['label'] ?? c['key'] ?? ''));

  return (
    <section className="bg-surface-container rounded-xl p-6 border border-outline-variant">
      <div className="flex items-center justify-between mb-4 gap-4">
        <h2 className="font-headline text-xl text-[var(--color-on-surface)]">{title}</h2>
        {downloadCsv && (
          <button
            className="font-label text-sm text-[var(--color-primary)] border border-[var(--color-primary)] rounded px-3 py-1 hover:bg-[var(--color-primary-container)] transition-colors"
            type="button"
          >
            Download CSV
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-[var(--color-on-surface)]">
          <thead>
            <tr className="border-b border-outline-variant">
              {colLabels.map((label, i) => (
                <th
                  key={i}
                  className="text-left py-2 px-3 font-label text-[var(--color-on-surface-variant)]"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-b border-outline-variant last:border-0 hover:bg-[var(--color-surface-container-high)] transition-colors">
                {colKeys.map((key, ci) => (
                  <td key={ci} className="py-2 px-3">
                    {String(row[key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
