export interface RunbookSectionData {
  title: string;
  steps: { step: string; details: string }[];
  owner: string;
  relatedSystems: string[];
}

interface Props {
  data: RunbookSectionData;
}

export function RunbookSection({ data }: Props) {
  const { title, steps, owner, relatedSystems } = data;

  return (
    <section className="py-6">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <h2 className="font-headline italic text-on-surface text-2xl">{title}</h2>
        {owner && (
          <span className="font-label tracking-widest uppercase text-xs text-on-surface-variant">
            Owner: {owner}
          </span>
        )}
      </div>
      {relatedSystems.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="font-label tracking-widest uppercase text-xs text-on-surface-variant mr-1">
            Systems:
          </span>
          {relatedSystems.map((sys, i) => (
            <span
              key={i}
              className="text-xs font-mono text-primary border border-primary/30 rounded px-2 py-0.5"
            >
              {sys}
            </span>
          ))}
        </div>
      )}
      <ol className="flex flex-col gap-4">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-4">
            <span className="shrink-0 w-6 h-6 rounded-full border border-primary text-primary text-xs font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <div className="flex flex-col gap-1">
              <strong className="text-sm text-on-surface font-medium">{s.step}</strong>
              {s.details && (
                <p className="text-xs text-on-surface-variant leading-relaxed font-mono bg-surface-container-low rounded p-2">
                  {s.details}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
