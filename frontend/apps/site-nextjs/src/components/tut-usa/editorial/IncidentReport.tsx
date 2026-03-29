export interface IncidentReportData {
  title: string;
  summary: string;
  severity: 'P1' | 'P2' | 'P3' | 'P4';
  dateTime: string;
  actionsTaken: string[];
}

const severityConfig: Record<
  IncidentReportData['severity'],
  { textClass: string; borderClass: string }
> = {
  P1: { textClass: 'text-red-400', borderClass: 'border-red-500/30' },
  P2: { textClass: 'text-orange-400', borderClass: 'border-orange-500/30' },
  P3: { textClass: 'text-amber-400', borderClass: 'border-amber-500/30' },
  P4: { textClass: 'text-on-surface-variant', borderClass: 'border-outline-variant/20' },
};

interface Props {
  data: IncidentReportData;
}

export function IncidentReport({ data }: Props) {
  const { title, summary, severity, dateTime, actionsTaken } = data;
  const config = severityConfig[severity];

  return (
    <article className={`bg-surface-container-low border rounded-xl p-6 flex flex-col gap-4 ${config.borderClass}`}>
      <header className="flex items-start justify-between flex-wrap gap-3">
        <h3 className="font-headline italic text-on-surface text-xl">{title}</h3>
        <div className="flex items-center gap-3">
          <span className={`font-label tracking-widest uppercase text-xs font-bold ${config.textClass}`}>
            {severity}
          </span>
          {dateTime && (
            <time
              dateTime={dateTime}
              className="font-label tracking-widest uppercase text-xs text-on-surface-variant"
            >
              {dateTime}
            </time>
          )}
        </div>
      </header>
      {summary && (
        <p className="text-sm text-on-surface-variant leading-relaxed">{summary}</p>
      )}
      {actionsTaken.length > 0 && (
        <div>
          <h4 className="font-label tracking-widest uppercase text-xs text-on-surface mb-3">
            Actions Taken
          </h4>
          <ol className="flex flex-col gap-2 list-decimal list-inside text-sm text-on-surface-variant">
            {actionsTaken.map((action, i) => (
              <li key={i}>{action}</li>
            ))}
          </ol>
        </div>
      )}
    </article>
  );
}
