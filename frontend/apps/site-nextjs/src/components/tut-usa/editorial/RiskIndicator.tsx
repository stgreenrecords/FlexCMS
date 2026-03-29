export interface RiskIndicatorData {
  label: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  owner: string;
}

const riskConfig: Record<
  RiskIndicatorData['riskLevel'],
  { label: string; barClass: string; textClass: string; bgClass: string }
> = {
  low: {
    label: 'Low',
    barClass: 'bg-emerald-400',
    textClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10 border-emerald-500/20',
  },
  medium: {
    label: 'Medium',
    barClass: 'bg-amber-400',
    textClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10 border-amber-500/20',
  },
  high: {
    label: 'High',
    barClass: 'bg-orange-500',
    textClass: 'text-orange-400',
    bgClass: 'bg-orange-500/10 border-orange-500/20',
  },
  critical: {
    label: 'Critical',
    barClass: 'bg-red-500',
    textClass: 'text-red-400',
    bgClass: 'bg-red-500/10 border-red-500/20',
  },
};

const barWidthMap: Record<RiskIndicatorData['riskLevel'], string> = {
  low: 'w-1/4',
  medium: 'w-2/4',
  high: 'w-3/4',
  critical: 'w-full',
};

interface Props {
  data: RiskIndicatorData;
}

export function RiskIndicator({ data }: Props) {
  const { label, riskLevel, description, owner } = data;
  const config = riskConfig[riskLevel];

  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-3 ${config.bgClass}`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="font-label tracking-widest uppercase text-sm text-on-surface">
          {label}
        </span>
        <span className={`font-label tracking-widest uppercase text-xs font-bold ${config.textClass}`}>
          {config.label} Risk
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-outline-variant/20 overflow-hidden">
        <div className={`h-full rounded-full ${config.barClass} ${barWidthMap[riskLevel]}`} />
      </div>
      {description && (
        <p className="text-sm text-on-surface-variant leading-relaxed">{description}</p>
      )}
      {owner && (
        <span className="font-label tracking-widest uppercase text-xs text-on-surface-variant">
          Owner: {owner}
        </span>
      )}
    </div>
  );
}
