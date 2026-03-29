export interface InvestorMetricData {
  label: string;
  value: string;
  period: string;
  trend: 'up' | 'down' | 'flat';
}

interface Props {
  data: InvestorMetricData;
}

export function InvestorMetric({ data }: Props) {
  const { label, value, period, trend } = data;

  const trendIcon =
    trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—';

  const trendColor =
    trend === 'up'
      ? 'text-[var(--color-success)]'
      : trend === 'down'
      ? 'text-[var(--color-error)]'
      : 'text-[var(--color-on-surface-variant)]';

  return (
    <div className="bg-surface-container rounded-xl p-6 flex flex-col gap-2 border border-outline-variant">
      <span className="font-label text-sm text-[var(--color-on-surface-variant)]">{label}</span>
      <span className="font-headline text-3xl text-[var(--color-on-surface)]">{value}</span>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-label ${trendColor}`}>{trendIcon}</span>
        <span className="text-sm text-[var(--color-on-surface-variant)]">{period}</span>
      </div>
    </div>
  );
}
