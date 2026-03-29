export interface ComplianceChecklistData {
  title: string;
  items: { label: string; required: boolean; complete: boolean }[];
  owner: string;
  reviewDate: string;
}

interface Props {
  data: ComplianceChecklistData;
}

export function ComplianceChecklist({ data }: Props) {
  const { title, items, owner, reviewDate } = data;

  const completedCount = items.filter((i) => i.complete).length;

  return (
    <section className="py-6">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <h2 className="font-headline italic text-on-surface text-2xl">{title}</h2>
          <div className="flex gap-4 mt-1 text-xs font-label tracking-widest uppercase text-on-surface-variant">
            {owner && <span>Owner: {owner}</span>}
            {reviewDate && <span>Review: {reviewDate}</span>}
          </div>
        </div>
        <span className="font-label tracking-widest uppercase text-xs text-primary border border-primary/30 rounded px-2 py-0.5">
          {completedCount}/{items.length} complete
        </span>
      </div>
      <ul className="flex flex-col gap-3">
        {items.map((item, i) => (
          <li
            key={i}
            className={`flex items-start gap-3 p-4 rounded-lg border ${
              item.complete
                ? 'border-emerald-500/20 bg-emerald-500/5'
                : item.required
                ? 'border-amber-500/20 bg-amber-500/5'
                : 'border-outline-variant/20 bg-surface-container-low'
            }`}
          >
            <span
              className={`mt-0.5 shrink-0 text-lg leading-none ${
                item.complete ? 'text-emerald-400' : 'text-on-surface-variant/40'
              }`}
              aria-hidden="true"
            >
              {item.complete ? '✓' : '○'}
            </span>
            <div className="flex-1 flex items-start justify-between gap-3 flex-wrap">
              <span
                className={`text-sm leading-relaxed ${
                  item.complete ? 'text-on-surface line-through decoration-on-surface-variant/40' : 'text-on-surface-variant'
                }`}
              >
                {item.label}
              </span>
              {item.required && !item.complete && (
                <span className="font-label tracking-widest uppercase text-xs text-amber-400 shrink-0">
                  Required
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
