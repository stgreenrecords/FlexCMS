export interface DesignToken {
  name: string;
  value: string;
  category: string;
  description: string;
}

export interface DesignTokenTableData {
  title: string;
  tokens: DesignToken[];
  platform: string;
}

export function DesignTokenTable({ data }: { data: DesignTokenTableData }) {
  return (
    <section className="py-10 bg-surface">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        {data.title && (
          <h2 className="text-2xl font-semibold text-on-surface">{data.title}</h2>
        )}
        {data.platform && (
          <span className="text-xs text-on-surface-variant bg-surface-container-low px-3 py-1 rounded-full">
            Platform: {data.platform}
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-container-highest text-on-surface-variant text-left">
              <th className="px-4 py-3 font-semibold">Token</th>
              <th className="px-4 py-3 font-semibold">Value</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Description</th>
            </tr>
          </thead>
          <tbody>
            {data.tokens?.map((token, i) => (
              <tr
                key={i}
                className={`border-t border-surface-container-highest ${
                  i % 2 === 0 ? 'bg-surface-container-low' : 'bg-surface'
                }`}
              >
                <td className="px-4 py-3 font-mono text-primary">{token.name}</td>
                <td className="px-4 py-3 font-mono text-on-surface">{token.value}</td>
                <td className="px-4 py-3 text-on-surface-variant">{token.category}</td>
                <td className="px-4 py-3 text-on-surface-variant">{token.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
