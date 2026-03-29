export interface WorkshopCardData {
  title: string;
  summary: string;
  dateTime: string;
  instructor: string;
  cta: { label: string; url: string };
}

export function WorkshopCard({ data }: { data: WorkshopCardData }) {
  return (
    <div className="bg-surface-container border border-outline-variant/30 p-8">
      <span className="font-label uppercase text-xs tracking-[0.3em] text-primary block mb-4">Workshop</span>
      <h3 className="font-headline italic text-2xl text-on-surface mb-3">{data.title}</h3>
      {data.dateTime && (
        <p className="font-label uppercase text-xs tracking-widest text-secondary mb-3">{data.dateTime}</p>
      )}
      {data.instructor && (
        <p className="font-label text-xs text-secondary mb-4">Led by <span className="text-on-surface">{data.instructor}</span></p>
      )}
      {data.summary && <p className="font-body text-sm text-secondary mb-6">{data.summary}</p>}
      {data.cta?.label && (
        <a href={data.cta.url} className="bg-primary text-on-primary px-8 py-3 font-label uppercase text-xs tracking-widest hover:bg-primary-fixed transition-all inline-block">
          {data.cta.label}
        </a>
      )}
    </div>
  );
}
