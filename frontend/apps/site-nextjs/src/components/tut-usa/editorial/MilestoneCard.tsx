export interface MilestoneCardData {
  title: string;
  date: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed';
}

const statusConfig: Record<
  MilestoneCardData['status'],
  { label: string; className: string; dotClass: string }
> = {
  planned: {
    label: 'Planned',
    className: 'text-on-surface-variant border-outline-variant/30',
    dotClass: 'bg-on-surface-variant',
  },
  'in-progress': {
    label: 'In Progress',
    className: 'text-amber-400 border-amber-500/30',
    dotClass: 'bg-amber-400',
  },
  completed: {
    label: 'Completed',
    className: 'text-emerald-400 border-emerald-500/30',
    dotClass: 'bg-emerald-400',
  },
};

interface Props {
  data: MilestoneCardData;
}

export function MilestoneCard({ data }: Props) {
  const { title, date, description, status } = data;
  const config = statusConfig[status];

  return (
    <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        {date && (
          <time
            dateTime={date}
            className="font-label tracking-widest uppercase text-xs text-on-surface-variant"
          >
            {date}
          </time>
        )}
        <span
          className={`flex items-center gap-1.5 text-xs font-label tracking-widest uppercase border rounded-full px-2 py-0.5 ${config.className}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dotClass}`} />
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
