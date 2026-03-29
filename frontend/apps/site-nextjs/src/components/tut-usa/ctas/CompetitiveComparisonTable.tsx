export interface CompetitorColumn {
  name: string;
  values: string[];
}

export interface ComparisonCriterion {
  name: string;
}

export interface CompetitiveComparisonTableData {
  title: string;
  competitors: CompetitorColumn[];
  criteria: ComparisonCriterion[];
  visibility: 'public' | 'internal';
}

export function CompetitiveComparisonTable({ data }: { data: CompetitiveComparisonTableData }) {
  return (
    <section className="px-12 py-32 bg-surface">
      {data.title && (
        <h2 className="font-headline italic text-4xl mb-12 text-center text-on-surface">
          {data.title}
        </h2>
      )}
      <div className="max-w-5xl mx-auto w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/30">
              <th className="py-6 font-label text-xs uppercase tracking-[0.2em] text-secondary">
                Feature
              </th>
              {data.competitors &&
                data.competitors.map((c, i) => (
                  <th
                    key={i}
                    className={`py-6 font-label text-xs uppercase tracking-[0.2em] ${i === 0 ? 'text-primary' : 'text-secondary'}`}
                  >
                    {c.name}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody className="font-body text-sm">
            {data.criteria &&
              data.criteria.map((criterion, ri) => (
                <tr key={ri} className="border-b border-outline-variant/10">
                  <td className="py-8 text-on-surface font-bold">{criterion.name}</td>
                  {data.competitors &&
                    data.competitors.map((c, ci) => (
                      <td
                        key={ci}
                        className={`py-8 ${ci === 0 ? 'text-on-surface' : 'text-secondary'}`}
                      >
                        {c.values?.[ri] ?? '—'}
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
