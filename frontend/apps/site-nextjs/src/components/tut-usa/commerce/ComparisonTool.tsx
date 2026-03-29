export interface ComparisonItem {
  name: string;
  image: string;
  values: Record<string, string>;
}

export interface ComparisonToolData {
  title: string;
  items: ComparisonItem[];
  comparisonFields: string[];
  maxItems: number;
}

export function ComparisonTool({ data }: { data: ComparisonToolData }) {
  const displayed = data.items?.slice(0, data.maxItems || 4) ?? [];
  return (
    <section className="bg-background py-12 px-6 overflow-x-auto">
      <h2 className="font-headline italic text-3xl text-on-surface mb-8">{data.title}</h2>
      {displayed.length > 0 && data.comparisonFields && (
        <table className="w-full min-w-max">
          <thead>
            <tr>
              <th className="text-left py-4 pr-8 font-label uppercase text-xs tracking-widest text-secondary w-40">Feature</th>
              {displayed.map((item, i) => (
                <th key={i} className="text-center py-4 px-6">
                  {item.image && <img src={item.image} alt={item.name} className="w-24 h-16 object-cover mx-auto mb-2" />}
                  <span className="font-label text-xs uppercase tracking-widest text-on-surface">{item.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.comparisonFields.map((field, fi) => (
              <tr key={fi} className="border-t border-outline-variant/20">
                <td className="py-4 pr-8 font-label uppercase text-xs tracking-widest text-secondary">{field}</td>
                {displayed.map((item, ii) => (
                  <td key={ii} className="py-4 px-6 text-center font-body text-sm text-on-surface">
                    {item.values?.[field] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
