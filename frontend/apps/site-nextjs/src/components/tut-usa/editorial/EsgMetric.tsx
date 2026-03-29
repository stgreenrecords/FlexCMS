export interface EsgMetricData {
  label: string;
  value: string;
  reportingPeriod: string;
  methodologyNote: string;
}

interface Props {
  data: EsgMetricData;
}

export function EsgMetric({ data }: Props) {
  const { label, value, reportingPeriod, methodologyNote } = data;

  return (
    <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-6 flex flex-col gap-2">
      <span className="font-label tracking-widest uppercase text-xs text-on-surface-variant">
        {label}
      </span>
      <span className="font-headline italic text-on-surface text-3xl">{value}</span>
      {reportingPeriod && (
        <span className="font-label tracking-widest uppercase text-xs text-primary">
          {reportingPeriod}
        </span>
      )}
      {methodologyNote && (
        <p className="text-xs text-on-surface-variant/70 leading-relaxed border-t border-outline-variant/20 pt-2 mt-1">
          {methodologyNote}
        </p>
      )}
    </div>
  );
}
