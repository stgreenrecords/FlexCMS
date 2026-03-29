export interface ComparisonCardData {
  title: string;
  summary: string;
  cta: { label: string; url: string };
  badge: string;
}

export function ComparisonCard({ data }: { data: ComparisonCardData }) {
  return (
    <div className="bg-surface-container border border-outline-variant/30 p-8 relative">
      {data.badge && (
        <span className="absolute top-4 right-4 bg-primary text-on-primary px-3 py-1 font-label uppercase text-xs tracking-widest">
          {data.badge}
        </span>
      )}
      <h3 className="font-headline italic text-2xl text-on-surface mb-4">{data.title}</h3>
      {data.summary && <p className="font-body text-sm text-secondary mb-6">{data.summary}</p>}
      {data.cta?.label && (
        <a
          href={data.cta.url}
          className="inline-flex items-center gap-2 font-label uppercase text-xs tracking-widest text-primary hover:underline"
        >
          {data.cta.label} →
        </a>
      )}
    </div>
  );
}
