export interface BenchmarkTableData {
  title: string;
  benchmarks: { metric: string; value: string; baseline: string; status: string }[];
  comparisonType: 'vs-standard' | 'vs-prior' | 'vs-peer';
  notes: string;
}

const comparisonLabels: Record<BenchmarkTableData['comparisonType'], string> = {
  'vs-standard': 'vs Standard',
  'vs-prior': 'vs Prior Period',
  'vs-peer': 'vs Peers',
};

interface Props {
  data: BenchmarkTableData;
}

export function BenchmarkTable({ data }: Props) {
  const { title, benchmarks, comparisonType, notes } = data;

  return (
    <section className="py-6">
      <div className="flex items-baseline justify-between mb-4 flex-wrap gap-3">
        {title && (
          <h2 className="font-headline italic text-on-surface text-2xl">{title}</h2>
        )}
        <span className="font-label tracking-widest uppercase text-xs text-primary">
          {comparisonLabels[comparisonType]}
        </span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-outline-variant/20">
        <table className="w-full text-sm">
          <thead className="bg-surface-container-low border-b border-outline-variant/20">
            <tr>
              {['Metric', 'Value', 'Baseline', 'Status'].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-4 py-3 text-left font-label tracking-widest uppercase text-xs text-on-surface"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {benchmarks.map((b, i) => (
              <tr
                key={i}
                className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors"
              >
                <td className="px-4 py-3 text-on-surface font-medium">{b.metric}</td>
                <td className="px-4 py-3 text-on-surface-variant">{b.value}</td>
                <td className="px-4 py-3 text-on-surface-variant">{b.baseline}</td>
                <td className="px-4 py-3">
                  <span
                    className={`font-label tracking-widest uppercase text-xs ${
                      b.status.toLowerCase().includes('pass') ||
                      b.status.toLowerCase().includes('good')
                        ? 'text-emerald-400'
                        : b.status.toLowerCase().includes('fail') ||
                          b.status.toLowerCase().includes('poor')
                        ? 'text-red-400'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    {b.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {notes && (
        <p className="mt-3 text-xs text-on-surface-variant/70 italic">{notes}</p>
      )}
    </section>
  );
}
