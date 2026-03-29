export interface TableData {
  caption: string;
  columns: { label: string; key: string }[];
  rows: Record<string, string>[];
  striped: boolean;
}

interface Props {
  data: TableData;
}

export function Table({ data }: Props) {
  const { caption, columns, rows, striped } = data;

  return (
    <div className="overflow-x-auto my-6 rounded-lg border border-outline-variant/20">
      <table className="w-full text-sm text-on-surface-variant">
        {caption && (
          <caption className="caption-bottom py-2 text-xs text-on-surface-variant/60 font-label tracking-widest uppercase">
            {caption}
          </caption>
        )}
        <thead className="bg-surface-container-low border-b border-outline-variant/20">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className="px-4 py-3 text-left font-label tracking-widest uppercase text-xs text-on-surface"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={`border-b border-outline-variant/10 ${
                striped && i % 2 !== 0 ? 'bg-surface-container-low' : ''
              } hover:bg-surface-container-low/50 transition-colors`}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3">
                  {row[col.key] ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
