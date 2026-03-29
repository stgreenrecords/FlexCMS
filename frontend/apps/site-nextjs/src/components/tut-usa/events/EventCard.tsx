export interface EventCardData {
  eventName: string;
  summary: string;
  startDate: string;
  location: string;
  cta: { label: string; url: string };
}

export function EventCard({ data }: { data: EventCardData }) {
  return (
    <div className="bg-surface-container border border-outline-variant/30 p-8">
      {data.startDate && (
        <span className="font-label uppercase text-xs tracking-widest text-primary block mb-2">{data.startDate}</span>
      )}
      <h3 className="font-headline italic text-2xl text-on-surface mb-3">{data.eventName}</h3>
      {data.location && (
        <p className="font-label text-xs uppercase tracking-widest text-secondary mb-3">{data.location}</p>
      )}
      {data.summary && <p className="font-body text-sm text-secondary mb-6">{data.summary}</p>}
      {data.cta?.label && (
        <a href={data.cta.url} className="font-label uppercase text-xs tracking-widest text-primary hover:underline">
          {data.cta.label} →
        </a>
      )}
    </div>
  );
}
