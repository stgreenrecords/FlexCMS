export interface PromoCardData {
  title: string;
  description: string;
  items: string[];
  layout: 'grid' | 'list';
  cta: { label: string; url: string };
}

export function PromoCard({ data }: { data: PromoCardData }) {
  return (
    <div className="bg-surface-container p-8 flex flex-col gap-6">
      <h3 className="font-headline italic text-2xl text-on-surface">{data.title}</h3>
      {data.description && (
        <p className="font-body text-sm text-secondary">{data.description}</p>
      )}
      {data.items && data.items.length > 0 && (
        <div className={data.layout === 'list' ? 'flex flex-col gap-3' : 'grid grid-cols-2 gap-3'}>
          {data.items.map((ref, i) => (
            <div key={i} className="bg-surface-container-high p-4 text-xs font-body text-secondary">
              {ref}
            </div>
          ))}
        </div>
      )}
      {data.cta?.label && (
        <a
          href={data.cta.url}
          className="font-label text-xs font-bold uppercase border-b border-primary text-primary hover:text-on-surface transition-colors self-start"
        >
          {data.cta.label}
        </a>
      )}
    </div>
  );
}
