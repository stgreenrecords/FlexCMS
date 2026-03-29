export interface KpiCardData {
  title: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  supportingText: string;
  /** KPI icon — 48×48 */
  icon: string;
}

const trendConfig: Record<
  KpiCardData['trend'],
  { label: string; className: string }
> = {
  up: { label: '▲', className: 'text-emerald-400' },
  down: { label: '▼', className: 'text-red-400' },
  neutral: { label: '—', className: 'text-on-surface-variant' },
};

interface Props {
  data: KpiCardData;
}

export function KpiCard({ data }: Props) {
  const { title, value, trend, supportingText, icon } = data;
  const trendInfo = trendConfig[trend];

  return (
    <div className="bg-surface-container-low rounded-xl border border-outline-variant/20 p-6 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="font-label tracking-widest uppercase text-xs text-on-surface-variant">
          {title}
        </span>
        {icon && (
          <img
            src={icon}
            alt=""
            width={48}
            height={48}
            className="shrink-0 opacity-70"
            aria-hidden="true"
          />
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className="font-headline italic text-4xl text-on-surface">{value}</span>
        <span className={`text-lg font-bold mb-1 ${trendInfo.className}`} aria-label={`Trend: ${trend}`}>
          {trendInfo.label}
        </span>
      </div>
      {supportingText && (
        <p className="text-sm text-on-surface-variant">{supportingText}</p>
      )}
    </div>
  );
}
