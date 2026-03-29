export interface AnnouncementBarData {
  text: string;
  linkLabel: string;
  linkUrl: string;
  startDate: string;
  endDate: string;
}

export function AnnouncementBar({ data }: { data: AnnouncementBarData }) {
  const now = new Date();
  if (data.startDate && new Date(data.startDate) > now) return null;
  if (data.endDate && new Date(data.endDate) < now) return null;

  return (
    <div className="w-full bg-surface-container-low py-3 flex justify-center items-center gap-4 border-b border-outline-variant/20">
      <p className="font-body text-xs tracking-wide text-on-surface">{data.text}</p>
      {data.linkLabel && data.linkUrl && (
        <a
          href={data.linkUrl}
          className="font-label text-xs font-bold uppercase border-b border-primary text-primary hover:text-on-surface transition-colors"
        >
          {data.linkLabel}
        </a>
      )}
    </div>
  );
}
