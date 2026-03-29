export interface RoadmapCardData {
  title: string;
  quarter: string;
  description: string;
  status: 'planned' | 'in-progress' | 'shipped';
}

const statusConfig: Record<
  RoadmapCardData['status'],
  { label: string; badgeClass: string }
> = {
  planned: {
    label: 'Planned',
    badgeClass: 'bg-surface text-on-surface-variant border border-outline-variant/30',
  },
  'in-progress': {
    label: 'In Progress',
    badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
  },
  shipped: {
    label: 'Shipped',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
  },
};

interface Props {
  data: RoadmapCardData;
}

export function RoadmapCard({ data }: Props) {
  const { title, quarter, description, status } = data;
  const config = statusConfig[status];

  return (
    <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        {quarter && (
          <span className="font-label tracking-widest uppercase text-xs text-primary">
            {quarter}
          </span>
        )}
        <span
          className={`text-xs font-label tracking-widest uppercase rounded-full px-2 py-0.5 ${config.badgeClass}`}
        >
          {config.label}
        </span>
      </div>
      <h3 className="font-headline italic text-on-surface text-lg">{title}</h3>
      {description && (
        <p className="text-sm text-on-surface-variant leading-relaxed">{description}</p>
      )}
    </div>
  );
}
