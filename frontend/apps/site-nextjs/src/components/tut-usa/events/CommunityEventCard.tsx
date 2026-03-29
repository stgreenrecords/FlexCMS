export interface CommunityEventCardData {
  title: string;
  summary: string;
  dateTime: string;
  location: string;
  cta: { label: string; url: string };
}

export function CommunityEventCard({ data }: { data: CommunityEventCardData }) {
  return (
    <div className="bg-surface-container-low border border-outline-variant/30 p-8">
      <span className="font-label uppercase text-xs tracking-[0.3em] text-primary block mb-4">Community</span>
      <h3 className="font-headline italic text-2xl text-on-surface mb-3">{data.title}</h3>
      {data.dateTime && (
        <p className="font-label uppercase text-xs tracking-widest text-secondary mb-2">{data.dateTime}</p>
      )}
      {data.location && (
        <p className="font-label uppercase text-xs tracking-widest text-secondary mb-4">{data.location}</p>
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
