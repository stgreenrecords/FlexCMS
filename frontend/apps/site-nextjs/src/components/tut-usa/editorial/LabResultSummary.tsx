export interface LabResultSummaryData {
  title: string;
  summary: string;
  metrics: { label: string; value: string; unit: string }[];
  date: string;
}

interface Props {
  data: LabResultSummaryData;
}

export function LabResultSummary({ data }: Props) {
  const { title, summary, metrics, date } = data;

  return (
    <section className="py-6">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <h2 className="font-headline italic text-on-surface text-2xl">{title}</h2>
        {date && (
          <time
            dateTime={date}
            className="font-label tracking-widest uppercase text-xs text-on-surface-variant"
          >
            {date}
          </time>
        )}
      </div>
      {summary && (
        <p className="text-sm text-on-surface-variant leading-relaxed mb-6">{summary}</p>
      )}
      {metrics.length > 0 && (
        <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((m, i) => (
            <div
              key={i}
              className="bg-surface-container-low border border-outline-variant/20 rounded-lg p-4 flex flex-col gap-1"
            >
              <dt className="font-label tracking-widest uppercase text-xs text-on-surface-variant">
                {m.label}
              </dt>
              <dd className="font-headline italic text-on-surface text-2xl">
                {m.value}
                {m.unit && (
                  <span className="text-base text-on-surface-variant ml-1">{m.unit}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
