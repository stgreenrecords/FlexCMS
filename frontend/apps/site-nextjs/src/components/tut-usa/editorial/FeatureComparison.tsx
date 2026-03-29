export interface FeatureComparisonData {
  title: string;
  columns: { label: string }[];
  rows: { feature: string; values: string[] }[];
  highlightDifferences: boolean;
}

interface Props {
  data: FeatureComparisonData;
}

function isDifferent(values: string[]): boolean {
  if (values.length < 2) return false;
  return values.some((v) => v !== values[0]);
}

export function FeatureComparison({ data }: Props) {
  const { title, columns, rows, highlightDifferences } = data;

  return (
    <section className="py-8">
      {title && (
        <h2 className="font-headline italic text-on-surface text-3xl mb-6">{title}</h2>
      )}
      <div className="overflow-x-auto rounded-lg border border-outline-variant/20">
        <table className="w-full text-sm">
          <thead className="bg-surface-container-low border-b border-outline-variant/20">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left font-label tracking-widest uppercase text-xs text-on-surface"
              >
                Feature
              </th>
              {columns.map((col, i) => (
                <th
                  key={i}
                  scope="col"
                  className="px-4 py-3 text-left font-label tracking-widest uppercase text-xs text-primary"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const highlight = highlightDifferences && isDifferent(row.values);
              return (
                <tr
                  key={i}
                  className={`border-b border-outline-variant/10 ${
                    highlight ? 'bg-primary/5' : ''
                  } hover:bg-surface-container-low/50 transition-colors`}
                >
                  <td className="px-4 py-3 text-on-surface font-medium">{row.feature}</td>
                  {row.values.map((val, j) => (
                    <td
                      key={j}
                      className={`px-4 py-3 ${
                        highlight ? 'text-primary font-medium' : 'text-on-surface-variant'
                      }`}
                    >
                      {val}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
