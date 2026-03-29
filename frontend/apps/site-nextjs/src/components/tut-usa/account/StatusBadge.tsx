export interface StatusBadgeData {
  label: string;
  status: string;
  tooltip: string;
}

export function StatusBadge({ data }: { data: StatusBadgeData }) {
  const colorMap: Record<string, string> = {
    active: 'bg-primary/20 text-primary',
    inactive: 'bg-outline-variant/20 text-secondary',
    pending: 'bg-secondary-container text-on-surface',
    error: 'bg-error-container text-on-error-container',
    cancelled: 'bg-error-container/50 text-error',
  };
  const colorClass = colorMap[data.status] ?? 'bg-outline-variant/20 text-secondary';
  return (
    <span
      className={`inline-flex items-center px-3 py-1 font-label uppercase text-xs tracking-widest ${colorClass}`}
      title={data.tooltip}
    >
      {data.label}
    </span>
  );
}
