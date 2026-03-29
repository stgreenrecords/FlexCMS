export interface EstimatedReadTimeData {
  minutes: number;
  label: string;
}

interface Props {
  data: EstimatedReadTimeData;
}

export function EstimatedReadTime({ data }: Props) {
  const { minutes, label } = data;

  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-on-surface-variant text-sm" aria-hidden="true">
        🕐
      </span>
      <span className="font-label tracking-widest uppercase text-xs text-on-surface-variant">
        {label || `${minutes} min read`}
        {label && ` · ${minutes} min`}
      </span>
    </div>
  );
}
