export interface EscalationMatrixData {
  title: string;
  levels: { level: string; contact: string; responseTime: string; escalateTo?: string }[];
  owner: string;
  lastReviewed: string;
}

interface Props {
  data: EscalationMatrixData;
}

export function EscalationMatrix({ data }: Props) {
  const { title, levels, owner, lastReviewed } = data;

  return (
    <section className="bg-surface-container rounded-xl p-6 border border-outline-variant">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <h2 className="font-headline text-xl text-[var(--color-on-surface)]">{title}</h2>
        <dl className="flex gap-x-6 gap-y-1 flex-wrap text-xs text-[var(--color-on-surface-variant)]">
          <div className="flex gap-1">
            <dt className="font-label">Owner:</dt>
            <dd>{owner}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="font-label">Last reviewed:</dt>
            <dd><time dateTime={lastReviewed}>{lastReviewed}</time></dd>
          </div>
        </dl>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-outline-variant">
              <th className="text-left py-2 px-3 font-label text-[var(--color-on-surface-variant)]">Level</th>
              <th className="text-left py-2 px-3 font-label text-[var(--color-on-surface-variant)]">Contact</th>
              <th className="text-left py-2 px-3 font-label text-[var(--color-on-surface-variant)]">Response Time</th>
              <th className="text-left py-2 px-3 font-label text-[var(--color-on-surface-variant)]">Escalates To</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((row, i) => (
              <tr
                key={i}
                className="border-b border-outline-variant last:border-0 hover:bg-[var(--color-surface-container-high)] transition-colors"
              >
                <td className="py-2 px-3 font-label text-[var(--color-primary)]">{row.level}</td>
                <td className="py-2 px-3 text-[var(--color-on-surface)]">{row.contact}</td>
                <td className="py-2 px-3 text-[var(--color-on-surface)]">{row.responseTime}</td>
                <td className="py-2 px-3 text-[var(--color-on-surface-variant)]">{row.escalateTo ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
